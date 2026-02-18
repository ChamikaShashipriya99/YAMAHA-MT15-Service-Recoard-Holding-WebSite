"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useServiceContext } from "@/context/ServiceContext";
import { Calendar, Gauge, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AddRecordPage() {
    const router = useRouter();
    const { addRecord } = useServiceContext();
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split("T")[0],
        mileage: "",
        oilChange: false,
        filterChange: false,
        notes: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate network delay for better UX
        await new Promise((resolve) => setTimeout(resolve, 800));

        addRecord({
            date: formData.date,
            mileage: Number(formData.mileage),
            oilChange: formData.oilChange,
            filterChange: formData.filterChange,
            notes: formData.notes,
        });

        setSuccess(true);
        setTimeout(() => {
            router.push("/");
        }, 1500);
    };

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8 min-h-[calc(100vh-6rem)] flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full glass rounded-3xl p-6 md:p-10 relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />

                <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <Save className="w-8 h-8 text-cyan-400" />
                    Add Service Record
                </h1>

                <AnimatePresence>
                    {success ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 z-20 bg-[#0a0a0a]/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-8"
                        >
                            <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
                            <h2 className="text-2xl font-bold text-white">Record Saved!</h2>
                            <p className="text-gray-400 mt-2">Redirecting to dashboard...</p>
                        </motion.div>
                    ) : null}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Date Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-cyan-400" />
                            Service Date
                        </label>
                        <input
                            type="date"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                        />
                    </div>

                    {/* Mileage Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Gauge className="w-4 h-4 text-cyan-400" />
                            Current Mileage (km)
                        </label>
                        <input
                            type="number"
                            required
                            min="0"
                            placeholder="e.g. 12500"
                            value={formData.mileage}
                            onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                        />
                    </div>

                    {/* Checkboxes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all group">
                            <input
                                type="checkbox"
                                checked={formData.oilChange}
                                onChange={(e) => setFormData({ ...formData, oilChange: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-600 text-cyan-500 focus:ring-cyan-500/50 bg-gray-800"
                            />
                            <span className="text-gray-200 group-hover:text-white transition-colors">Oil Change</span>
                        </label>

                        <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all group">
                            <input
                                type="checkbox"
                                checked={formData.filterChange}
                                onChange={(e) => setFormData({ ...formData, filterChange: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-600 text-cyan-500 focus:ring-cyan-500/50 bg-gray-800"
                            />
                            <span className="text-gray-200 group-hover:text-white transition-colors">Oil Filter Change</span>
                        </label>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">
                            Additional Notes
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Any other maintenance done..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-500/20 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>Saving...</>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Save Record
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
