import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import RateLimitEntry from "@/models/RateLimitEntry";

interface RateLimitRecord {
    count: number;
    resetTime: number;
}

// Global in-memory fallback cache
const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up expired in-memory entries every 5 minutes
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
 * Checks if a key has exceeded its rate limit (In-Memory Fast-Path)
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
 * Checks if a key has exceeded its rate limit with persistent MongoDB Atlas storage
 */
export async function checkRateLimitAsync(
    key: string,
    limit: number = 5,
    windowMs: number = 15 * 60 * 1000
) {
    const now = Date.now();

    try {
        await connectToDatabase();
        const entry = await RateLimitEntry.findOne({ key });

        if (!entry || now > entry.resetTime) {
            return checkRateLimit(key, limit, windowMs);
        }

        const remaining = Math.max(0, limit - entry.count);
        const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);

        return {
            allowed: entry.count < limit,
            remaining,
            retryAfterSeconds,
        };
    } catch {
        // Failover gracefully to in-memory rate limiter if DB query fails
        return checkRateLimit(key, limit, windowMs);
    }
}

/**
 * Increments failed attempt count for a key (In-Memory)
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
 * Increments failed attempt count with persistent MongoDB storage
 */
export async function recordAttemptAsync(
    key: string,
    windowMs: number = 15 * 60 * 1000
) {
    recordAttempt(key, windowMs); // Mirror in-memory
    const now = Date.now();
    const resetTime = now + windowMs;
    const expiresAt = new Date(resetTime);

    try {
        await connectToDatabase();
        const updated = await RateLimitEntry.findOneAndUpdate(
            { key },
            {
                $inc: { count: 1 },
                $setOnInsert: { key, resetTime, expiresAt },
            },
            { upsert: true, new: true }
        );
        return updated.count;
    } catch (err) {
        console.error("MongoDB RateLimit recordAttemptAsync error:", err);
        return 1;
    }
}

/**
 * Resets attempt count upon successful authentication (In-Memory)
 */
export function resetRateLimit(key: string) {
    rateLimitMap.delete(key);
}

/**
 * Resets attempt count upon successful authentication (MongoDB + Memory)
 */
export async function resetRateLimitAsync(key: string) {
    resetRateLimit(key);
    try {
        await connectToDatabase();
        await RateLimitEntry.deleteOne({ key });
    } catch {
        // ignore
    }
}
