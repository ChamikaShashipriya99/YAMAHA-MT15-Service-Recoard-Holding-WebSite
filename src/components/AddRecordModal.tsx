"use client";

import React, { useState } from "react";
import { useServiceContext } from "@/context/ServiceContext";
import {
    X,
    Save,
    CheckCircle2,
    Droplets,
    Filter,
    Coins,
    Terminal,
    FileText,
    Gauge,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CyberDatePicker from "@/components/CyberDatePicker";

export default function AddRecordModal() {
    const { isAddModalOpen, closeAddModal, addRecord } = useServiceContext();
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
                setSuccess(false);
                setIsLoading(false);
                closeAddModal();
                // Reset form
                setFormData({
                    date: new Date().toISOString().split("T")[0],
                    mileage: "",
                    oilChange: true,
                    filterChange: true,
                    notes: "",
                    cost: "",
                });
            }, 900);
        } catch (error) {
            console.error("Failed to add record:", error);
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeAddModal}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal Window Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="relative w-full max-w-2xl bg-[#070b14]/95 backdrop-blur-2xl border border-cyan-500/35 rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(0,240,255,0.18)] p-6 sm:p-8 my-auto z-10"
                    >
                        {/* Corner Brackets */}
                        <div className="cyber-corner-tl" />
                        <div className="cyber-corner-br" />

                        {/* Modal Header */}
                        <div className="flex items-start justify-between pb-4 mb-5 border-b border-white/10">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="p-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                                        <Terminal className="w-3.5 h-3.5" />
                                    </span>
                                    <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">
                                        POPUP TERMINAL // LOG_SERVICE_EVENT
                                    </span>
                                </div>
                                <h2 className="text-2xl font-mono font-bold text-white flex items-center gap-2">
                                    NEW SERVICE <span className="text-cyan-400">ENTRY</span>
                                </h2>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="hidden sm:inline-block px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                                    {derivedType}
                                </span>
                                <button
                                    onClick={closeAddModal}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-colors"
                                    title="Close Window"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Success Notification */}
                        <AnimatePresence>
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mb-5 p-3.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center gap-3 text-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.2)]"
                                >
                                    <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                                    <div className="text-xs font-mono">
                                        <p className="font-bold">RECORD TRANSMITTED SUCCESSFULLY</p>
                                        <p className="text-gray-400">Synchronized with MongoDB Atlas.</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Form Body */}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            {/* Primary Grid: Date & Mileage */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Custom Cyber Calendar Date Picker */}
                                <CyberDatePicker
                                    value={formData.date}
                                    onChange={(dateStr) => setFormData({ ...formData, date: dateStr })}
                                    label="SERVICE DATE"
                                    required
                                />

                                {/* Mileage Input */}
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
                                        className={`cursor-pointer p-3 rounded-xl border transition-all flex items-center justify-between ${
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
                                        className={`cursor-pointer p-3 rounded-xl border transition-all flex items-center justify-between ${
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
                                        placeholder="e.g. Chain adjusted and lubed, brakes checked"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full px-3.5 py-2.5 text-xs font-mono bg-black/60 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-2 pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeAddModal}
                                    className="px-4 py-2.5 rounded-xl text-xs font-mono font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                                >
                                    CANCEL
                                </button>
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
            )}
        </AnimatePresence>
    );
}
