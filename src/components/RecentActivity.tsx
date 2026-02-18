"use client";

import React from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { useServiceContext } from "@/context/ServiceContext";

export default function RecentActivity() {
    const { records } = useServiceContext();

    // Show only top 5 recent records
    const recentRecords = records.slice(0, 5);

    return (
        <div className="glass rounded-3xl p-6 h-full flex flex-col">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                Recent Activity
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {recentRecords.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No recent activity</p>
                ) : (
                    recentRecords.map((activity) => (
                        <div
                            key={activity.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-green-500/20 text-green-400">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">{activity.type}</p>
                                    <p className="text-xs text-gray-500">{activity.date}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-gray-400 bg-black/30 px-2 py-1 rounded-full">
                                    Completed
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
