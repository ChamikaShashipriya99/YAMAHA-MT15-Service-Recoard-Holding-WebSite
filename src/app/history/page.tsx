"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useServiceContext, ServiceRecord } from "@/context/ServiceContext";
import {
    Calendar,
    Wrench,
    Droplets,
    Filter,
    FileText,
    History as HistoryIcon,
    Edit2,
    Trash2,
    Search,
    Plus,
    Tag,
    Gauge,
    Coins,
    RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmModal from "@/components/ConfirmModal";

export default function HistoryPage() {
    const router = useRouter();
    const { records, deleteRecord, resetAllRecords, openAddModal } = useServiceContext();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState<string>("ALL");

    const handleDeleteConfirm = async () => {
        if (deleteId) {
            await deleteRecord(deleteId);
            setDeleteId(null);
        }
    };

    const handleResetConfirm = async () => {
        await resetAllRecords();
        setIsResetModalOpen(false);
    };

    // Filter records by type and search query
    const filteredRecords = useMemo(() => {
        return records.filter((record) => {
            const matchesType =
                selectedType === "ALL" ||
                (record.type && record.type.toUpperCase() === selectedType.toUpperCase());

            const query = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !query ||
                record.date.toLowerCase().includes(query) ||
                record.mileage.toString().includes(query) ||
                (record.notes && record.notes.toLowerCase().includes(query)) ||
                (record.cost && record.cost.toLowerCase().includes(query)) ||
                (record.type && record.type.toLowerCase().includes(query));

            return matchesType && matchesSearch;
        });
    }, [records, selectedType, searchQuery]);

    // Calculate total cost spent
    const totalSpent = useMemo(() => {
        return records.reduce((sum, r) => {
            if (!r.cost) return sum;
            const numeric = parseFloat(r.cost.replace(/[^0-9.]/g, ""));
            return isNaN(numeric) ? sum : sum + numeric;
        }, 0);
    }, [records]);

    const filterOptions = ["ALL", "FULL SERVICE", "OIL CHANGE", "MAINTENANCE"];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDeleteConfirm}
                title="Purge Service Record?"
                message="This telemetry record will be permanently deleted from MongoDB Atlas and your cockpit statistics."
            />

            <ConfirmModal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                onConfirm={handleResetConfirm}
                title="PURGE ALL TELEMETRY LOGS?"
                message="WARNING: This will permanently wipe ALL recorded service history and telemetry metrics from MongoDB Atlas and local cache. This action cannot be reversed."
                confirmText="PURGE ALL LOGS"
            />

            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="p-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                            <HistoryIcon className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-[11px] font-mono tracking-widest text-cyan-400 font-semibold uppercase">
                            ARCHIVE // MAINTENANCE_DOSSIER
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-white flex items-center gap-3">
                        SERVICE <span className="text-cyan-400">HISTORY</span>
                    </h1>
                    <p className="text-xs font-mono text-gray-400 mt-0.5">
                        Historical telemetry and verified maintenance records
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsResetModalOpen(true)}
                        disabled={records.length === 0}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/25 shadow-[0_0_15px_rgba(244,63,94,0.12)] hover:bg-rose-500/20 hover:border-rose-500/50 hover:text-rose-300 disabled:opacity-40 disabled:pointer-events-none transition-all"
                        title="Reset all recorded service logs"
                    >
                        <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>RESET ALL LOGS</span>
                    </button>

                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold text-black bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] transition-all"
                    >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>LOG NEW ENTRY</span>
                    </button>
                </div>
            </header>

            {/* Telemetry Stats Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="cyber-card rounded-xl p-4 flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-[10px] font-mono text-gray-400 uppercase">TOTAL RECORDS</span>
                        <p className="font-mono text-2xl font-bold text-white">{records.length}</p>
                    </div>
                </div>

                <div className="cyber-card rounded-xl p-4 flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Coins className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-[10px] font-mono text-gray-400 uppercase">ESTIMATED EXPENDITURE</span>
                        <p className="font-mono text-2xl font-bold text-emerald-400">
                            Rs. {totalSpent.toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="cyber-card rounded-xl p-4 flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Gauge className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-[10px] font-mono text-gray-400 uppercase">LATEST MILEAGE</span>
                        <p className="font-mono text-2xl font-bold text-blue-400">
                            {records.length > 0 ? `${records[0].mileage.toLocaleString()} KM` : "0 KM"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter Bar & Search */}
            <div className="cyber-card rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search logs, parts, mileage..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs font-mono bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                </div>

                {/* Filter Chips */}
                <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                    {filterOptions.map((type) => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`px-3 py-1 text-[11px] font-mono font-semibold rounded-lg transition-all ${
                                selectedType === type
                                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,240,255,0.2)]"
                                    : "text-gray-400 hover:text-white bg-black/40 border border-white/5"
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Records List */}
            {filteredRecords.length === 0 ? (
                <div className="cyber-card rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
                        <FileText className="w-8 h-8" />
                    </div>
                    <p className="text-base font-mono font-bold text-white">NO TELEMETRY RECORDS FOUND</p>
                    <p className="text-xs font-mono text-gray-400 mt-1 max-w-sm">
                        {searchQuery || selectedType !== "ALL"
                            ? "No entries match your search or active filter."
                            : "Your maintenance archive is currently empty."}
                    </p>
                    <button
                        onClick={openAddModal}
                        className="mt-4 px-4 py-2 rounded-xl text-xs font-mono font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-colors"
                    >
                        LOG YOUR FIRST SERVICE
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredRecords.map((record) => (
                        <div
                            key={record.id}
                            className="cyber-card rounded-2xl p-5 relative overflow-hidden group flex flex-col justify-between"
                        >
                            <div className="cyber-corner-tl" />
                            <div className="cyber-corner-br" />

                            <div>
                                {/* Top Badges */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                                            {record.type || "Maintenance"}
                                        </span>
                                        <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {record.date}
                                        </span>
                                    </div>

                                    {record.cost && (
                                        <span className="font-mono text-sm font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">
                                            {record.cost}
                                        </span>
                                    )}
                                </div>

                                {/* Mileage Callout */}
                                <div className="flex items-baseline gap-2 mb-3">
                                    <span className="font-mono text-2xl font-bold text-white tracking-tight">
                                        {record.mileage.toLocaleString()}
                                    </span>
                                    <span className="text-xs font-mono text-cyan-400 font-semibold">KM ODOMETER</span>
                                </div>

                                {/* Replaced Components Tags */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {record.oilChange && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                            <Droplets className="w-3 h-3" />
                                            ENGINE OIL
                                        </span>
                                    )}
                                    {record.filterChange && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                            <Filter className="w-3 h-3" />
                                            OIL FILTER
                                        </span>
                                    )}
                                </div>

                                {/* Notes */}
                                {record.notes && (
                                    <p className="text-xs font-mono text-gray-300 bg-black/40 p-2.5 rounded-lg border border-white/5 line-clamp-2">
                                        {record.notes}
                                    </p>
                                )}
                            </div>

                            {/* Actions Bar */}
                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                                <span className="text-[10px] font-mono text-gray-500 uppercase">
                                    ID: {record.id.slice(-6)}
                                </span>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => router.push(`/edit-record/${record.id}`)}
                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/15 text-gray-400 hover:text-cyan-300 transition-colors border border-white/5"
                                        title="Edit Record"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteId(record.id)}
                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/15 text-gray-400 hover:text-rose-400 transition-colors border border-white/5"
                                        title="Delete Record"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
