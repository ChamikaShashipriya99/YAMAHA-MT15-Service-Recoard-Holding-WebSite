"use client";

import React, { useState, useEffect } from "react";
import {
    Shield,
    FileText,
    Wind,
    Settings,
    Phone,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Landmark,
    Sparkles,
    RefreshCw,
    ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import EditComplianceModal from "@/components/EditComplianceModal";
import ComplianceAlertBanner from "@/components/ComplianceAlertBanner";
import { dispatchCompliancePushAlerts } from "@/lib/complianceNotifier";

export interface ComplianceData {
    compliance: {
        insurance: {
            provider: string;
            policyNumber: string;
            policyType: string;
            issueDate: string;
            expiryDate: string;
            premiumCost?: string;
            emergencyHotline?: string;
            notes?: string;
            documentPhotoUrl?: string;
        };
        revenueLicense: {
            licenseNumber: string;
            provincialCouncil: string;
            issueDate: string;
            expiryDate: string;
            fee?: string;
            notes?: string;
            documentPhotoUrl?: string;
        };
        emissionTest: {
            testCenter: string;
            certificateNumber: string;
            issueDate: string;
            expiryDate: string;
            status: "PASS" | "FAIL" | "PENDING";
            fee?: string;
            notes?: string;
            documentPhotoUrl?: string;
        };
    };
    computed: {
        insurance: { daysRemaining: number; status: "VALID" | "EXPIRING_SOON" | "EXPIRED" };
        revenueLicense: { daysRemaining: number; status: "VALID" | "EXPIRING_SOON" | "EXPIRED" };
        emissionTest: { daysRemaining: number; status: "VALID" | "EXPIRING_SOON" | "EXPIRED" };
    };
    hasAlert: boolean;
    urgentAlerts: Array<{
        type: "insurance" | "revenueLicense" | "emissionTest";
        title: string;
        expiryDate: string;
        daysRemaining: number;
        status: "EXPIRED" | "EXPIRING_SOON" | "VALID";
    }>;
}

export default function VehicleComplianceCard() {
    const [data, setData] = useState<ComplianceData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState<"insurance" | "revenue" | "emission">("insurance");

    const fetchCompliance = async () => {
        try {
            const res = await fetch("/api/compliance");
            const json = await res.json();
            if (json.success && json.data) {
                setData(json.data);
                // Trigger 3-stage push notifications check (deduplicated via localStorage)
                dispatchCompliancePushAlerts(json.data).catch((err) => {
                    console.warn("Compliance push dispatch warning:", err);
                });
            }
        } catch (error) {
            console.error("Failed to fetch compliance:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCompliance();

        const handleOpen = (e: any) => {
            if (e?.detail?.type) {
                const mapType: Record<string, "insurance" | "revenue" | "emission"> = {
                    insurance: "insurance",
                    revenueLicense: "revenue",
                    emissionTest: "emission",
                };
                if (mapType[e.detail.type]) {
                    setSelectedTab(mapType[e.detail.type]);
                }
            }
            setIsEditModalOpen(true);
        };

        const handleUpdated = () => fetchCompliance();

        window.addEventListener("openComplianceModal", handleOpen);
        window.addEventListener("complianceUpdated", handleUpdated);

        return () => {
            window.removeEventListener("openComplianceModal", handleOpen);
            window.removeEventListener("complianceUpdated", handleUpdated);
        };
    }, []);

    const getStatusPill = (status: "VALID" | "EXPIRING_SOON" | "EXPIRED", days: number) => {
        if (status === "EXPIRED" || days < 0) {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 border border-rose-500/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                    EXPIRED ({Math.abs(days)}d ago)
                </span>
            );
        }
        if (days <= 5) {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/20 border border-red-500/50 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.3)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    STAGE 3 // {days}d FINAL NOTICE
                </span>
            );
        }
        if (days <= 15) {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/20 border border-orange-500/50 text-orange-300 shadow-[0_0_12px_rgba(249,115,22,0.25)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                    STAGE 2 // DUE IN {days}d
                </span>
            );
        }
        if (days <= 30) {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    STAGE 1 // DUE IN {days}d
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                ACTIVE // {days}d LEFT
            </span>
        );
    };

    const insurance = data?.compliance?.insurance;
    const revenue = data?.compliance?.revenueLicense;
    const emission = data?.compliance?.emissionTest;
    const computed = data?.computed;

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Urgent Top Alert Banner */}
            {data?.hasAlert && (
                <ComplianceAlertBanner
                    alerts={data.urgentAlerts}
                    onRenewClick={() => setIsEditModalOpen(true)}
                />
            )}

            {/* Main Compliance Instrument Card */}
            <div className="cyber-card rounded-2xl p-6 relative overflow-hidden flex flex-col gap-6">
                <div className="cyber-corner-tl" />
                <div className="cyber-corner-br" />

                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-mono font-bold text-white tracking-wider">
                                    VEHICLE COMPLIANCE & LEGAL PAPERS
                                </h3>
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            </div>
                            <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">
                                ROAD LEGALITY TELEMETRY // EXPIRY & RENEWAL TRACKER
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold tracking-wider text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 hover:text-white transition-all shadow-[0_0_12px_rgba(0,240,255,0.12)]"
                        >
                            <Settings className="w-3.5 h-3.5" />
                            <span>MANAGE & RENEW PAPERS</span>
                        </button>
                    </div>
                </div>

                {/* 3-Column Document Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* DOCUMENT 1: INSURANCE */}
                    <div
                        className={cn(
                            "p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all relative overflow-hidden bg-black/40",
                            computed?.insurance.status === "EXPIRED"
                                ? "border-rose-500/40 bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                                : computed?.insurance.status === "EXPIRING_SOON"
                                ? "border-amber-500/40 bg-amber-950/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                                : "border-white/10 hover:border-cyan-500/30"
                        )}
                    >
                        <div className="flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                                        <Shield className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-mono font-bold text-white tracking-wide">
                                            VEHICLE INSURANCE
                                        </h4>
                                        <span className="text-[10px] font-mono text-gray-400">
                                            {insurance?.policyType || "Comprehensive"}
                                        </span>
                                    </div>
                                </div>
                                {computed && getStatusPill(computed.insurance.status, computed.insurance.daysRemaining)}
                            </div>

                            <div className="mt-2 space-y-1.5 font-mono text-xs">
                                <div className="flex items-center justify-between text-gray-400">
                                    <span className="text-[11px]">Provider:</span>
                                    <span className="text-white font-medium truncate max-w-[170px]">
                                        {insurance?.provider || "Sri Lanka Insurance"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-gray-400">
                                    <span className="text-[11px]">Policy #:</span>
                                    <span className="text-cyan-300 font-semibold">{insurance?.policyNumber || "N/A"}</span>
                                </div>
                                <div className="flex items-center justify-between text-gray-400">
                                    <span className="text-[11px]">Start Date:</span>
                                    <span className="text-gray-300 font-mono">{insurance?.issueDate || "Not Set"}</span>
                                </div>
                                <div className="flex items-center justify-between text-gray-400">
                                    <span className="text-[11px] font-bold text-cyan-400">Due Date:</span>
                                    <span className="text-white font-bold flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-cyan-400" />
                                        {insurance?.expiryDate || "Not Set"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions: Hotline */}
                        {insurance?.emergencyHotline && (
                            <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                                <span className="text-[10px] font-mono text-gray-500">24/7 ROADSIDE ASSIST</span>
                                <a
                                    href={`tel:${insurance.emergencyHotline.replace(/\s+/g, "")}`}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 hover:bg-cyan-500/20 hover:text-white transition-colors shrink-0"
                                >
                                    <Phone className="w-3 h-3" />
                                    <span>{insurance.emergencyHotline}</span>
                                </a>
                            </div>
                        )}
                    </div>

                    {/* DOCUMENT 2: REVENUE LICENSE */}
                    <div
                        className={cn(
                            "p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all relative overflow-hidden bg-black/40",
                            computed?.revenueLicense.status === "EXPIRED"
                                ? "border-rose-500/40 bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                                : computed?.revenueLicense.status === "EXPIRING_SOON"
                                ? "border-amber-500/40 bg-amber-950/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                                : "border-white/10 hover:border-cyan-500/30"
                        )}
                    >
                        <div className="flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-mono font-bold text-white tracking-wide">
                                            REVENUE LICENSE
                                        </h4>
                                        <span className="text-[10px] font-mono text-gray-400">
                                            Road Tax / Annual Permit
                                        </span>
                                    </div>
                                </div>
                                {computed && getStatusPill(computed.revenueLicense.status, computed.revenueLicense.daysRemaining)}
                            </div>

                            <div className="mt-2 space-y-1.5 font-mono text-xs">
                                <div className="flex items-center justify-between text-gray-400">
                                    <span className="text-[11px]">Province:</span>
                                    <span className="text-white font-medium">
                                        {revenue?.provincialCouncil || "Western Province"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-gray-400">
                                    <span className="text-[11px]">License #:</span>
                                    <span className="text-cyan-300 font-semibold">{revenue?.licenseNumber || "N/A"}</span>
                                </div>
                                <div className="flex items-center justify-between text-gray-400">
                                    <span className="text-[11px]">Start Date:</span>
                                    <span className="text-gray-300 font-mono">{revenue?.issueDate || "Not Set"}</span>
                                </div>
                                <div className="flex items-center justify-between text-gray-400">
                                    <span className="text-[11px] font-bold text-cyan-400">Due Date:</span>
                                    <span className="text-white font-bold flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-cyan-400" />
                                        {revenue?.expiryDate || "Not Set"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-400">
                            <span className="text-gray-400 font-mono">{revenue?.provincialCouncil || "Western Province"}</span>
                            <span className="text-cyan-400 font-medium">{revenue?.fee ? `Fee: ${revenue.fee}` : "ANNUAL PASS"}</span>
                        </div>
                    </div>

                    {/* DOCUMENT 3: EMISSION TEST */}
                    <div
                        className={cn(
                            "p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all relative overflow-hidden bg-black/40",
                            computed?.emissionTest.status === "EXPIRED"
                                ? "border-rose-500/40 bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                                : computed?.emissionTest.status === "EXPIRING_SOON"
                                ? "border-amber-500/40 bg-amber-950/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                                : "border-white/10 hover:border-cyan-500/30"
                        )}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                                    <Wind className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-mono font-bold text-white tracking-wide">
                                        EMISSION TEST
                                    </h4>
                                    <span className="text-[10px] font-mono text-gray-400">
                                        VET Clean Air Cert
                                    </span>
                                </div>
                            </div>
                            {computed && getStatusPill(computed.emissionTest.status, computed.emissionTest.daysRemaining)}
                        </div>

                        <div className="space-y-1.5 text-xs font-mono">
                            <div className="p-2 rounded-lg bg-black/40 border border-white/5 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-gray-400">Certificate:</span>
                                    <span className="text-cyan-300 font-semibold">{emission?.certificateNumber || "N/A"}</span>
                                </div>
                                <div className="flex items-center justify-between text-gray-400">
                                    <span className="text-[11px]">Start Date:</span>
                                    <span className="text-gray-300 font-mono">{emission?.issueDate || "Not Set"}</span>
                                </div>
                                <div className="flex items-center justify-between text-gray-400">
                                    <span className="text-[11px] font-bold text-cyan-400">Due Date:</span>
                                    <span className="text-white font-bold flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-cyan-400" />
                                        {emission?.expiryDate || "Not Set"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-400">
                            <span className="text-gray-400 font-mono">{emission?.testCenter || "DriveGreen"}</span>
                            <span className="text-emerald-400 font-medium">EURO 5 / BS6</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Compliance Modal with OCR */}
            <EditComplianceModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                initialData={data?.compliance}
                onSuccess={fetchCompliance}
                initialTab={selectedTab}
            />
        </div>
    );
}
