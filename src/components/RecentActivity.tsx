"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Clock, ChevronRight, Activity, Wrench, Droplets, ArrowRight } from "lucide-react";
import { useServiceContext } from "@/context/ServiceContext";

export default function RecentActivity() {
    const { records, openAddModal } = useServiceContext();
    // Strictly show at most 5 records
    const recentRecords = records.slice(0, 5);

    const getTypeColor = (type?: string) => {
        if (type === "Full Service") return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
        if (type === "Oil Change") return "text-blue-400 bg-blue-500/10 border-blue-500/30";
        return "text-purple-400 bg-purple-500/10 border-purple-500/30";
    };

    return (
        <div className="cyber-card rounded-2xl p-5 h-full flex flex-col justify-between relative overflow-hidden">
            <div className="cyber-corner-tl" />
            <div className="cyber-corner-br" />

            {/* Header */}
            <div>
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/5">
                    <span className="text-xs font-mono tracking-widest text-cyan-400 font-bold uppercase flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        RECENT TELEMETRY LOGS
                    </span>
                    <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        MAX 5 LOGS
                    </span>
                </div>

                {/* List of up to 5 records */}
                <div className="space-y-2.5 overflow-y-auto max-h-[310px] pr-1">
                    {recentRecords.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 mb-3">
                                <Clock className="w-6 h-6" />
                            </div>
                            <p className="text-xs font-mono font-bold text-gray-300 uppercase">NO TELEMETRY RECORDED</p>
                            <p className="text-[10px] text-gray-500 font-mono mt-1">Log your first maintenance record</p>
                            <button
                                onClick={openAddModal}
                                className="mt-3 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-colors"
                            >
                                LOG SERVICE
                            </button>
                        </div>
                    ) : (
                        recentRecords.map((activity) => (
                            <div
                                key={activity.id}
                                className="group flex items-center justify-between p-2.5 rounded-xl bg-black/40 hover:bg-black/60 transition-all border border-white/5 hover:border-cyan-500/30"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:shadow-[0_0_10px_rgba(0,240,255,0.3)] transition-all">
                                        {activity.oilChange && activity.filterChange ? (
                                            <Wrench className="w-3.5 h-3.5" />
                                        ) : activity.oilChange ? (
                                            <Droplets className="w-3.5 h-3.5" />
                                        ) : (
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs font-mono font-semibold text-white group-hover:text-cyan-300 transition-colors">
                                            {activity.type || "Maintenance"}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-mono text-gray-400">{activity.date}</span>
                                            <span className="text-[10px] text-gray-600">•</span>
                                            <span className="text-[10px] font-mono text-cyan-400 font-medium">
                                                {activity.mileage.toLocaleString()} KM
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    {activity.cost ? (
                                        <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                            {activity.cost}
                                        </span>
                                    ) : (
                                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${getTypeColor(activity.type)}`}>
                                            LOGGED
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* View All Button leading to Service Logs (/history) */}
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-mono text-gray-500 uppercase">
                    {records.length > 0 ? `SHOWING ${recentRecords.length} OF ${records.length} RECORDS` : "ARCHIVE READY"}
                </span>

                <Link
                    href="/history"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider text-black bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500 shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <span>VIEW ALL SERVICE LOGS</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </Link>
            </div>
        </div>
    );
}
