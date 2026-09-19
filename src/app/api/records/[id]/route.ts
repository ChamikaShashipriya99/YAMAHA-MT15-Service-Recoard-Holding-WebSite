import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import ServiceRecordModel from "@/models/ServiceRecord";
import { validateDate, validateMileage, sanitizeText, sanitizeCost, sanitizeMongoInput, isValidObjectId } from "@/lib/sanitize";
import { verifyRequestSession } from "@/lib/auth";
import { encryptText, decryptText } from "@/lib/crypto";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PUT /api/records/[id] - Update an existing record with sanitization
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await verifyRequestSession(request);
        if (!session) {
            return NextResponse.json(
                { success: false, error: "Unauthorized: Session expired or revoked." },
                { status: 401 }
            );
        }

        const { id } = await params;
        await connectToDatabase();

        if (!isValidObjectId(id) || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid record ID format" },
                { status: 400 }
            );
        }

        const rawBody = await request.json();
        const body = sanitizeMongoInput(rawBody);
        const updates: Record<string, any> = {};

        if (body.date !== undefined) {
            const dateCheck = validateDate(body.date);
            if (!dateCheck.valid || !dateCheck.value) {
                return NextResponse.json(
                    { success: false, error: dateCheck.error || "Invalid date" },
                    { status: 400 }
                );
            }
            updates.date = dateCheck.value;
        }

        if (body.mileage !== undefined) {
            const mileageCheck = validateMileage(body.mileage);
            if (!mileageCheck.valid || mileageCheck.value === undefined) {
                return NextResponse.json(
                    { success: false, error: mileageCheck.error || "Invalid mileage" },
                    { status: 400 }
                );
            }
            updates.mileage = mileageCheck.value;
        }

        if (body.oilChange !== undefined) {
            updates.oilChange = Boolean(body.oilChange);
        }

        if (body.filterChange !== undefined) {
            updates.filterChange = Boolean(body.filterChange);
        }

        if (body.notes !== undefined) {
            updates.notes = encryptText(sanitizeText(body.notes, 500));
        }

        if (body.cost !== undefined) {
            updates.cost = encryptText(sanitizeCost(body.cost));
        }

        if (body.type !== undefined) {
            updates.type = sanitizeText(body.type, 50);
        }

        const updated = await ServiceRecordModel.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });

        if (!updated) {
            return NextResponse.json(
                { success: false, error: "Record not found" },
                { status: 404 }
            );
        }

        const returnData = {
            ...updated.toJSON(),
            notes: decryptText(updated.notes),
            cost: decryptText(updated.cost),
        };

        return NextResponse.json({ success: true, data: returnData });
    } catch (error: any) {
        console.error("API PUT /api/records/[id] error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to update record" },
            { status: 500 }
        );
    }
}

// DELETE /api/records/[id] - Delete an existing record
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await verifyRequestSession(request);
        if (!session) {
            return NextResponse.json(
                { success: false, error: "Unauthorized: Session expired or revoked." },
                { status: 401 }
            );
        }

        const { id } = await params;
        await connectToDatabase();

        if (!isValidObjectId(id) || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid record ID format" },
                { status: 400 }
            );
        }

        const deleted = await ServiceRecordModel.findByIdAndDelete(id);

        if (!deleted) {
            return NextResponse.json(
                { success: false, error: "Record not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Record deleted successfully",
        });
    } catch (error: any) {
        console.error("API DELETE /api/records/[id] error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to delete record" },
            { status: 500 }
        );
    }
}
