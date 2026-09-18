import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ServiceRecordModel from "@/models/ServiceRecord";

// GET /api/records - Retrieve all records ordered by date descending
export async function GET() {
    try {
        await connectToDatabase();
        const records = await ServiceRecordModel.find({}).sort({ date: -1 });
        return NextResponse.json({ success: true, data: records });
    } catch (error: any) {
        console.error("API GET /api/records error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch records" },
            { status: 500 }
        );
    }
}

// POST /api/records - Create a new service record
export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();
        const body = await request.json();

        const { date, mileage, oilChange, filterChange, notes, cost } = body;

        if (!date || mileage === undefined) {
            return NextResponse.json(
                { success: false, error: "Date and mileage are required." },
                { status: 400 }
            );
        }

        const type =
            body.type ||
            (oilChange && filterChange
                ? "Full Service"
                : oilChange
                ? "Oil Change"
                : "Maintenance");

        const newRecord = await ServiceRecordModel.create({
            date,
            mileage: Number(mileage),
            oilChange: Boolean(oilChange),
            filterChange: Boolean(filterChange),
            notes: notes || "",
            cost: cost || "",
            type,
        });

        return NextResponse.json(
            { success: true, data: newRecord },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("API POST /api/records error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to create record" },
            { status: 500 }
        );
    }
}

// DELETE /api/records - Delete all service records (reset)
export async function DELETE() {
    try {
        await connectToDatabase();
        await ServiceRecordModel.deleteMany({});
        return NextResponse.json({
            success: true,
            message: "All service records have been purged successfully.",
        });
    } catch (error: any) {
        console.error("API DELETE /api/records error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to reset records" },
            { status: 500 }
        );
    }
}
