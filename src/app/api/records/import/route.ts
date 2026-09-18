import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ServiceRecordModel from "@/models/ServiceRecord";
import { validateDate, validateMileage, sanitizeText, sanitizeCost } from "@/lib/sanitize";
import { encryptText } from "@/lib/crypto";
import { verifyRequestSession } from "@/lib/auth";
import { logSecurityEvent } from "@/lib/audit";

// POST /api/records/import - Import and restore service records from a JSON backup file
export async function POST(request: NextRequest) {
    try {
        // 1. Verify Active Session & Token Version
        const session = await verifyRequestSession(request);
        if (!session) {
            return NextResponse.json(
                { success: false, error: "Unauthorized: Active session required to import records." },
                { status: 401 }
            );
        }

        const body = await request.json();
        const mode = body.mode === "replace" ? "replace" : "append";

        // Accept either { records: [...] } or direct array [...] or { backup: { records: [...] } }
        let rawRecords: any[] = [];
        if (Array.isArray(body)) {
            rawRecords = body;
        } else if (Array.isArray(body.records)) {
            rawRecords = body.records;
        } else if (body.backup && Array.isArray(body.backup.records)) {
            rawRecords = body.backup.records;
        }

        if (!rawRecords || rawRecords.length === 0) {
            return NextResponse.json(
                { success: false, error: "No service records found in backup payload." },
                { status: 400 }
            );
        }

        if (rawRecords.length > 2000) {
            return NextResponse.json(
                { success: false, error: "Backup file exceeds maximum limit of 2,000 records." },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // 2. If 'replace' mode, clear existing database records first
        let deletedCount = 0;
        if (mode === "replace") {
            const delRes = await ServiceRecordModel.deleteMany({});
            deletedCount = delRes.deletedCount;
        }

        // 3. Process, sanitize, and encrypt records
        const docsToInsert: any[] = [];
        let skippedCount = 0;

        for (const item of rawRecords) {
            if (!item || typeof item !== "object") {
                skippedCount++;
                continue;
            }

            // Validate Date
            const dateCheck = validateDate(item.date);
            if (!dateCheck.valid || !dateCheck.value) {
                skippedCount++;
                continue;
            }

            // Validate Mileage
            const mileageCheck = validateMileage(item.mileage);
            if (!mileageCheck.valid || mileageCheck.value === undefined) {
                skippedCount++;
                continue;
            }

            const sanitizedNotes = sanitizeText(item.notes || "", 500);
            const sanitizedCost = sanitizeCost(item.cost || "");
            const sanitizedType = sanitizeText(item.type || "", 50);

            const type =
                sanitizedType ||
                (item.oilChange && item.filterChange
                    ? "Full Service"
                    : item.oilChange
                    ? "Oil Change"
                    : "Maintenance");

            // Apply AES-256-GCM field encryption
            const encryptedNotes = encryptText(sanitizedNotes);
            const encryptedCost = encryptText(sanitizedCost);

            docsToInsert.push({
                date: dateCheck.value,
                mileage: mileageCheck.value,
                oilChange: Boolean(item.oilChange),
                filterChange: Boolean(item.filterChange),
                notes: encryptedNotes,
                cost: encryptedCost,
                type,
                createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
                updatedAt: new Date(),
            });
        }

        if (docsToInsert.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "No valid records could be extracted from the backup file.",
                    skipped: skippedCount,
                },
                { status: 400 }
            );
        }

        // 4. Batch insert into MongoDB
        const inserted = await ServiceRecordModel.insertMany(docsToInsert);

        // 5. Record Security Audit Log
        await logSecurityEvent({
            eventType: "RECORD_CREATED",
            status: "SUCCESS",
            request,
            details: `Backup imported: ${inserted.length} records restored (${mode} mode, ${skippedCount} skipped)`,
        });

        return NextResponse.json({
            success: true,
            count: inserted.length,
            mode,
            deletedCount,
            skippedCount,
            message:
                mode === "replace"
                    ? `Purged ${deletedCount} older records and restored ${inserted.length} records successfully.`
                    : `Appended ${inserted.length} records successfully.`,
        });
    } catch (error: any) {
        console.error("Backup Import Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to import backup records" },
            { status: 500 }
        );
    }
}
