import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { AUTH_CONFIG, getTotpUri } from "@/lib/auth";

export async function GET() {
    try {
        const secret = AUTH_CONFIG.totpSecret;
        const uri = getTotpUri(secret);

        // Generate QR Code Data URL
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
            username: AUTH_CONFIG.username,
            secret,
            qrCodeDataUrl,
            uri,
        });
    } catch (error: any) {
        console.error("2FA Setup Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to generate 2FA setup data" },
            { status: 500 }
        );
    }
}
