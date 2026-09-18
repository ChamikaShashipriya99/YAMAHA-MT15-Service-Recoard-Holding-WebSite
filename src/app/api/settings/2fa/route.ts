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
} from "@/lib/auth";

// GET /api/settings/2fa - Generate a new secret and QR code for pairing preview
export async function GET() {
    try {
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
            return NextResponse.json(
                { success: false, error: "Current password is incorrect" },
                { status: 401 }
            );
        }

        // 2. Verify Confirmation Code with the NEW secret
        const isCodeValid = verifyTotp(confirmationCode, newSecret);
        if (!isCodeValid) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid 6-digit code. Please verify the code displayed in Google Authenticator for this new secret.",
                },
                { status: 400 }
            );
        }

        // 3. Commit new secret to MongoDB UserSettings
        await connectToDatabase();
        await UserSettings.findOneAndUpdate(
            { username: AUTH_CONFIG.username },
            {
                username: AUTH_CONFIG.username,
                totpSecret: newSecret,
                updatedAt: new Date(),
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({
            success: true,
            message: "Google Authenticator re-paired successfully! Your new 2FA secret is now active.",
        });
    } catch (error: any) {
        console.error("Commit 2FA Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to commit 2FA secret" },
            { status: 500 }
        );
    }
}
