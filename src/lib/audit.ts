import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AuditLog, { AuditEventType, AuditEventStatus } from "@/models/AuditLog";
import { getClientIp } from "@/lib/rateLimit";

/**
 * Extracts User-Agent safely from a request
 */
export function getUserAgent(request?: NextRequest | Request): string {
    if (!request) return "System / Internal";
    return request.headers.get("user-agent") || "Unknown Device";
}

/**
 * Persists a security audit event to MongoDB Atlas asynchronously
 */
export async function logSecurityEvent({
    eventType,
    status = "SUCCESS",
    request,
    clientIp,
    userAgent,
    details,
}: {
    eventType: AuditEventType;
    status?: AuditEventStatus;
    request?: NextRequest | Request;
    clientIp?: string;
    userAgent?: string;
    details?: string;
}) {
    try {
        await connectToDatabase();
        const resolvedIp = clientIp || (request ? getClientIp(request) : "unknown");
        const resolvedAgent = userAgent || (request ? getUserAgent(request) : "unknown");

        await AuditLog.create({
            eventType,
            status,
            clientIp: resolvedIp,
            userAgent: resolvedAgent,
            details: details || "",
            timestamp: new Date(),
        });
    } catch (err) {
        // Fail-safe: Audit logging failures must not break core operations
        console.error("Audit logging error:", err);
    }
}
