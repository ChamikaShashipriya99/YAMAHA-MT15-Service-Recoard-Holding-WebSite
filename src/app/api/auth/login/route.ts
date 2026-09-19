import { NextRequest, NextResponse } from "next/server";
import {
    verifyCredentialsAsync,
    verifyTotpAsync,
    verifyAndConsumeRecoveryCode,
    createSession,
    getEffectiveCredentials,
    SESSION_COOKIE_NAME,
    AUTH_CONFIG,
} from "@/lib/auth";
import { checkRateLimitAsync, recordAttemptAsync, resetRateLimitAsync, getClientIp } from "@/lib/rateLimit";
import { logSecurityEvent, getUserAgent } from "@/lib/audit";
import { sendTelegramSecurityAlert } from "@/lib/telegramBot";

export async function POST(request: NextRequest) {
    try {
        const clientIp = getClientIp(request);
        const rateLimitKey = `login_${clientIp}`;

        // Check Persistent Rate Limit (5 attempts per 15 mins)
        const rateCheck = await checkRateLimitAsync(rateLimitKey, 5, 15 * 60 * 1000);
        if (!rateCheck.allowed) {
            await logSecurityEvent({
                eventType: "LOGIN_FAILED",
                status: "CRITICAL",
                request,
                details: `Rate limit lockout triggered: locked for ${Math.ceil(
                    rateCheck.retryAfterSeconds / 60
                )} mins`,
            });

            // Dispatch Telegram Security Alert for Terminal Lockout
            await sendTelegramSecurityAlert("LOGIN_LOCKOUT", {
                clientIp,
                userAgent: getUserAgent(request),
                timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" }),
            }).catch((err) => console.warn("Telegram alert failed:", err));

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
        const { username, password, totpCode, recoveryCode } = body;

        if (!username || !password) {
            return NextResponse.json(
                { success: false, error: "Username and password are required" },
                { status: 400 }
            );
        }

        // 1. Verify Username & Password (against DB or env fallback)
        const isCredentialsValid = await verifyCredentialsAsync(username, password);
        if (!isCredentialsValid) {
            await recordAttemptAsync(rateLimitKey, 15 * 60 * 1000);
            await logSecurityEvent({
                eventType: "LOGIN_FAILED",
                status: "WARNING",
                request,
                details: `Invalid password attempt for account '${username}'`,
            });

            // Dispatch Telegram Security Alert for Invalid Password
            await sendTelegramSecurityAlert("LOGIN_FAILED", {
                clientIp,
                userAgent: getUserAgent(request),
                username,
                reason: "Invalid password provided",
                timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" }),
            }).catch((err) => console.warn("Telegram alert failed:", err));

            return NextResponse.json(
                { success: false, error: "Invalid username or password" },
                { status: 401 }
            );
        }

        // 2. Verify 2FA via Google Authenticator OR Emergency Recovery Code
        let usedRecovery = false;

        if (recoveryCode && recoveryCode.trim()) {
            const isRecoveryValid = await verifyAndConsumeRecoveryCode(recoveryCode.trim());
            if (!isRecoveryValid) {
                await recordAttemptAsync(rateLimitKey, 15 * 60 * 1000);
                await logSecurityEvent({
                    eventType: "LOGIN_FAILED",
                    status: "WARNING",
                    request,
                    details: "Invalid or already-consumed emergency recovery code",
                });

                // Dispatch Telegram Security Alert for Invalid Recovery Code
                await sendTelegramSecurityAlert("LOGIN_FAILED", {
                    clientIp,
                    userAgent: getUserAgent(request),
                    username,
                    reason: "Invalid or already-consumed emergency recovery code",
                    timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" }),
                }).catch((err) => console.warn("Telegram alert failed:", err));

                return NextResponse.json(
                    { success: false, error: "Invalid or already used emergency recovery code" },
                    { status: 401 }
                );
            }
            usedRecovery = true;
        } else {
            if (!totpCode) {
                return NextResponse.json(
                    { success: false, error: "Please enter the 6-digit code from Google Authenticator" },
                    { status: 400 }
                );
            }

            const isTotpValid = await verifyTotpAsync(totpCode);
            if (!isTotpValid) {
                await recordAttemptAsync(rateLimitKey, 15 * 60 * 1000);
                await logSecurityEvent({
                    eventType: "LOGIN_FAILED",
                    status: "WARNING",
                    request,
                    details: "Invalid 6-digit Google Authenticator code attempt",
                });

                // Dispatch Telegram Security Alert for Invalid 2FA TOTP
                await sendTelegramSecurityAlert("LOGIN_FAILED", {
                    clientIp,
                    userAgent: getUserAgent(request),
                    username,
                    reason: "Invalid 6-digit Google Authenticator 2FA code",
                    timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" }),
                }).catch((err) => console.warn("Telegram alert failed:", err));

                return NextResponse.json(
                    {
                        success: false,
                        error: "Invalid 6-digit code. Please verify the current code in your Google Authenticator app.",
                    },
                    { status: 401 }
                );
            }
        }

        // Reset rate limit counter upon successful authentication
        await resetRateLimitAsync(rateLimitKey);

        // 3. Create JWT Session with current tokenVersion
        const creds = await getEffectiveCredentials();
        const token = await createSession(AUTH_CONFIG.username, creds.tokenVersion);

        // Log successful login audit event
        await logSecurityEvent({
            eventType: usedRecovery ? "LOGIN_RECOVERY_USED" : "LOGIN_SUCCESS",
            status: usedRecovery ? "WARNING" : "SUCCESS",
            request,
            details: usedRecovery
                ? "Emergency recovery code consumed for login"
                : "Cockpit session engaged via 2FA TOTP",
        });

        // Dispatch Telegram Security Alert for Login Success
        await sendTelegramSecurityAlert("LOGIN_SUCCESS", {
            clientIp,
            userAgent: getUserAgent(request),
            username: AUTH_CONFIG.username,
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" }),
        }).catch((err) => console.warn("Telegram alert failed:", err));

        // 4. Set Secure Session Cookie with SameSite=strict
        const response = NextResponse.json({
            success: true,
            message: "Authentication successful",
            user: { username: AUTH_CONFIG.username },
            usedRecovery,
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
