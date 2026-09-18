"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    UploadCloud,
    FileJson,
    CheckCircle2,
    AlertCircle,
    Database,
    ArrowRight,
    RefreshCw,
    ShieldAlert,
} from "lucide-react";
import { useServiceContext } from "@/context/ServiceContext";

interface ImportBackupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ImportBackupModal({ isOpen, onClose }: ImportBackupModalProps) {
    const { refreshRecords } = useServiceContext();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<{
        metadata?: any;
        records: any[];
    } | null>(null);
    const [mode, setMode] = useState<"append" | "replace">("append");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileProcess = (selectedFile: File) => {
        setError(null);
        setSuccessMessage(null);

        if (!selectedFile.name.endsWith(".json")) {
            setError("Invalid file format. Please upload a valid .json telemetry backup file.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const json = JSON.parse(text);

                let records: any[] = [];
                let metadata: any = null;

                if (Array.isArray(json)) {
                    records = json;
                } else if (json && typeof json === "object") {
                    metadata = json.metadata || null;
                    if (Array.isArray(json.records)) {
                        records = json.records;
                    }
                }

                if (records.length === 0) {
                    setError("No service records found in this JSON file.");
                    setParsedData(null);
                    setFile(null);
                    return;
                }

                setFile(selectedFile);
                setParsedData({ metadata, records });
            } catch (err: any) {
                setError(`Failed to parse JSON file: ${err.message || "Invalid syntax"}`);
                setParsedData(null);
                setFile(null);
            }
        };

        reader.onerror = () => {
            setError("Failed to read the selected file.");
        };

        reader.readAsText(selectedFile);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileProcess(e.dataTransfer.files[0]);
        }
    };

    const handleImport = async () => {
        if (!parsedData || parsedData.records.length === 0) return;

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/records/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    records: parsedData.records,
                    mode,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to import records.");
            }

            setSuccessMessage(data.message || `Successfully restored ${data.count} records.`);
            await refreshRecords();

            setTimeout(() => {
                handleClose();
            }, 2000);
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred during restore.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setParsedData(null);
        setError(null);
        setSuccessMessage(null);
        setIsLoading(false);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div key="import-backup-modal-container" className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 15 }}
                        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#070b14] shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_30px_rgba(0,240,255,0.15)] flex flex-col max-h-[90vh]"
                    >
                        {/* Decorative Corners */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400 rounded-tl-xl" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400 rounded-br-xl" />

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/40">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
                                    <UploadCloud className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-mono font-bold text-white tracking-wider">
                                            RESTORE TELEMETRY ARCHIVE
                                        </h2>
                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                    </div>
                                    <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">
                                        JSON BACKUP DISASTER RECOVERY
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleClose}
                                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex flex-col gap-4">
                            {error && (
                                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-xs flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {successMessage && (
                                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    <span>{successMessage}</span>
                                </div>
                            )}

                            {/* Dropzone */}
                            {!parsedData ? (
                                <div
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDragging(true);
                                    }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                                        isDragging
                                            ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_20px_rgba(0,240,255,0.2)]"
                                            : "border-white/10 hover:border-cyan-500/40 hover:bg-white/5 bg-black/40"
                                    }`}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".json"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                handleFileProcess(e.target.files[0]);
                                            }
                                        }}
                                        className="hidden"
                                    />
                                    <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 mb-3">
                                        <FileJson className="w-8 h-8" />
                                    </div>
                                    <span className="text-sm font-mono font-bold text-white mb-1">
                                        Drop your JSON backup file here
                                    </span>
                                    <span className="text-xs font-mono text-gray-400">
                                        or click to browse your local device
                                    </span>
                                    <span className="mt-3 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400/80 bg-cyan-500/10 border border-cyan-500/20">
                                        ACCEPT: yamaha_mt15_telemetry_backup_*.json
                                    </span>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {/* File Summary Card */}
                                    <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/30 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
                                                <FileJson className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-mono font-bold text-white truncate max-w-xs">
                                                    {file?.name}
                                                </div>
                                                <div className="text-[10px] font-mono text-cyan-400">
                                                    {parsedData.records.length} VERIFIED RECORDS DETECTED
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFile(null);
                                                setParsedData(null);
                                            }}
                                            className="px-2.5 py-1 rounded text-xs font-mono text-gray-400 hover:text-white bg-white/5 border border-white/10"
                                        >
                                            CHANGE
                                        </button>
                                    </div>

                                    {/* Preview Snippet */}
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase font-bold">
                                            PREVIEW OF EXTRACTED ENTRIES
                                        </span>
                                        <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                                            {parsedData.records.slice(0, 3).map((rec, idx) => (
                                                <div
                                                    key={idx}
                                                    className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-xs font-mono"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-cyan-300 font-bold">{rec.date}</span>
                                                        <span className="text-gray-400">|</span>
                                                        <span className="text-white">{rec.mileage?.toLocaleString()} KM</span>
                                                    </div>
                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-300">
                                                        {rec.type || "Maintenance"}
                                                    </span>
                                                </div>
                                            ))}
                                            {parsedData.records.length > 3 && (
                                                <div className="text-center text-[10px] font-mono text-gray-500">
                                                    + {parsedData.records.length - 3} additional records ready to restore
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Mode Selection */}
                                    <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                                        <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-bold">
                                            CHOOSE RESTORE STRATEGY
                                        </span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setMode("append")}
                                                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                                                    mode === "append"
                                                        ? "border-cyan-400 bg-cyan-500/10 text-white shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                                                        : "border-white/10 bg-black/40 text-gray-400 hover:border-white/20"
                                                }`}
                                            >
                                                <span className="font-mono text-xs font-bold text-cyan-300">
                                                    MERGE & APPEND
                                                </span>
                                                <span className="font-mono text-[10px] text-gray-400 leading-tight">
                                                    Keep current entries and insert backup records alongside them.
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setMode("replace")}
                                                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                                                    mode === "replace"
                                                        ? "border-rose-500 bg-rose-500/10 text-white shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                                                        : "border-white/10 bg-black/40 text-gray-400 hover:border-white/20"
                                                }`}
                                            >
                                                <span className="font-mono text-xs font-bold text-rose-400 flex items-center gap-1">
                                                    <ShieldAlert className="w-3 h-3" />
                                                    WIPE & OVERWRITE
                                                </span>
                                                <span className="font-mono text-[10px] text-gray-400 leading-tight">
                                                    Clear current database and restore strictly from this archive.
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-white/5 bg-black/40 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 rounded-xl text-xs font-mono text-gray-400 hover:text-white bg-white/5 border border-white/10 transition-colors"
                            >
                                CANCEL
                            </button>

                            <button
                                type="button"
                                onClick={handleImport}
                                disabled={!parsedData || isLoading}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all disabled:opacity-50"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                                <span>{isLoading ? "IMPORTING & ENCRYPTING..." : "RESTORE TELEMETRY DATA"}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
