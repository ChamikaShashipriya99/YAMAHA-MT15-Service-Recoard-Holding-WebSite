import { SignJWT, jwtVerify } from "jose";
import { generateURI, verifySync, generateSecret } from "otplib";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import UserSettings from "@/models/UserSettings";

export const SESSION_COOKIE_NAME = "mt15_auth_session";

const JWT_SECRET = process.env.AUTH_JWT_SECRET || "yamaha_mt15_super_secret_jwt_key_2026";
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

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
        };
    } catch {
        return {
            username: AUTH_CONFIG.username,
            passwordHash: null,
            totpSecret: AUTH_CONFIG.totpSecret,
        };
    }
}

/**
 * Creates a signed JWT session token
 */
export async function createSession(username: string): Promise<string> {
    return await new SignJWT({ username })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(SECRET_KEY);
}

/**
 * Verifies a JWT session token
 */
export async function verifySession(token: string) {
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        return payload;
    } catch {
        return null;
    }
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
