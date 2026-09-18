import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "mt15_auth_session";
const JWT_SECRET = process.env.AUTH_JWT_SECRET || "yamaha_mt15_super_secret_jwt_key_2026";
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Allow public routes & assets
    if (
        pathname.startsWith("/login") ||
        pathname.startsWith("/setup-2fa") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/models") ||
        pathname === "/LoadingScreenMT15.mp4" ||
        pathname === "/favicon.ico" ||
        pathname.match(/\.(png|jpg|jpeg|svg|webp|ico)$/)
    ) {
        // If already logged in and trying to access /login, redirect to /
        if (pathname === "/login") {
            const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
            if (token) {
                try {
                    await jwtVerify(token, SECRET_KEY);
                    return NextResponse.redirect(new URL("/", request.url));
                } catch {
                    // Invalid token, allow access to /login
                }
            }
        }
        return NextResponse.next();
    }

    // 2. Check session token for protected routes
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
        if (pathname.startsWith("/api/")) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
    }

    try {
        await jwtVerify(token, SECRET_KEY);
        return NextResponse.next();
    } catch {
        // Token expired or invalid
        if (pathname.startsWith("/api/")) {
            return NextResponse.json({ success: false, error: "Session expired" }, { status: 401 });
        }
        const loginUrl = new URL("/login", request.url);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete(SESSION_COOKIE_NAME);
        return response;
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except static files
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
