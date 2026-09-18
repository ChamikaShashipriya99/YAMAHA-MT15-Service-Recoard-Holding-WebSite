import { SignJWT, jwtVerify } from "jose";
import { generateURI, verifySync, generateSecret } from "otplib";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import UserSettings from "@/models/UserSettings";

export const SESSION_COOKIE_NAME = "mt15_auth_session";

const JWT_SECRET = process.env.AUTH_JWT_SECRET || "yamaha_mt15_super_secret_jwt_key_2026";
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

// Validate JWT secret strength in production
if (process.env.NODE_ENV === "production") {
    if (!process.env.AUTH_JWT_SECRET || process.env.AUTH_JWT_SECRET === "yamaha_mt15_super_secret_jwt_key_2026") {
        console.warn("⚠️ SECURITY WARNING: Please set a strong, custom AUTH_JWT_SECRET in your production environment variables.");
    }
}

export const AUTH_CONFIG = {
    username: process.env.AUTH_USERNAME || "Chamikaz99",
    password: process.env.AUTH_PASSWORD || "Chamika020511",
    totpSecret: process.env.AUTH_TOTP_SECRET || "7D6VWDQDJWD24OAN5PI5LIBTSR46EPLW",
};

/**
 * Retrieves the currently active credentials from MongoDB Atlas (falls back to .env)
 */
export async function getEffectiveCredentials() {
    try {
        await connectToDatabase();
        const settings = await UserSettings.findOne({ username: AUTH_CONFIG.username });
        return {
            username: AUTH_CONFIG.username,
            passwordHash: settings?.passwordHash || null,
            totpSecret: settings?.totpSecret || AUTH_CONFIG.totpSecret,
            tokenVersion: settings?.tokenVersion ?? 1,
        };
    } catch {
        return {
            username: AUTH_CONFIG.username,
            passwordHash: null,
            totpSecret: AUTH_CONFIG.totpSecret,
            tokenVersion: 1,
        };
    }
}

/**
 * Creates a signed JWT session token with embedded tokenVersion for instant revocation
 */
export async function createSession(username: string, tokenVersion: number = 1): Promise<string> {
    return await new SignJWT({ username, tokenVersion })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(SECRET_KEY);
}

/**
 * Verifies a JWT session token and optionally validates against database tokenVersion
 */
export async function verifySession(token: string, checkDbVersion: boolean = false) {
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        if (checkDbVersion && payload.username) {
            const creds = await getEffectiveCredentials();
            if (payload.tokenVersion !== undefined && payload.tokenVersion !== creds.tokenVersion) {
                return null; // Token version mismatch -> session was revoked
            }
        }
        return payload;
    } catch {
        return null;
    }
}

/**
 * Validates the session cookie on a request against MongoDB tokenVersion to enforce instant revocation
 */
export async function verifyRequestSession(request: { cookies: { get: (name: string) => { value: string } | undefined } }) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySession(token, true);
}

/**
 * Verifies Username and Password against database with .env fallback
 */
export async function verifyCredentialsAsync(username: string, password: string): Promise<boolean> {
    if (username.trim().toLowerCase() !== AUTH_CONFIG.username.trim().toLowerCase()) {
        return false;
    }
    const creds = await getEffectiveCredentials();
    if (creds.passwordHash) {
        return bcrypt.compareSync(password, creds.passwordHash);
    }
    return password === AUTH_CONFIG.password;
}

/**
 * Synchronous credential verification fallback
 */
export function verifyCredentials(username: string, password: string): boolean {
    return (
        username.trim().toLowerCase() === AUTH_CONFIG.username.trim().toLowerCase() &&
        password === AUTH_CONFIG.password
    );
}

/**
 * Generates OTP Auth URI for QR code generation
 */
export function getTotpUri(secret: string = AUTH_CONFIG.totpSecret): string {
    return generateURI({
        secret,
        label: AUTH_CONFIG.username,
        issuer: "Yamaha MT-15",
    });
}

/**
 * Verifies TOTP against database-stored secret with .env fallback
 */
export async function verifyTotpAsync(token: string | number): Promise<boolean> {
    const creds = await getEffectiveCredentials();
    return verifyTotp(token, creds.totpSecret);
}

/**
 * Verifies a 6-digit Google Authenticator code
 */
export function verifyTotp(token: string | number, secret: string = AUTH_CONFIG.totpSecret): boolean {
    const cleanToken = String(token || "").replace(/\s+/g, "").trim();
    if (!cleanToken || cleanToken.length !== 6) return false;

    try {
        const result = verifySync({
            token: cleanToken,
            secret,
        });
        return result.valid;
    } catch (e) {
        console.error("TOTP verification error:", e);
        return false;
    }
}

/**
 * Generates a new random Base32 secret
 */
export function createNewTotpSecret(): string {
    return generateSecret();
}

/**
 * Generates single-use emergency backup recovery codes
 */
export function generateRecoveryCodes(count: number = 8): {
    plainCodes: string[];
    hashedCodes: { codeHash: string; used: boolean }[];
} {
    const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Base32 without ambiguous characters
    const plainCodes: string[] = [];
    const hashedCodes: { codeHash: string; used: boolean }[] = [];

    for (let i = 0; i < count; i++) {
        let part1 = "";
        let part2 = "";
        for (let j = 0; j < 4; j++) {
            part1 += chars[Math.floor(Math.random() * chars.length)];
            part2 += chars[Math.floor(Math.random() * chars.length)];
        }
        const code = `${part1}-${part2}`;
        plainCodes.push(code);

        const salt = bcrypt.genSaltSync(10);
        const codeHash = bcrypt.hashSync(code.replace(/[^A-Za-z0-9]/g, "").toUpperCase(), salt);
        hashedCodes.push({ codeHash, used: false });
    }

    return { plainCodes, hashedCodes };
}

/**
 * Verifies and atomically consumes a single-use emergency recovery code
 */
export async function verifyAndConsumeRecoveryCode(inputCode: string): Promise<boolean> {
    if (!inputCode) return false;
    const cleanCode = inputCode.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (cleanCode.length < 6) return false;

    try {
        await connectToDatabase();
        const user = await UserSettings.findOne({ username: AUTH_CONFIG.username });
        if (!user || !user.recoveryCodes || user.recoveryCodes.length === 0) {
            return false;
        }

        for (const entry of user.recoveryCodes) {
            if (!entry.used && bcrypt.compareSync(cleanCode, entry.codeHash)) {
                entry.used = true;
                entry.usedAt = new Date();
                await user.save();
                return true;
            }
        }

        return false;
    } catch (error) {
        console.error("Recovery code verification error:", error);
        return false;
    }
}
