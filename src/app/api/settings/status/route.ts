import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import ServiceRecordModel from "@/models/ServiceRecord";

export async function GET() {
    try {
        const start = Date.now();
        await connectToDatabase();
        const latencyMs = Date.now() - start;

        const recordCount = await ServiceRecordModel.countDocuments();
        const stateMap = ["Disconnected", "Connected", "Connecting", "Disconnecting"];
        const readyState = mongoose.connection.readyState;
        const statusText = stateMap[readyState] || "Unknown";

        return NextResponse.json({
            success: true,
            status: statusText,
            connected: readyState === 1,
            latencyMs,
            databaseName: mongoose.connection.name || "yamaha_mt15",
            host: mongoose.connection.host || "Atlas Cluster",
            totalRecords: recordCount,
            nodeVersion: process.version,
            serverUptimeSeconds: Math.floor(process.uptime()),
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error("Status Ping Error:", error);
        return NextResponse.json(
            {
                success: false,
                connected: false,
                status: "UNREACHABLE",
                error: error.message || "Failed to ping database",
            },
            { status: 500 }
        );
    }
}
