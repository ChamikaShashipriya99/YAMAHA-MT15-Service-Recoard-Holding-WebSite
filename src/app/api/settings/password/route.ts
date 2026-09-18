import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import UserSettings from "@/models/UserSettings";
import { AUTH_CONFIG, verifyCredentialsAsync } from "@/lib/auth";

export async function POST(request: NextRequest) {
    try {
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
            return NextResponse.json(
                { success: false, error: "Current password is incorrect" },
                { status: 401 }
            );
        }

        // 2. Hash New Password
        const salt = bcrypt.genSaltSync(10);
        const passwordHash = bcrypt.hashSync(newPassword, salt);

        // 3. Save to MongoDB UserSettings
        await connectToDatabase();
        await UserSettings.findOneAndUpdate(
            { username: AUTH_CONFIG.username },
            {
                username: AUTH_CONFIG.username,
                passwordHash,
                updatedAt: new Date(),
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({
            success: true,
            message: "Password updated successfully. Use your new password on next login.",
        });
    } catch (error: any) {
        console.error("Change Password Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to update password" },
            { status: 500 }
        );
    }
}
