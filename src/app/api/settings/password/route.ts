import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import UserSettings from "@/models/UserSettings";
import {
    AUTH_CONFIG,
    verifyCredentialsAsync,
    createSession,
    SESSION_COOKIE_NAME,
    verifyRequestSession,
} from "@/lib/auth";
import { checkRateLimit, recordAttempt, resetRateLimit, getClientIp } from "@/lib/rateLimit";

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
        const rateLimitKey = `pwd_change_${clientIp}`;

        // Rate limit: 5 attempts per 15 minutes
        const rateCheck = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
        if (!rateCheck.allowed) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Too many password change attempts. Locked for ${Math.ceil(
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
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { success: false, error: "Current password and new password are required" },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { success: false, error: "New password must be at least 6 characters long" },
                { status: 400 }
            );
        }

        // 1. Verify Current Password
        const isCurrentValid = await verifyCredentialsAsync(AUTH_CONFIG.username, currentPassword);
        if (!isCurrentValid) {
            recordAttempt(rateLimitKey, 15 * 60 * 1000);
            return NextResponse.json(
                { success: false, error: "Current password is incorrect" },
                { status: 401 }
            );
        }

        resetRateLimit(rateLimitKey);

        // 2. Hash New Password
        const salt = bcrypt.genSaltSync(10);
        const passwordHash = bcrypt.hashSync(newPassword, salt);

        // 3. Save to MongoDB UserSettings and increment tokenVersion to revoke all prior sessions
        await connectToDatabase();
        const updatedUser = await UserSettings.findOneAndUpdate(
            { username: AUTH_CONFIG.username },
            {
                $set: {
                    username: AUTH_CONFIG.username,
                    passwordHash,
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
            message: "Password updated successfully! All other active sessions have been revoked.",
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
        console.error("Change Password Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to update password" },
            { status: 500 }
        );
    }
}
