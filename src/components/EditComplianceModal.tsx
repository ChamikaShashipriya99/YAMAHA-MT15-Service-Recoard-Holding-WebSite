"use client";

import React, { useState, useEffect, useRef } from "react";
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
    Calendar,
    UploadCloud,
    Sparkles,
    Loader2,
    Eye,
    Trash2,
    ScanLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { scanDocumentWithOCR, ParsedDocumentData } from "@/lib/ocrDocumentParser";

interface EditComplianceModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: any;
    onSuccess: () => void;
}

type TabType = "insurance" | "revenue" | "emission";

async function compressImageToDataUrl(file: File, maxWidth: number = 1000): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", 0.82));
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export default function EditComplianceModal({
    isOpen,
    onClose,
    initialData,
    onSuccess,
}: EditComplianceModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>("insurance");
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // OCR Scanning State
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [scanStatusText, setScanStatusText] = useState("");
    const [ocrAutoFillAlert, setOcrAutoFillAlert] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Handle File Upload & OCR Extraction
    const handleDocumentUpload = async (file: File) => {
        if (!file) return;

        setIsScanning(true);
        setScanProgress(5);
        setScanStatusText("Preparing image for scan...");
        setOcrAutoFillAlert(null);

        try {
            // 1. Generate compressed Data URL for storage/preview
            const dataUrl = await compressImageToDataUrl(file);

            // 2. Perform OCR & Intelligent Extraction
            const extracted = await scanDocumentWithOCR(file, activeTab, (progress, statusText) => {
                setScanProgress(progress);
                setScanStatusText(statusText);
            });

            // 3. Auto-populate Form Fields based on activeTab
            if (activeTab === "insurance") {
                setFormData((prev) => ({
                    ...prev,
                    insurance: {
                        ...prev.insurance,
                        issueDate: extracted.issueDate || prev.insurance.issueDate,
                        expiryDate: extracted.expiryDate || prev.insurance.expiryDate,
                        policyNumber: extracted.documentNumber || prev.insurance.policyNumber,
                        provider: extracted.providerOrCenter || prev.insurance.provider,
                        policyType: extracted.secondaryInfo || prev.insurance.policyType,
                        documentPhotoUrl: dataUrl,
                    },
                }));
            } else if (activeTab === "revenue") {
                setFormData((prev) => ({
                    ...prev,
                    revenueLicense: {
                        ...prev.revenueLicense,
                        issueDate: extracted.issueDate || prev.revenueLicense.issueDate,
                        expiryDate: extracted.expiryDate || prev.revenueLicense.expiryDate,
                        licenseNumber: extracted.documentNumber || prev.revenueLicense.licenseNumber,
                        provincialCouncil: extracted.secondaryInfo || prev.revenueLicense.provincialCouncil,
                        documentPhotoUrl: dataUrl,
                    },
                }));
            } else if (activeTab === "emission") {
                setFormData((prev) => ({
                    ...prev,
                    emissionTest: {
                        ...prev.emissionTest,
                        issueDate: extracted.issueDate || prev.emissionTest.issueDate,
                        expiryDate: extracted.expiryDate || prev.emissionTest.expiryDate,
                        certificateNumber: extracted.documentNumber || prev.emissionTest.certificateNumber,
                        testCenter: extracted.providerOrCenter || prev.emissionTest.testCenter,
                        status: extracted.status || "PASS",
                        documentPhotoUrl: dataUrl,
                    },
                }));
            }

            const extractedSummary: string[] = [];
            if (extracted.issueDate) extractedSummary.push(`Start Date: ${extracted.issueDate}`);
            if (extracted.expiryDate) extractedSummary.push(`Due Date: ${extracted.expiryDate}`);
            if (extracted.status) extractedSummary.push(`Status: ${extracted.status}`);
            if (extracted.documentNumber) extractedSummary.push(`Doc #: ${extracted.documentNumber}`);

            setOcrAutoFillAlert(
                `⚡ AI Auto-Detected: ${extractedSummary.length > 0 ? extractedSummary.join(" | ") : "Document dates extracted!"}`
            );
        } catch (err: any) {
            console.error("OCR Scan Error:", err);
            setStatusMessage({ type: "error", text: "OCR scanning failed. You can still input dates manually." });
        } finally {
            setIsScanning(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

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

    const currentDocPhoto =
        activeTab === "insurance"
            ? formData.insurance.documentPhotoUrl
            : activeTab === "revenue"
            ? formData.revenueLicense.documentPhotoUrl
            : formData.emissionTest.documentPhotoUrl;

    const clearCurrentPhoto = () => {
        if (activeTab === "insurance") {
            setFormData((prev) => ({ ...prev, insurance: { ...prev.insurance, documentPhotoUrl: "" } }));
        } else if (activeTab === "revenue") {
            setFormData((prev) => ({ ...prev, revenueLicense: { ...prev.revenueLicense, documentPhotoUrl: "" } }));
        } else {
            setFormData((prev) => ({ ...prev, emissionTest: { ...prev.emissionTest, documentPhotoUrl: "" } }));
        }
        setOcrAutoFillAlert(null);
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
                                        AI DOCUMENT SCANNER & RENEWAL MANAGER
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
                                onClick={() => {
                                    setActiveTab("insurance");
                                    setOcrAutoFillAlert(null);
                                }}
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
                                onClick={() => {
                                    setActiveTab("revenue");
                                    setOcrAutoFillAlert(null);
                                }}
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
                                onClick={() => {
                                    setActiveTab("emission");
                                    setOcrAutoFillAlert(null);
                                }}
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
                        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-y-auto">
                            <div className="p-6 flex-1 flex flex-col gap-4">
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

                                {/* Hidden File Input */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleDocumentUpload(file);
                                    }}
                                    className="hidden"
                                />

                                {/* AI OCR UPLOAD DROPZONE */}
                                <div className="rounded-xl border border-cyan-500/30 bg-black/40 p-3.5 relative overflow-hidden flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400">
                                            <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                                            <span>AI SMART DOCUMENT SCANNER</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-gray-400">
                                            AUTO-SELECTS DATES & STATUS
                                        </span>
                                    </div>

                                    {/* Scanning In-Progress HUD */}
                                    {isScanning ? (
                                        <div className="py-4 px-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 flex flex-col items-center justify-center gap-2">
                                            <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>{scanStatusText || "Scanning document with AI..."}</span>
                                                <span className="text-white font-bold">{scanProgress}%</span>
                                            </div>
                                            <div className="w-full max-w-xs h-1.5 bg-black/60 rounded-full overflow-hidden border border-cyan-500/30">
                                                <div
                                                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
                                                    style={{ width: `${scanProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    ) : currentDocPhoto ? (
                                        /* Document Uploaded / Preview Active */
                                        <div className="flex items-center justify-between p-2 rounded-lg bg-black/60 border border-white/10">
                                            <div className="flex items-center gap-3">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={currentDocPhoto}
                                                    alt="Document Preview"
                                                    className="w-12 h-12 object-cover rounded-lg border border-cyan-500/30"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-mono font-bold text-white">
                                                        Document Photo Attached
                                                    </span>
                                                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Stored in Digital Wallet
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="px-2.5 py-1 rounded-lg text-[10px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 hover:bg-cyan-500/20 transition-all"
                                                >
                                                    RE-SCAN
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={clearCurrentPhoto}
                                                    className="p-1 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-white/5 transition-all"
                                                    title="Remove Photo"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Upload Trigger Box */
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="cursor-pointer py-4 px-3 rounded-lg border border-dashed border-cyan-500/30 hover:border-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all flex flex-col items-center justify-center gap-1.5 text-center group"
                                        >
                                            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                                                <UploadCloud className="w-5 h-5" />
                                            </div>
                                            <div className="text-xs font-mono text-gray-200">
                                                <span className="text-cyan-400 font-bold underline">Click or Drop</span> photo of your{" "}
                                                {activeTab === "insurance"
                                                    ? "Insurance Card"
                                                    : activeTab === "revenue"
                                                    ? "Revenue License Sticker"
                                                    : "Emission Test Certificate"}
                                            </div>
                                            <span className="text-[10px] font-mono text-gray-400">
                                                AI automatically extracts Start Date, Due Date & Status (PNG, JPG, WebP)
                                            </span>
                                        </div>
                                    )}

                                    {/* Auto-Fill Success Alert Banner */}
                                    {ocrAutoFillAlert && (
                                        <div className="flex items-center gap-2 p-2.5 rounded-lg text-[11px] font-mono bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
                                            <Sparkles className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                                            <span>{ocrAutoFillAlert}</span>
                                        </div>
                                    )}
                                </div>

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

                                            <div>
                                                <label className="text-[11px] font-mono text-cyan-400 font-bold block mb-1">
                                                    Start Date (Policy Issue Date)
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.insurance.issueDate}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            insurance: { ...formData.insurance, issueDate: e.target.value },
                                                        })
                                                    }
                                                    className="w-full bg-black/50 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none [color-scheme:dark]"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-mono text-cyan-400 font-bold block mb-1">
                                                    Due Date (Policy Expiry Date) *
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.insurance.expiryDate}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            insurance: { ...formData.insurance, expiryDate: e.target.value },
                                                        })
                                                    }
                                                    className="w-full bg-black/50 border border-cyan-500/50 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none [color-scheme:dark]"
                                                    required
                                                />
                                            </div>

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

                                            <div>
                                                <label className="text-[11px] font-mono text-cyan-400 font-bold block mb-1">
                                                    Start Date (License Issue Date)
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.revenueLicense.issueDate}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            revenueLicense: { ...formData.revenueLicense, issueDate: e.target.value },
                                                        })
                                                    }
                                                    className="w-full bg-black/50 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none [color-scheme:dark]"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-mono text-cyan-400 font-bold block mb-1">
                                                    Due Date (License Expiry Date) *
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.revenueLicense.expiryDate}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            revenueLicense: { ...formData.revenueLicense, expiryDate: e.target.value },
                                                        })
                                                    }
                                                    className="w-full bg-black/50 border border-cyan-500/50 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none [color-scheme:dark]"
                                                    required
                                                />
                                            </div>

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

                                            <div>
                                                <label className="text-[11px] font-mono text-cyan-400 font-bold block mb-1">
                                                    Start Date (Test Date)
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.emissionTest.issueDate}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            emissionTest: { ...formData.emissionTest, issueDate: e.target.value },
                                                        })
                                                    }
                                                    className="w-full bg-black/50 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none [color-scheme:dark]"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-mono text-cyan-400 font-bold block mb-1">
                                                    Due Date (Certificate Expiry Date) *
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.emissionTest.expiryDate}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            emissionTest: { ...formData.emissionTest, expiryDate: e.target.value },
                                                        })
                                                    }
                                                    className="w-full bg-black/50 border border-cyan-500/50 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none [color-scheme:dark]"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-mono text-cyan-400 font-bold block mb-1">
                                                    Test Result Status (Auto-Selected)
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

                            {/* Modal Footer */}
                            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-black/40">
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
                                        disabled={isSaving || isScanning}
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
