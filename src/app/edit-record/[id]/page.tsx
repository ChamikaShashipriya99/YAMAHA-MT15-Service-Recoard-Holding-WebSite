"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useServiceContext } from "@/context/ServiceContext";
import {
    Calendar,
    Gauge,
    Save,
    AlertCircle,
    ArrowLeft,
    Droplets,
    Filter,
    Coins,
    Terminal,
    FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import CyberDatePicker from "@/components/CyberDatePicker";

export default function EditRecordPage() {
    const router = useRouter();
    const params = useParams();
    const { records, updateRecord } = useServiceContext();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        date: "",
        mileage: "",
        oilChange: false,
        filterChange: false,
        notes: "",
        cost: "",
    });

    const [recordFound, setRecordFound] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        if (records.length > 0 && params.id) {
            const record = records.find((r) => r.id === params.id);
            if (record) {
                setFormData({
                    date: record.date,
                    mileage: record.mileage.toString(),
                    oilChange: Boolean(record.oilChange),
                    filterChange: Boolean(record.filterChange),
                    notes: record.notes || "",
                    cost: record.cost ? record.cost.replace("Rs. ", "") : "",
                });
                setRecordFound(true);
            }
            setIsInitializing(false);
        } else if (records.length === 0) {
            const timer = setTimeout(() => setIsInitializing(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [records, params.id]);

    const derivedType =
        formData.oilChange && formData.filterChange
            ? "Full Service"
            : formData.oilChange
            ? "Oil Change"
            : "Maintenance";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recordFound || !params.id) return;

        setIsLoading(true);

        try {
            await updateRecord(params.id as string, {
                date: formData.date,
                mileage: Number(formData.mileage),
                oilChange: formData.oilChange,
                filterChange: formData.filterChange,
                notes: formData.notes,
                cost: formData.cost ? `Rs. ${formData.cost}` : undefined,
                type: derivedType,
            });

            router.push("/history");
        } catch (error) {
            console.error("Failed to update record:", error);
            setIsLoading(false);
        }
    };

    if (isInitializing) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <span className="text-xs font-mono text-cyan-400">INITIALIZING TELEMETRY...</span>
            </div>
        );
    }

    if (!recordFound && !isInitializing) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 gap-3">
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-mono font-bold text-white">RECORD NOT FOUND</h2>
                <p className="text-xs font-mono text-gray-400">The requested telemetry entry cannot be located.</p>
                <Link href="/history" className="mt-2 text-xs font-mono text-cyan-400 hover:underline">
                    RETURN TO SERVICE ARCHIVE
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-6">
            <Link
                href="/history"
                className="inline-flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-cyan-400 transition-colors w-fit"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                RETURN TO HISTORY
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="cyber-card rounded-2xl p-6 sm:p-8 relative overflow-hidden"
            >
                <div className="cyber-corner-tl" />
                <div className="cyber-corner-br" />

                <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/5">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="p-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                                <Terminal className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-[11px] font-mono tracking-widest text-cyan-400 font-semibold uppercase">
                                TERMINAL // MODIFY_MAINTENANCE_EVENT
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-white">
                            EDIT SERVICE <span className="text-cyan-400">RECORD</span>
                        </h1>
                    </div>

                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[10px] font-mono text-gray-400 uppercase">SYSTEM AUTO-TYPE</span>
                        <span className="mt-0.5 px-3 py-1 rounded-md text-xs font-mono font-bold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            {derivedType}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <CyberDatePicker
                            value={formData.date}
                            onChange={(dateStr) => setFormData({ ...formData, date: dateStr })}
                            label="SERVICE DATE"
                            required
                        />

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-mono text-gray-300 flex items-center gap-2">
                                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                                ODOMETER READING (KM)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.mileage}
                                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                                    className="w-full pl-3.5 pr-12 py-2.5 text-xs font-mono bg-black/60 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-colors"
                                />
                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-gray-500">
                                    KM
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-mono text-gray-300 uppercase tracking-wider">
                            HARDWARE & FLUIDS REPLACED
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div
                                onClick={() => setFormData({ ...formData, oilChange: !formData.oilChange })}
                                className={`cursor-pointer p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                                    formData.oilChange
                                        ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                                        : "bg-black/40 border-white/5 text-gray-400 hover:border-white/20"
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Droplets className="w-4 h-4 text-cyan-400" />
                                    <div>
                                        <p className="text-xs font-mono font-bold text-white">Engine Oil</p>
                                        <p className="text-[10px] font-mono text-gray-400">Yamalube 10W-40 4T</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                    formData.oilChange ? "bg-cyan-400 text-black" : "bg-white/5 text-gray-500"
                                }`}>
                                    {formData.oilChange ? "YES" : "NO"}
                                </span>
                            </div>

                            <div
                                onClick={() => setFormData({ ...formData, filterChange: !formData.filterChange })}
                                className={`cursor-pointer p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                                    formData.filterChange
                                        ? "bg-blue-500/10 border-blue-500/40 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                                        : "bg-black/40 border-white/5 text-gray-400 hover:border-white/20"
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Filter className="w-4 h-4 text-blue-400" />
                                    <div>
                                        <p className="text-xs font-mono font-bold text-white">Oil Filter</p>
                                        <p className="text-[10px] font-mono text-gray-400">OEM Filter Cartridge</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                    formData.filterChange ? "bg-blue-400 text-black" : "bg-white/5 text-gray-500"
                                }`}>
                                    {formData.filterChange ? "YES" : "NO"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1.5 sm:col-span-1">
                            <label className="text-xs font-mono text-gray-300 flex items-center gap-2">
                                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                                TOTAL COST
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-gray-500">
                                    Rs.
                                </span>
                                <input
                                    type="text"
                                    placeholder="e.g. 2800"
                                    value={formData.cost}
                                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                    className="w-full pl-10 pr-3.5 py-2.5 text-xs font-mono bg-black/60 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5 sm:col-span-2">
                            <label className="text-xs font-mono text-gray-300 flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-gray-400" />
                                WORK PERFORMED & NOTES
                            </label>
                            <input
                                type="text"
                                placeholder="Service notes..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-3.5 py-2.5 text-xs font-mono bg-black/60 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-4 py-2.5 rounded-xl text-xs font-mono font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                        >
                            CANCEL
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider text-black bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] transition-all disabled:opacity-50"
                        >
                            <Save className="w-4 h-4 stroke-[2.5]" />
                            <span>{isLoading ? "SAVING..." : "UPDATE TELEMETRY LOG"}</span>
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
