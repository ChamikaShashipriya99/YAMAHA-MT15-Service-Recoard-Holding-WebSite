import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import {
    AUTH_CONFIG,
    getTotpUri,
    getEffectiveCredentials,
    verifyRequestSession,
    verifyCredentialsAsync,
    verifyTotpAsync,
} from "@/lib/auth";
import { checkRateLimitAsync, recordAttemptAsync, resetRateLimitAsync, getClientIp } from "@/lib/rateLimit";
import { logSecurityEvent } from "@/lib/audit";

// Helper to generate the QR Code payload
async function generateQrPayload(secret: string) {
    const uri = getTotpUri(secret);
    const qrCodeDataUrl = await QRCode.toDataURL(uri, {
        errorCorrectionLevel: "M",
        margin: 2,
        color: {
            dark: "#000000",
            light: "#ffffff",
        },
        width: 256,
    });
    return { uri, qrCodeDataUrl };
}

// GET /api/auth/setup-2fa - Only allowed if operator has an active authenticated session
export async function GET(request: NextRequest) {
    try {
        const session = await verifyRequestSession(request);
        if (!session) {
            return NextResponse.json({
                success: true,
                authenticated: false,
                message: "Authentication required to generate 2FA pairing QR.",
            });
        }

        const creds = await getEffectiveCredentials();
        const secret = creds.totpSecret;
        const { uri, qrCodeDataUrl } = await generateQrPayload(secret);

        return NextResponse.json({
            success: true,
            authenticated: true,
            username: AUTH_CONFIG.username,
            secret,
            qrCodeDataUrl,
            uri,
        });
    } catch (error: any) {
        console.error("2FA Setup GET Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to generate 2FA setup data" },
            { status: 500 }
        );
    }
}

// POST /api/auth/setup-2fa - Unlock QR code with master password or verify test TOTP code
export async function POST(request: NextRequest) {
    try {
        const clientIp = getClientIp(request);
        const rateLimitKey = `setup_2fa_${clientIp}`;

        // Rate limit: 5 attempts per 15 minutes
        const rateCheck = await checkRateLimitAsync(rateLimitKey, 5, 15 * 60 * 1000);
        if (!rateCheck.allowed) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Too many attempts. Terminal locked for security. Please try again in ${Math.ceil(
                        rateCheck.retryAfterSeconds / 60
                    )} minutes.`,
                },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { action, password, totpCode } = body;

        // Action 1: Test 6-digit TOTP code
        if (action === "test_code") {
            if (!totpCode || totpCode.length !== 6) {
                return NextResponse.json(
                    { success: false, error: "Please enter a valid 6-digit code" },
                    { status: 400 }
                );
            }

            const isTotpValid = await verifyTotpAsync(totpCode);
            if (!isTotpValid) {
                await recordAttemptAsync(rateLimitKey, 15 * 60 * 1000);
                return NextResponse.json(
                    { success: false, error: "Code mismatch. Check your phone clock and Google Authenticator app." },
                    { status: 401 }
                );
            }

            await resetRateLimitAsync(rateLimitKey);
            return NextResponse.json({
                success: true,
                valid: true,
                message: "Code verified successfully! Google Authenticator is synchronized.",
            });
        }

        // Action 2: Authenticate with password to unlock 2FA secret and QR code
        if (!password) {
            return NextResponse.json(
                { success: false, error: "Master password is required to reveal 2FA pairing data" },
                { status: 400 }
            );
        }

        const isPasswordValid = await verifyCredentialsAsync(AUTH_CONFIG.username, password);
        if (!isPasswordValid) {
            await recordAttemptAsync(rateLimitKey, 15 * 60 * 1000);
            await logSecurityEvent({
                eventType: "LOGIN_FAILED",
                status: "WARNING",
                request,
                details: "Invalid password attempt on /api/auth/setup-2fa",
            });

            return NextResponse.json(
                { success: false, error: "Invalid master password" },
                { status: 401 }
            );
        }

        await resetRateLimitAsync(rateLimitKey);
        const creds = await getEffectiveCredentials();
        const secret = creds.totpSecret;
        const { uri, qrCodeDataUrl } = await generateQrPayload(secret);

        return NextResponse.json({
            success: true,
            authenticated: true,
            username: AUTH_CONFIG.username,
            secret,
            qrCodeDataUrl,
            uri,
        });
    } catch (error: any) {
        console.error("2FA Setup POST Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to process 2FA request" },
            { status: 500 }
        );
    }
}
