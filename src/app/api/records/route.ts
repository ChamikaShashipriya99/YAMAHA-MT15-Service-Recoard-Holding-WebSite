import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ServiceRecordModel from "@/models/ServiceRecord";
import { validateDate, validateMileage, sanitizeText, sanitizeCost } from "@/lib/sanitize";
import { verifyRequestSession } from "@/lib/auth";

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
        // Enforce active session with tokenVersion verification
        const session = await verifyRequestSession(request);
        if (!session) {
            return NextResponse.json(
                { success: false, error: "Unauthorized: Session expired or revoked." },
                { status: 401 }
            );
        }

        await connectToDatabase();
        const body = await request.json();

        const { date, mileage, oilChange, filterChange, notes, cost } = body;

        // 1. Validate Date
        const dateCheck = validateDate(date);
        if (!dateCheck.valid || !dateCheck.value) {
            return NextResponse.json(
                { success: false, error: dateCheck.error || "Invalid date" },
                { status: 400 }
            );
        }

        // 2. Validate Mileage
        const mileageCheck = validateMileage(mileage);
        if (!mileageCheck.valid || mileageCheck.value === undefined) {
            return NextResponse.json(
                { success: false, error: mileageCheck.error || "Invalid mileage" },
                { status: 400 }
            );
        }

        const sanitizedNotes = sanitizeText(notes, 500);
        const sanitizedCost = sanitizeCost(cost);
        const sanitizedType = sanitizeText(body.type || "", 50);

        const type =
            sanitizedType ||
            (oilChange && filterChange
                ? "Full Service"
                : oilChange
                ? "Oil Change"
                : "Maintenance");

        const newRecord = await ServiceRecordModel.create({
            date: dateCheck.value,
            mileage: mileageCheck.value,
            oilChange: Boolean(oilChange),
            filterChange: Boolean(filterChange),
            notes: sanitizedNotes,
            cost: sanitizedCost,
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
export async function DELETE(request: NextRequest) {
    try {
        const session = await verifyRequestSession(request);
        if (!session) {
            return NextResponse.json(
                { success: false, error: "Unauthorized: Session expired or revoked." },
                { status: 401 }
            );
        }

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
