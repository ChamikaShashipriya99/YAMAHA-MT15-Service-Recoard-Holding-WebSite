import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { connectToDatabase } from "@/lib/mongodb";
import UserSettings from "@/models/UserSettings";
import {
    AUTH_CONFIG,
    createNewTotpSecret,
    getTotpUri,
    verifyTotp,
    verifyCredentialsAsync,
    getEffectiveCredentials,
    createSession,
    SESSION_COOKIE_NAME,
    verifyRequestSession,
} from "@/lib/auth";
import { checkRateLimit, recordAttempt, resetRateLimit, getClientIp } from "@/lib/rateLimit";

// GET /api/settings/2fa - Generate a new secret and QR code for pairing preview
export async function GET(request: NextRequest) {
    try {
        const session = await verifyRequestSession(request);
        if (!session) {
            return NextResponse.json(
                { success: false, error: "Unauthorized: Active session required." },
                { status: 401 }
            );
        }

        const currentCreds = await getEffectiveCredentials();
        const newSecret = createNewTotpSecret();
        const uri = getTotpUri(newSecret);

        const qrCodeDataUrl = await QRCode.toDataURL(uri, {
            errorCorrectionLevel: "M",
            margin: 2,
            color: {
                dark: "#000000",
                light: "#ffffff",
            },
            width: 256,
        });

        return NextResponse.json({
            success: true,
            currentSecret: currentCreds.totpSecret,
            newSecret,
            qrCodeDataUrl,
            username: AUTH_CONFIG.username,
        });
    } catch (error: any) {
        console.error("Generate 2FA Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to generate new 2FA secret" },
            { status: 500 }
        );
    }
}

// POST /api/settings/2fa - Verify test code with new secret and commit to database
export async function POST(request: NextRequest) {
    try {
        const session = await verifyRequestSession(request);
        if (!session) {
            return NextResponse.json(
                { success: false, error: "Unauthorized: Active session required." },
                { status: 401 }
            );
        }

        const clientIp = getClientIp(request);
        const rateLimitKey = `2fa_change_${clientIp}`;

        // Rate limit: 5 attempts per 15 minutes
        const rateCheck = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
        if (!rateCheck.allowed) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Too many 2FA configuration attempts. Locked for ${Math.ceil(
                        rateCheck.retryAfterSeconds / 60
                    )} minutes.`,
                },
                {
                    status: 429,
                    headers: { "Retry-After": String(rateCheck.retryAfterSeconds) },
                }
            );
        }

        const body = await request.json();
        const { currentPassword, newSecret, confirmationCode } = body;

        if (!currentPassword || !newSecret || !confirmationCode) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Current password, new secret, and confirmation code are required",
                },
                { status: 400 }
            );
        }

        // 1. Verify Current Password
        const isPasswordValid = await verifyCredentialsAsync(AUTH_CONFIG.username, currentPassword);
        if (!isPasswordValid) {
            recordAttempt(rateLimitKey, 15 * 60 * 1000);
            return NextResponse.json(
                { success: false, error: "Current password is incorrect" },
                { status: 401 }
            );
        }

        // 2. Verify Confirmation Code with the NEW secret
        const isCodeValid = verifyTotp(confirmationCode, newSecret);
        if (!isCodeValid) {
            recordAttempt(rateLimitKey, 15 * 60 * 1000);
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid 6-digit code. Please verify the code displayed in Google Authenticator for this new secret.",
                },
                { status: 400 }
            );
        }

        resetRateLimit(rateLimitKey);

        // 3. Commit new secret to MongoDB UserSettings and increment tokenVersion to revoke old sessions
        await connectToDatabase();
        const updatedUser = await UserSettings.findOneAndUpdate(
            { username: AUTH_CONFIG.username },
            {
                $set: {
                    username: AUTH_CONFIG.username,
                    totpSecret: newSecret,
                    updatedAt: new Date(),
                },
                $inc: { tokenVersion: 1 },
            },
            { upsert: true, new: true }
        );

        // 4. Issue a refreshed session cookie with the new tokenVersion for this active session
        const newToken = await createSession(AUTH_CONFIG.username, updatedUser.tokenVersion);
        const response = NextResponse.json({
            success: true,
            message: "Google Authenticator re-paired successfully! All other active sessions have been revoked.",
        });

        response.cookies.set({
            name: SESSION_COOKIE_NAME,
            value: newToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 7 * 24 * 60 * 60,
        });

        return response;
    } catch (error: any) {
        console.error("Commit 2FA Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to commit 2FA secret" },
            { status: 500 }
        );
    }
}
