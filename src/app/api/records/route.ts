import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ServiceRecordModel from "@/models/ServiceRecord";
import { validateDate, validateMileage, sanitizeText, sanitizeCost } from "@/lib/sanitize";
import { verifyRequestSession } from "@/lib/auth";
import { logSecurityEvent } from "@/lib/audit";
import { encryptText, decryptText } from "@/lib/crypto";

// GET /api/records - Retrieve all records ordered by date descending with decryption
export async function GET() {
    try {
        await connectToDatabase();
        const records = await ServiceRecordModel.find({}).sort({ date: -1 }).lean();

        const decryptedRecords = records.map((rec: any) => ({
            ...rec,
            id: rec._id ? rec._id.toString() : rec.id,
            notes: decryptText(rec.notes),
            cost: decryptText(rec.cost),
        }));

        return NextResponse.json({ success: true, data: decryptedRecords });
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

        const encryptedNotes = encryptText(sanitizedNotes);
        const encryptedCost = encryptText(sanitizedCost);

        const newRecord = await ServiceRecordModel.create({
            date: dateCheck.value,
            mileage: mileageCheck.value,
            oilChange: Boolean(oilChange),
            filterChange: Boolean(filterChange),
            notes: encryptedNotes,
            cost: encryptedCost,
            type,
        });

        // Return decrypted response for immediate UI update
        const responseData = {
            ...newRecord.toJSON(),
            notes: sanitizedNotes,
            cost: sanitizedCost,
        };

        return NextResponse.json(
            { success: true, data: responseData },
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
        const deleteResult = await ServiceRecordModel.deleteMany({});

        // Log security audit event
        await logSecurityEvent({
            eventType: "RECORDS_PURGED",
            status: "WARNING",
            request,
            details: `Atomic purge: deleted ${deleteResult.deletedCount} telemetry entries`,
        });

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
