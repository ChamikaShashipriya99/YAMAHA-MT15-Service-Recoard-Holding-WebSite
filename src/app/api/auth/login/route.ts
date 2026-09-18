import { NextRequest, NextResponse } from "next/server";
import {
    verifyCredentials,
    verifyTotp,
    createSession,
    SESSION_COOKIE_NAME,
    AUTH_CONFIG,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password, totpCode } = body;

        if (!username || !password) {
            return NextResponse.json(
                { success: false, error: "Username and password are required" },
                { status: 400 }
            );
        }

        // 1. Verify Username & Password
        const isCredentialsValid = verifyCredentials(username, password);
        if (!isCredentialsValid) {
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

        const isTotpValid = verifyTotp(totpCode);
        if (!isTotpValid) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid 6-digit code. Please verify the current code in your Google Authenticator app.",
                },
                { status: 401 }
            );
        }

        // 3. Create JWT Session
        const token = await createSession(AUTH_CONFIG.username);

        // 4. Set Secure Session Cookie
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
            sameSite: "lax",
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
