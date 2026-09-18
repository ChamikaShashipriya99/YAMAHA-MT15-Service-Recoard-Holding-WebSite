import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AuditLog from "@/models/AuditLog";
import { verifyRequestSession } from "@/lib/auth";

// GET /api/settings/audit-logs - Retrieve the last 50 security events
export async function GET(request: NextRequest) {
    try {
        const session = await verifyRequestSession(request);
        if (!session) {
            return NextResponse.json(
                { success: false, error: "Unauthorized: Active session required." },
                { status: 401 }
            );
        }

        await connectToDatabase();
        const logs = await AuditLog.find({})
            .sort({ timestamp: -1 })
            .limit(50)
            .lean();

        return NextResponse.json({
            success: true,
            data: logs,
        });
    } catch (error: any) {
        console.error("Fetch Audit Logs Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch audit logs" },
            { status: 500 }
        );
    }
}
