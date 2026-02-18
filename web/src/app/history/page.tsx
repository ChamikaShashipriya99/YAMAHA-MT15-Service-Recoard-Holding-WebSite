"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useServiceContext } from "@/context/ServiceContext";
import { Calendar, Wrench, Droplets, Filter, FileText, History as HistoryIcon, Edit2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import ConfirmModal from "@/components/ConfirmModal";

export default function HistoryPage() {
    const router = useRouter();
    const { records, deleteRecord } = useServiceContext();
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const handleDeleteConfirm = () => {
        if (deleteId) {
            deleteRecord(deleteId);
            setDeleteId(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-[calc(100vh-6rem)]">
            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Service Record?"
                message="This action cannot be undone. This record will be permanently removed from your history and dashboard statistics."
            />

            <header className="mb-8 flex items-center gap-3">
                <div className="p-3 bg-cyan-500/10 rounded-full">
                    <HistoryIcon className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Service History</h1>
                    <p className="text-gray-400 text-sm">All maintenance records</p>
                </div>
            </header>

            {records.length === 0 ? (
                <div className="glass rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-10 h-10 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Records Found</h3>
                    <p className="text-gray-400 max-w-sm">
                        You haven't added any service records yet. Go to the dashboard to add your first record.
                    </p>
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {records.map((record) => (
                        <motion.div
                            key={record.id}
                            variants={item}
                            className="glass p-6 rounded-2xl relative overflow-hidden group hover:border-cyan-500/30 transition-colors flex flex-col h-full"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Wrench className="w-24 h-24 text-cyan-500" />
                            </div>

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div>
                                    <h3 className="text-lg font-bold text-white">{record.type}</h3>
                                    <p className="text-sm text-cyan-400 font-mono">{record.date}</p>
                                </div>
                                <div className="bg-white/10 px-3 py-1 rounded-full text-xs text-gray-300 font-mono">
                                    {record.mileage.toLocaleString()} km
                                </div>
                            </div>

                            <div className="space-y-3 relative z-10 mb-6 flex-1">
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Droplets className={`w-4 h-4 ${record.oilChange ? "text-green-400" : "text-gray-600"}`} />
                                    <span>Oil Change: {record.oilChange ? "Yes" : "No"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Filter className={`w-4 h-4 ${record.filterChange ? "text-green-400" : "text-gray-600"}`} />
                                    <span>Filter Change: {record.filterChange ? "Yes" : "No"}</span>
                                </div>

                                {record.notes && (
                                    <div className="mt-2 pt-2 border-t border-white/5">
                                        <p className="text-gray-300 text-sm italic line-clamp-2">"{record.notes}"</p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 relative z-10 mt-auto pt-4 border-t border-white/10">
                                <button
                                    onClick={() => router.push(`/edit-record/${record.id}`)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-xs font-semibold py-2 rounded-lg transition-colors text-cyan-400 flex items-center justify-center gap-2"
                                >
                                    <Edit2 className="w-3 h-3" /> Edit
                                </button>
                                <button
                                    onClick={() => setDeleteId(record.id)}
                                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold py-2 rounded-lg transition-colors text-red-400 flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-3 h-3" /> Delete
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
}
