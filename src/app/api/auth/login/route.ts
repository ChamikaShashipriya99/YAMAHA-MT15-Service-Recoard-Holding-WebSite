import { NextRequest, NextResponse } from "next/server";
import {
    verifyCredentialsAsync,
    verifyTotpAsync,
    createSession,
    getEffectiveCredentials,
    SESSION_COOKIE_NAME,
    AUTH_CONFIG,
} from "@/lib/auth";
import { checkRateLimit, recordAttempt, resetRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
    try {
        const clientIp = getClientIp(request);
        const rateLimitKey = `login_${clientIp}`;

        // Check Rate Limit (5 attempts per 15 mins)
        const rateCheck = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
        if (!rateCheck.allowed) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Too many failed login attempts. Terminal locked for security. Please try again in ${Math.ceil(
                        rateCheck.retryAfterSeconds / 60
                    )} minutes.`,
                },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(rateCheck.retryAfterSeconds),
                    },
                }
            );
        }

        const body = await request.json();
        const { username, password, totpCode } = body;

        if (!username || !password) {
            return NextResponse.json(
                { success: false, error: "Username and password are required" },
                { status: 400 }
            );
        }

        // 1. Verify Username & Password (against DB or env fallback)
        const isCredentialsValid = await verifyCredentialsAsync(username, password);
        if (!isCredentialsValid) {
            recordAttempt(rateLimitKey, 15 * 60 * 1000);
            return NextResponse.json(
                { success: false, error: "Invalid username or password" },
                { status: 401 }
            );
        }

        // 2. Verify 6-digit Google Authenticator code
        if (!totpCode) {
            return NextResponse.json(
                { success: false, error: "Please enter the 6-digit code from Google Authenticator" },
                { status: 400 }
            );
        }

        const isTotpValid = await verifyTotpAsync(totpCode);
        if (!isTotpValid) {
            recordAttempt(rateLimitKey, 15 * 60 * 1000);
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid 6-digit code. Please verify the current code in your Google Authenticator app.",
                },
                { status: 401 }
            );
        }

        // Reset rate limit counter upon successful authentication
        resetRateLimit(rateLimitKey);

        // 3. Create JWT Session with current tokenVersion
        const creds = await getEffectiveCredentials();
        const token = await createSession(AUTH_CONFIG.username, creds.tokenVersion);

        // 4. Set Secure Session Cookie with SameSite=strict
        const response = NextResponse.json({
            success: true,
            message: "Authentication successful",
            user: { username: AUTH_CONFIG.username },
        });

        response.cookies.set({
            name: SESSION_COOKIE_NAME,
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });

        return response;
    } catch (error: any) {
        console.error("Login API Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
