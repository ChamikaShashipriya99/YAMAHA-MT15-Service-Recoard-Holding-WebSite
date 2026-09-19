import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import VehicleCompliance from "@/models/VehicleCompliance";
import { verifyRequestSession } from "@/lib/auth";
import { logSecurityEvent } from "@/lib/audit";
import { dispatchTelegramComplianceAlerts } from "@/lib/telegramBot";

function calculateDocumentStatus(expiryDateStr: string) {
    if (!expiryDateStr) {
        return { daysRemaining: 0, status: "EXPIRED" as const, milestone: "EXPIRED" as const, stageNumber: 0 };
    }
    const expiry = new Date(expiryDateStr);
    const now = new Date();
    // Normalize to midnight UTC for fair day calculation
    const diffMs = expiry.setHours(23, 59, 59, 999) - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
        return { daysRemaining, status: "EXPIRED" as const, milestone: "EXPIRED" as const, stageNumber: 0 };
    }
    if (daysRemaining <= 5) {
        return { daysRemaining, status: "EXPIRING_SOON" as const, milestone: "5_DAYS" as const, stageNumber: 3 };
    }
    if (daysRemaining <= 15) {
        return { daysRemaining, status: "EXPIRING_SOON" as const, milestone: "15_DAYS" as const, stageNumber: 2 };
    }
    if (daysRemaining <= 30) {
        return { daysRemaining, status: "EXPIRING_SOON" as const, milestone: "30_DAYS" as const, stageNumber: 1 };
    }
    return { daysRemaining, status: "VALID" as const, milestone: "NOMINAL" as const, stageNumber: -1 };
}

export async function GET() {
    try {
        await connectToDatabase();
        let compliance = await VehicleCompliance.findOne({ bikeIdentifier: "YAMAHA_MT15_PRIMARY" });

        // If not seeded yet, create default initial record
        if (!compliance) {
            compliance = await VehicleCompliance.create({
                bikeIdentifier: "YAMAHA_MT15_PRIMARY",
            });
        }

        const insuranceStatus = calculateDocumentStatus(compliance.insurance.expiryDate);
        const revenueStatus = calculateDocumentStatus(compliance.revenueLicense.expiryDate);
        const emissionStatus = calculateDocumentStatus(compliance.emissionTest.expiryDate);

        const urgentAlerts: Array<{
            type: "insurance" | "revenueLicense" | "emissionTest";
            title: string;
            expiryDate: string;
            daysRemaining: number;
            status: "EXPIRED" | "EXPIRING_SOON" | "VALID";
            milestone: "EXPIRED" | "5_DAYS" | "15_DAYS" | "30_DAYS" | "NOMINAL";
            stageNumber: number;
        }> = [];

        if (insuranceStatus.status !== "VALID") {
            urgentAlerts.push({
                type: "insurance",
                title: "Vehicle Insurance",
                expiryDate: compliance.insurance.expiryDate,
                daysRemaining: insuranceStatus.daysRemaining,
                status: insuranceStatus.status,
                milestone: insuranceStatus.milestone,
                stageNumber: insuranceStatus.stageNumber,
            });
        }
        if (revenueStatus.status !== "VALID") {
            urgentAlerts.push({
                type: "revenueLicense",
                title: "Revenue License (Road Tax)",
                expiryDate: compliance.revenueLicense.expiryDate,
                daysRemaining: revenueStatus.daysRemaining,
                status: revenueStatus.status,
                milestone: revenueStatus.milestone,
                stageNumber: revenueStatus.stageNumber,
            });
        }
        if (emissionStatus.status !== "VALID") {
            urgentAlerts.push({
                type: "emissionTest",
                title: "Vehicle Emission Test (VET)",
                expiryDate: compliance.emissionTest.expiryDate,
                daysRemaining: emissionStatus.daysRemaining,
                status: emissionStatus.status,
                milestone: emissionStatus.milestone,
                stageNumber: emissionStatus.stageNumber,
            });
        }

        // Asynchronously check and dispatch Telegram compliance alerts
        dispatchTelegramComplianceAlerts().catch((err) => {
            console.warn("Telegram compliance alert dispatch error:", err);
        });

        return NextResponse.json({
            success: true,
            data: {
                compliance,
                computed: {
                    insurance: insuranceStatus,
                    revenueLicense: revenueStatus,
                    emissionTest: emissionStatus,
                },
                hasAlert: urgentAlerts.length > 0,
                urgentAlerts,
            },
        });
    } catch (error: any) {
        console.error("API GET /api/compliance error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch vehicle compliance records" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await verifyRequestSession(request);
        if (!session) {
            return NextResponse.json(
                { success: false, error: "Unauthorized: Active session required to update compliance records." },
                { status: 401 }
            );
        }

        await connectToDatabase();
        const body = await request.json();

        let compliance = await VehicleCompliance.findOne({ bikeIdentifier: "YAMAHA_MT15_PRIMARY" });
        if (!compliance) {
            compliance = new VehicleCompliance({ bikeIdentifier: "YAMAHA_MT15_PRIMARY" });
        }

        if (body.insurance) {
            compliance.insurance = {
                ...compliance.insurance,
                ...body.insurance,
            };
        }
        if (body.revenueLicense) {
            compliance.revenueLicense = {
                ...compliance.revenueLicense,
                ...body.revenueLicense,
            };
        }
        if (body.emissionTest) {
            compliance.emissionTest = {
                ...compliance.emissionTest,
                ...body.emissionTest,
            };
        }

        await compliance.save();

        // Log audit event
        const clientIp = request.headers.get("x-forwarded-for") || "127.0.0.1";
        await logSecurityEvent({
            eventType: "COMPLIANCE_UPDATED" as any,
            clientIp,
            details: "Yamaha MT-15 vehicle compliance documents updated (Insurance / Revenue License / Emission)",
            status: "SUCCESS",
        });

        const insuranceStatus = calculateDocumentStatus(compliance.insurance.expiryDate);
        const revenueStatus = calculateDocumentStatus(compliance.revenueLicense.expiryDate);
        const emissionStatus = calculateDocumentStatus(compliance.emissionTest.expiryDate);

        // Asynchronously check and dispatch Telegram compliance alerts
        dispatchTelegramComplianceAlerts().catch((err) => {
            console.warn("Telegram compliance alert dispatch error on update:", err);
        });

        return NextResponse.json({
            success: true,
            data: {
                compliance,
                computed: {
                    insurance: insuranceStatus,
                    revenueLicense: revenueStatus,
                    emissionTest: emissionStatus,
                },
            },
            message: "Vehicle compliance documents updated successfully.",
        });
    } catch (error: any) {
        console.error("API PUT /api/compliance error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to update compliance records" },
            { status: 500 }
        );
    }
}
