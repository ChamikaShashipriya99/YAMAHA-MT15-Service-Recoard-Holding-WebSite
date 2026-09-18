import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import ServiceRecordModel from "@/models/ServiceRecord";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PUT /api/records/[id] - Update an existing record
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        await connectToDatabase();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid record ID" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const updates: Record<string, any> = {};

        if (body.date !== undefined) updates.date = body.date;
        if (body.mileage !== undefined) updates.mileage = Number(body.mileage);
        if (body.oilChange !== undefined) updates.oilChange = Boolean(body.oilChange);
        if (body.filterChange !== undefined) updates.filterChange = Boolean(body.filterChange);
        if (body.notes !== undefined) updates.notes = body.notes;
        if (body.cost !== undefined) updates.cost = body.cost;
        if (body.type !== undefined) updates.type = body.type;

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

        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        console.error("API PUT /api/records/[id] error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to update record" },
            { status: 500 }
        );
    }
}

// DELETE /api/records/[id] - Delete an existing record
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        await connectToDatabase();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid record ID" },
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
