"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useServiceContext } from "@/context/ServiceContext";
import { Calendar, Gauge, Save, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function EditRecordPage() {
    const router = useRouter();
    const params = useParams();
    const { records, updateRecord } = useServiceContext();
    const [isLoading, setIsLoading] = useState(false);

    // Initialize with empty values, will populate in useEffect
    const [formData, setFormData] = useState({
        date: "",
        mileage: "",
        oilChange: false,
        filterChange: false,
        notes: "",
    });

    const [recordFound, setRecordFound] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    // Find record and populate form
    useEffect(() => {
        if (records.length > 0 && params.id) {
            const record = records.find(r => r.id === params.id);
            if (record) {
                setFormData({
                    date: record.date,
                    mileage: record.mileage.toString(),
                    oilChange: record.oilChange,
                    filterChange: record.filterChange,
                    notes: record.notes,
                });
                setRecordFound(true);
            }
            setIsInitializing(false);
        } else if (records.length === 0) {
            // Records might still be loading from localStorage
            const timer = setTimeout(() => setIsInitializing(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [records, params.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recordFound || !params.id) return;

        setIsLoading(true);

        // Simulate delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        updateRecord(params.id as string, {
            date: formData.date,
            mileage: Number(formData.mileage),
            oilChange: formData.oilChange,
            filterChange: formData.filterChange,
            notes: formData.notes,
            // Recalculate type based on new checkbox values
            type: formData.oilChange && formData.filterChange ? "Full Service" : formData.oilChange ? "Oil Change" : "Maintenance",
        });

        router.push("/history");
    };

    if (isInitializing) {
        return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
    }

    if (!recordFound && !isInitializing) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-white gap-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <h2 className="text-xl font-bold">Record not found</h2>
                <button onClick={() => router.push("/history")} className="text-cyan-400 hover:underline">
                    Go back to history
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8 min-h-[calc(100vh-6rem)] flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full glass rounded-3xl p-6 md:p-10 relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-600" />

                <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <Save className="w-8 h-8 text-orange-400" />
                    Edit Service Record
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Date Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-orange-400" />
                            Service Date
                        </label>
                        <input
                            type="date"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                        />
                    </div>

                    {/* Mileage Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Gauge className="w-4 h-4 text-orange-400" />
                            Mileage (km)
                        </label>
                        <input
                            type="number"
                            required
                            min="0"
                            value={formData.mileage}
                            onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all font-mono"
                        />
                    </div>

                    {/* Checkboxes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all group">
                            <input
                                type="checkbox"
                                checked={formData.oilChange}
                                onChange={(e) => setFormData({ ...formData, oilChange: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-600 text-orange-500 focus:ring-orange-500/50 bg-gray-800"
                            />
                            <span className="text-gray-200 group-hover:text-white transition-colors">Oil Change</span>
                        </label>

                        <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all group">
                            <input
                                type="checkbox"
                                checked={formData.filterChange}
                                onChange={(e) => setFormData({ ...formData, filterChange: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-600 text-orange-500 focus:ring-orange-500/50 bg-gray-800"
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
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all resize-none"
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-white font-semibold py-4 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? "Updating..." : "Update Record"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
