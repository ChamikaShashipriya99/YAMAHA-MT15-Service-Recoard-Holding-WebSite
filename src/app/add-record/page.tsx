"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useServiceContext } from "@/context/ServiceContext";
import {
    Calendar,
    Gauge,
    Save,
    CheckCircle2,
    AlertCircle,
    Droplets,
    Filter,
    ArrowLeft,
    Coins,
    Terminal,
    FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CyberDatePicker from "@/components/CyberDatePicker";

export default function AddRecordPage() {
    const router = useRouter();
    const { addRecord } = useServiceContext();
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split("T")[0],
        mileage: "",
        oilChange: true,
        filterChange: true,
        notes: "",
        cost: "",
    });

    const derivedType =
        formData.oilChange && formData.filterChange
            ? "Full Service"
            : formData.oilChange
            ? "Oil Change"
            : "Maintenance";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await addRecord({
                date: formData.date,
                mileage: Number(formData.mileage),
                oilChange: formData.oilChange,
                filterChange: formData.filterChange,
                notes: formData.notes,
                cost: formData.cost ? `Rs. ${formData.cost}` : undefined,
                type: derivedType,
            });

            setSuccess(true);
            setTimeout(() => {
                router.push("/history");
            }, 1200);
        } catch (error) {
            console.error("Failed to add record", error);
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-6">
            {/* Navigation back */}
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-cyan-400 transition-colors w-fit"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                RETURN TO COCKPIT
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="cyber-card rounded-2xl p-6 sm:p-8 relative overflow-hidden"
            >
                <div className="cyber-corner-tl" />
                <div className="cyber-corner-br" />

                {/* Top Terminal Banner */}
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/5">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="p-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                                <Terminal className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-[11px] font-mono tracking-widest text-cyan-400 font-semibold uppercase">
                                TERMINAL // LOG_NEW_MAINTENANCE_EVENT
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-white">
                            NEW SERVICE <span className="text-cyan-400">ENTRY</span>
                        </h1>
                    </div>

                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[10px] font-mono text-gray-400 uppercase">SYSTEM AUTO-TYPE</span>
                        <span className="mt-0.5 px-3 py-1 rounded-md text-xs font-mono font-bold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            {derivedType}
                        </span>
                    </div>
                </div>

                <AnimatePresence>
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-3 text-cyan-300"
                        >
                            <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                            <div className="text-xs font-mono">
                                <p className="font-bold">RECORD TRANSMITTED SUCCESSFULLY</p>
                                <p className="text-gray-400">Synchronized with MongoDB Atlas. Redirecting...</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {/* Primary Grid: Date & Mileage */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Service Date */}
                        <CyberDatePicker
                            value={formData.date}
                            onChange={(dateStr) => setFormData({ ...formData, date: dateStr })}
                            label="SERVICE DATE"
                            required
                        />

                        {/* Mileage */}
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
                                    placeholder="e.g. 12500"
                                    value={formData.mileage}
                                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                                    className="w-full pl-3.5 pr-12 py-2.5 text-xs font-mono bg-black/60 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 transition-colors"
                                />
                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-gray-500">
                                    KM
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Component Replacements Toggles */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-mono text-gray-300 uppercase tracking-wider">
                            HARDWARE & FLUIDS REPLACED
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Oil Change Toggle Card */}
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

                            {/* Filter Change Toggle Card */}
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

                    {/* Cost & Notes */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1.5 sm:col-span-1">
                            <label className="text-xs font-mono text-gray-300 flex items-center gap-2">
                                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                                TOTAL COST (OPTIONAL)
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
                                placeholder="e.g. Chain adjusted and lubed, clutch free play set"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-3.5 py-2.5 text-xs font-mono bg-black/60 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3">
                        <Link href="/">
                            <button
                                type="button"
                                className="px-4 py-2.5 rounded-xl text-xs font-mono font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                            >
                                CANCEL
                            </button>
                        </Link>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider text-black bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500 shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] transition-all disabled:opacity-50"
                        >
                            <Save className="w-4 h-4 stroke-[2.5]" />
                            <span>{isLoading ? "TRANSMITTING..." : "SAVE TELEMETRY LOG"}</span>
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
