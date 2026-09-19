"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Shield,
    FileText,
    Wind,
    Save,
    CheckCircle2,
    AlertCircle,
    Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CyberDatePicker from "@/components/CyberDatePicker";

interface EditComplianceModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: any;
    onSuccess: () => void;
    initialTab?: TabType;
}

type TabType = "insurance" | "revenue" | "emission";

export default function EditComplianceModal({
    isOpen,
    onClose,
    initialData,
    onSuccess,
    initialTab,
}: EditComplianceModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>(initialTab || "insurance");
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab, isOpen]);

    // Form state
    const [formData, setFormData] = useState({
        insurance: {
            provider: "",
            policyNumber: "",
            policyType: "Comprehensive (Full)",
            issueDate: "",
            expiryDate: "",
            premiumCost: "",
            emergencyHotline: "",
            notes: "",
            documentPhotoUrl: "",
        },
        revenueLicense: {
            licenseNumber: "",
            provincialCouncil: "Western Province",
            issueDate: "",
            expiryDate: "",
            fee: "",
            notes: "",
            documentPhotoUrl: "",
        },
        emissionTest: {
            testCenter: "DriveGreen (CleanCo)",
            certificateNumber: "",
            issueDate: "",
            expiryDate: "",
            status: "PASS",
            fee: "",
            notes: "",
            documentPhotoUrl: "",
        },
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                insurance: {
                    provider: initialData.insurance?.provider || "Sri Lanka Insurance",
                    policyNumber: initialData.insurance?.policyNumber || "",
                    policyType: initialData.insurance?.policyType || "Comprehensive (Full)",
                    issueDate: initialData.insurance?.issueDate || "",
                    expiryDate: initialData.insurance?.expiryDate || "",
                    premiumCost: initialData.insurance?.premiumCost || "",
                    emergencyHotline: initialData.insurance?.emergencyHotline || "0112 357 357",
                    notes: initialData.insurance?.notes || "",
                    documentPhotoUrl: initialData.insurance?.documentPhotoUrl || "",
                },
                revenueLicense: {
                    licenseNumber: initialData.revenueLicense?.licenseNumber || "",
                    provincialCouncil: initialData.revenueLicense?.provincialCouncil || "Western Province",
                    issueDate: initialData.revenueLicense?.issueDate || "",
                    expiryDate: initialData.revenueLicense?.expiryDate || "",
                    fee: initialData.revenueLicense?.fee || "",
                    notes: initialData.revenueLicense?.notes || "",
                    documentPhotoUrl: initialData.revenueLicense?.documentPhotoUrl || "",
                },
                emissionTest: {
                    testCenter: initialData.emissionTest?.testCenter || "DriveGreen (CleanCo)",
                    certificateNumber: initialData.emissionTest?.certificateNumber || "",
                    issueDate: initialData.emissionTest?.issueDate || "",
                    expiryDate: initialData.emissionTest?.expiryDate || "",
                    status: initialData.emissionTest?.status || "PASS",
                    fee: initialData.emissionTest?.fee || "",
                    notes: initialData.emissionTest?.notes || "",
                    documentPhotoUrl: initialData.emissionTest?.documentPhotoUrl || "",
                },
            });
        }
    }, [initialData, isOpen]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setStatusMessage(null);

        try {
            const res = await fetch("/api/compliance", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to update compliance records");
            }

            setStatusMessage({ type: "success", text: "Compliance records & documents updated successfully!" });
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("complianceUpdated"));
            }
            onSuccess();
            setTimeout(() => {
                setStatusMessage(null);
                onClose();
            }, 1200);
        } catch (err: any) {
            setStatusMessage({ type: "error", text: err.message || "An unexpected error occurred" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div key="edit-compliance-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/85 backdrop-blur-md"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 15 }}
                        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#070b14] shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_30px_rgba(0,240,255,0.15)] flex flex-col max-h-[90vh]"
                    >
                        {/* Corner Accents */}
                        <div className="cyber-corner-tl" />
                        <div className="cyber-corner-br" />

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/40">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-mono font-bold text-white tracking-wider">
                                            VEHICLE COMPLIANCE & PAPERS
                                        </h2>
                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                    </div>
                                    <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">
                                        DOCUMENT RECORDS & RENEWAL MANAGER
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex border-b border-white/5 px-6 bg-black/20 gap-2 overflow-x-auto">
                            <button
                                type="button"
                                onClick={() => setActiveTab("insurance")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 text-xs font-mono font-semibold transition-all border-b-2 whitespace-nowrap",
                                    activeTab === "insurance"
                                        ? "border-cyan-400 text-cyan-300 bg-cyan-500/10"
                                        : "border-transparent text-gray-400 hover:text-white"
                                )}
                            >
                                <Shield className="w-4 h-4" />
                                <span>1. VEHICLE INSURANCE</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("revenue")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 text-xs font-mono font-semibold transition-all border-b-2 whitespace-nowrap",
                                    activeTab === "revenue"
                                        ? "border-cyan-400 text-cyan-300 bg-cyan-500/10"
                                        : "border-transparent text-gray-400 hover:text-white"
                                )}
                            >
                                <FileText className="w-4 h-4" />
                                <span>2. REVENUE LICENSE</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("emission")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 text-xs font-mono font-semibold transition-all border-b-2 whitespace-nowrap",
                                    activeTab === "emission"
                                        ? "border-cyan-400 text-cyan-300 bg-cyan-500/10"
                                        : "border-transparent text-gray-400 hover:text-white"
                                )}
                            >
                                <Wind className="w-4 h-4" />
                                <span>3. EMISSION TEST</span>
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
                            <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
                                {statusMessage && (
                                    <div
                                        className={cn(
                                            "flex items-center gap-2 p-3 rounded-xl text-xs font-mono border",
                                            statusMessage.type === "success"
                                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                                                : "bg-rose-500/15 border-rose-500/30 text-rose-300"
                                        )}
                                    >
                                        {statusMessage.type === "success" ? (
                                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                                        ) : (
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                        )}
                                        <span>{statusMessage.text}</span>
                                    </div>
                                )}

                                {/* TAB 1: INSURANCE */}
                                {activeTab === "insurance" && (
                                    <div className="flex flex-col gap-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[11px] font-mono text-gray-300 block mb-1">
                                                    Insurance Provider / Company
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.insurance.provider}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            insurance: { ...formData.insurance, provider: e.target.value },
                                                        })
                                                    }
                                                    placeholder="e.g. Sri Lanka Insurance, Ceylinco VIP, Allianz"
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-mono text-gray-300 block mb-1">
                                                    Policy Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.insurance.policyNumber}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            insurance: { ...formData.insurance, policyNumber: e.target.value },
                                                        })
                                                    }
                                                    placeholder="e.g. POL-MT15-88190"
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                                                    required
                                                />
                                            </div>

                                            <CyberDatePicker
                                                value={formData.insurance.issueDate}
                                                onChange={(dateStr) =>
                                                    setFormData({
                                                        ...formData,
                                                        insurance: { ...formData.insurance, issueDate: dateStr },
                                                    })
                                                }
                                                label="START DATE (POLICY ISSUE)"
                                            />

                                            <CyberDatePicker
                                                value={formData.insurance.expiryDate}
                                                onChange={(dateStr) =>
                                                    setFormData({
                                                        ...formData,
                                                        insurance: { ...formData.insurance, expiryDate: dateStr },
                                                    })
                                                }
                                                label="DUE DATE (POLICY EXPIRY)"
                                                required
                                            />

                                            <div>
                                                <label className="text-[11px] font-mono text-gray-300 block mb-1">
                                                    Coverage Status / Type
                                                </label>
                                                <select
                                                    value={formData.insurance.policyType}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            insurance: { ...formData.insurance, policyType: e.target.value },
                                                        })
                                                    }
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                                                >
                                                    <option value="Comprehensive (Full)">Comprehensive (Full Insurance)</option>
                                                    <option value="Third Party Only">Third Party Only</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-mono text-gray-300 block mb-1">
                                                    Emergency Roadside Hotline
                                                </label>
                                                <div className="relative">
                                                    <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                                                    <input
                                                        type="text"
                                                        value={formData.insurance.emergencyHotline}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                insurance: { ...formData.insurance, emergencyHotline: e.target.value },
                                                            })
                                                        }
                                                        placeholder="e.g. 0112 357 357"
                                                        className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-mono text-gray-300 block mb-1">
                                                    Annual Premium (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.insurance.premiumCost}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            insurance: { ...formData.insurance, premiumCost: e.target.value },
                                                        })
                                                    }
                                                    placeholder="e.g. Rs. 24,500"
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-mono text-gray-300 block mb-1">
                                                    Special Notes
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.insurance.notes}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            insurance: { ...formData.insurance, notes: e.target.value },
                                                        })
                                                    }
                                                    placeholder="e.g. Includes flood & zero dep"
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 2: REVENUE LICENSE */}
                                {activeTab === "revenue" && (
                                    <div className="flex flex-col gap-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[11px] font-mono text-gray-300 block mb-1">
                                                    Revenue License Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.revenueLicense.licenseNumber}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            revenueLicense: { ...formData.revenueLicense, licenseNumber: e.target.value },
                                                        })
                                                    }
                                                    placeholder="e.g. WP-RL-2026-0819"
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-mono text-gray-300 block mb-1">
                                                    Provincial Council / Authority
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.revenueLicense.provincialCouncil}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            revenueLicense: { ...formData.revenueLicense, provincialCouncil: e.target.value },
                                                        })
                                                    }
                                                    placeholder="e.g. Western Province"
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                                                />
                                            </div>

                                            <CyberDatePicker
                                                value={formData.revenueLicense.issueDate}
                                                onChange={(dateStr) =>
                                                    setFormData({
                                                        ...formData,
                                                        revenueLicense: { ...formData.revenueLicense, issueDate: dateStr },
                                                    })
                                                }
                                                label="START DATE (LICENSE ISSUE)"
                                            />

                                            <CyberDatePicker
                                                value={formData.revenueLicense.expiryDate}
                                                onChange={(dateStr) =>
                                                    setFormData({
                                                        ...formData,
                                                        revenueLicense: { ...formData.revenueLicense, expiryDate: dateStr },
                                                    })
                                                }
                                                label="DUE DATE (LICENSE EXPIRY)"
                                                required
                                            />

                                            <div>
                                                <label className="text-[11px] font-mono text-gray-300 block mb-1">
                                                    Road Tax Fee
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.revenueLicense.fee}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            revenueLicense: { ...formData.revenueLicense, fee: e.target.value },
                                                        })
                                                    }
                                                    placeholder="e.g. Rs. 2,850"
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-mono text-gray-300 block mb-1">
                                                    Divisional Secretariat / Notes
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.revenueLicense.notes}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            revenueLicense: { ...formData.revenueLicense, notes: e.target.value },
                                                        })
                                                    }
                                                    placeholder="e.g. Annual road tax pass"
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 3: EMISSION TEST */}
                                {activeTab === "emission" && (
                                    <div className="flex flex-col gap-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[11px] font-mono text-gray-300 block mb-1">
                                                    Vehicle Emission Testing Center
                                                </label>
                                                <select
                                                    value={formData.emissionTest.testCenter}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            emissionTest: { ...formData.emissionTest, testCenter: e.target.value },
                                                        })
                                                    }
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                                                >
                                                    <option value="DriveGreen (CleanCo)">DriveGreen (CleanCo Systems)</option>
                                                    <option value="Laugfs Eco Sri">Laugfs Eco Sri</option>
                                                    <option value="Government Approved Center">Other Authorized Center</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-mono text-gray-300 block mb-1">
                                                    VET Certificate Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.emissionTest.certificateNumber}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            emissionTest: { ...formData.emissionTest, certificateNumber: e.target.value },
                                                        })
                                                    }
                                                    placeholder="e.g. VET-DG-881920"
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                                                    required
                                                />
                                            </div>

                                            <CyberDatePicker
                                                value={formData.emissionTest.issueDate}
                                                onChange={(dateStr) =>
                                                    setFormData({
                                                        ...formData,
                                                        emissionTest: { ...formData.emissionTest, issueDate: dateStr },
                                                    })
                                                }
                                                label="START DATE (TEST DATE)"
                                            />

                                            <CyberDatePicker
                                                value={formData.emissionTest.expiryDate}
                                                onChange={(dateStr) =>
                                                    setFormData({
                                                        ...formData,
                                                        emissionTest: { ...formData.emissionTest, expiryDate: dateStr },
                                                    })
                                                }
                                                label="DUE DATE (CERTIFICATE EXPIRY)"
                                                required
                                            />

                                            <div>
                                                <label className="text-[11px] font-mono text-gray-300 block mb-1">
                                                    Test Result Status
                                                </label>
                                                <select
                                                    value={formData.emissionTest.status}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            emissionTest: { ...formData.emissionTest, status: e.target.value as any },
                                                        })
                                                    }
                                                    className="w-full bg-black/50 border border-cyan-500/40 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                                                >
                                                    <option value="PASS">PASSED (Nominal Emissions)</option>
                                                    <option value="FAIL">FAILED (Requires Tuning)</option>
                                                    <option value="PENDING">PENDING (Testing Due)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-mono text-gray-300 block mb-1">
                                                    Testing Fee
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.emissionTest.fee}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            emissionTest: { ...formData.emissionTest, fee: e.target.value },
                                                        })
                                                    }
                                                    placeholder="e.g. Rs. 1,650"
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer (Pinned at bottom) */}
                            <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-black/60 shrink-0">
                                <div className="text-[10px] font-mono text-gray-400">
                                    * Dates trigger Cockpit countdown badges & legal reminders
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2 rounded-xl text-xs font-mono text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        CANCEL
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-mono font-bold tracking-wider text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 shadow-[0_0_20px_rgba(0,240,255,0.35)] transition-all disabled:opacity-50"
                                    >
                                        <Save className="w-3.5 h-3.5 stroke-[2.5]" />
                                        <span>{isSaving ? "SAVING PAPERS..." : "SAVE & UPDATE"}</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
