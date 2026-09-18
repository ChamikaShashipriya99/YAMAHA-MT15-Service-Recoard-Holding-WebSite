import { NextRequest } from "next/server";

interface RateLimitRecord {
    count: number;
    resetTime: number;
}

// Global cache for tracking attempts
const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes to prevent memory leak
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
        if (now > record.resetTime) {
            rateLimitMap.delete(key);
        }
    }
}, 5 * 60 * 1000);

/**
 * Extracts client IP from request headers
 */
export function getClientIp(request: NextRequest | Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    const realIp = request.headers.get("x-real-ip");
    if (realIp) {
        return realIp.trim();
    }
    return "127.0.0.1";
}

/**
 * Checks if a key has exceeded its rate limit
 */
export function checkRateLimit(
    key: string,
    limit: number = 5,
    windowMs: number = 15 * 60 * 1000
) {
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
        return {
            allowed: true,
            remaining: limit,
            retryAfterSeconds: 0,
        };
    }

    const remaining = Math.max(0, limit - record.count);
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);

    return {
        allowed: record.count < limit,
        remaining,
        retryAfterSeconds,
    };
}

/**
 * Increments failed attempt count for a key
 */
export function recordAttempt(
    key: string,
    windowMs: number = 15 * 60 * 1000
) {
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
        rateLimitMap.set(key, {
            count: 1,
            resetTime: now + windowMs,
        });
        return 1;
    }

    record.count += 1;
    return record.count;
}

/**
 * Resets attempt count upon successful authentication
 */
export function resetRateLimit(key: string) {
    rateLimitMap.delete(key);
}
