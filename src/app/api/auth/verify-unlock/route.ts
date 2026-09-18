import { NextRequest, NextResponse } from "next/server";
import {
    verifyCredentialsAsync,
    verifyTotpAsync,
    verifyRequestSession,
    AUTH_CONFIG,
} from "@/lib/auth";
import { logSecurityEvent } from "@/lib/audit";
import { checkRateLimit, recordAttempt, resetRateLimit, getClientIp } from "@/lib/rateLimit";

// POST /api/auth/verify-unlock - Fast-path unlock verification for Inactivity Lock
export async function POST(request: NextRequest) {
    try {
        const session = await verifyRequestSession(request);
        if (!session) {
            return NextResponse.json(
                { success: false, error: "Session expired or revoked. Please log in again." },
                { status: 401 }
            );
        }

        const clientIp = getClientIp(request);
        const rateLimitKey = `unlock_${clientIp}`;

        // Rate limit: 5 unlock attempts per 10 mins
        const rateCheck = checkRateLimit(rateLimitKey, 5, 10 * 60 * 1000);
        if (!rateCheck.allowed) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Too many unlock attempts. Locked for ${Math.ceil(
                        rateCheck.retryAfterSeconds / 60
                    )} minutes.`,
                },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { password, totpCode } = body;

        if (!password && !totpCode) {
            return NextResponse.json(
                { success: false, error: "Password or 6-digit Authenticator code required" },
                { status: 400 }
            );
        }

        let verified = false;

        if (password) {
            verified = await verifyCredentialsAsync(AUTH_CONFIG.username, password);
        } else if (totpCode) {
            verified = await verifyTotpAsync(totpCode);
        }

        if (!verified) {
            recordAttempt(rateLimitKey, 10 * 60 * 1000);
            await logSecurityEvent({
                eventType: "LOGIN_FAILED",
                status: "WARNING",
                request,
                details: "Failed unlock attempt on inactivity-locked cockpit",
            });
            return NextResponse.json(
                { success: false, error: "Incorrect password or 6-digit code." },
                { status: 401 }
            );
        }

        resetRateLimit(rateLimitKey);

        await logSecurityEvent({
            eventType: "INACTIVITY_UNLOCKED",
            status: "SUCCESS",
            request,
            details: "Cockpit successfully unlocked from inactivity sleep",
        });

        return NextResponse.json({
            success: true,
            message: "Cockpit unlocked",
        });
    } catch (error: any) {
        console.error("Unlock Verification Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to verify unlock" },
            { status: 500 }
        );
    }
}
