"use client";

import React from "react";
import { Gauge, Wrench, ShieldCheck } from "lucide-react";
import { useServiceContext } from "@/context/ServiceContext";

export default function DashboardStats() {
    const { currentMileage, nextServiceMileage, serviceCount, lastServiceDate } = useServiceContext();

    // Mileage interval is 3,000 km
    const kmRemaining = Math.max(0, nextServiceMileage - currentMileage);
    const intervalProgress = Math.min(100, Math.max(0, ((3000 - kmRemaining) / 3000) * 100));
    const isDueSoon = kmRemaining <= 300;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Odometer Meter */}
            <div className="cyber-card rounded-2xl p-5 relative overflow-hidden group flex flex-col justify-between">
                <div className="cyber-corner-tl" />
                <div className="cyber-corner-br" />

                <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/10 blur-2xl rounded-full pointer-events-none group-hover:bg-cyan-500/20 transition-all" />

                <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[11px] font-mono tracking-wider text-cyan-400 font-bold flex items-center gap-1.5 uppercase whitespace-nowrap">
                            <Gauge className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                            ODOMETER // LIVE
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 whitespace-nowrap flex-shrink-0 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            ACTIVE
                        </span>
                    </div>

                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-[0_0_15px_rgba(0,240,255,0.35)]">
                            {currentMileage.toLocaleString()}
                        </span>
                        <span className="text-xs sm:text-sm font-mono text-cyan-400 font-semibold">KM</span>
                    </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-gray-400">
                    <span className="text-[11px] tracking-wider">LIFETIME DISTANCE</span>
                    <span className="text-cyan-400 font-medium">155cc VVA</span>
                </div>
            </div>

            {/* Next Service Target & Countdown */}
            <div className={`cyber-card rounded-2xl p-5 relative overflow-hidden group flex flex-col justify-between ${
                isDueSoon ? "border-rose-500/40 shadow-[0_0_20px_rgba(255,42,95,0.15)]" : ""
            }`}>
                <div className="cyber-corner-tl" />
                <div className="cyber-corner-br" />

                <div className={`absolute top-0 right-0 w-28 h-28 blur-2xl rounded-full pointer-events-none transition-all ${
                    isDueSoon ? "bg-rose-500/15" : "bg-blue-500/10 group-hover:bg-blue-500/20"
                }`} />

                <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={`text-[11px] font-mono tracking-wider font-bold flex items-center gap-1.5 uppercase whitespace-nowrap ${
                            isDueSoon ? "text-rose-400" : "text-blue-400"
                        }`}>
                            <Wrench className="w-3.5 h-3.5 flex-shrink-0" />
                            NEXT SERVICE // TARGET
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono border whitespace-nowrap flex-shrink-0 font-semibold ${
                            isDueSoon
                                ? "bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse"
                                : "bg-blue-500/10 text-blue-300 border-blue-500/20"
                        }`}>
                            {kmRemaining.toLocaleString()} KM LEFT
                        </span>
                    </div>

                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-white">
                            {nextServiceMileage.toLocaleString()}
                        </span>
                        <span className="text-xs sm:text-sm font-mono text-blue-400 font-semibold">KM</span>
                    </div>
                </div>

                {/* Interval Progress Bar */}
                <div className="mt-4 pt-2">
                    <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                        <div
                            className={`h-full transition-all duration-500 rounded-full ${
                                isDueSoon
                                    ? "bg-gradient-to-r from-amber-400 to-rose-500"
                                    : "bg-gradient-to-r from-cyan-400 to-blue-500"
                            }`}
                            style={{ width: `${intervalProgress}%` }}
                        />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 mt-1.5">
                        <span className="tracking-wider">CYCLE PROGRESS</span>
                        <span className="text-cyan-400 font-medium">{Math.round(intervalProgress)}%</span>
                    </div>
                </div>
            </div>

            {/* Service Logs & Health Status */}
            <div className="cyber-card rounded-2xl p-5 relative overflow-hidden group flex flex-col justify-between">
                <div className="cyber-corner-tl" />
                <div className="cyber-corner-br" />

                <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[11px] font-mono tracking-wider text-emerald-400 font-bold flex items-center gap-1.5 uppercase whitespace-nowrap">
                            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                            SYSTEM HEALTH
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 whitespace-nowrap flex-shrink-0 font-semibold">
                            OPTIMAL
                        </span>
                    </div>

                    <div className="flex items-baseline gap-2.5 mt-1">
                        <span className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-white">
                            {serviceCount}
                        </span>
                        <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                            {serviceCount === 1 ? "RECORD LOGGED" : "RECORDS LOGGED"}
                        </span>
                    </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-gray-400">
                    <span className="text-[11px] tracking-wider whitespace-nowrap">LAST SERVICE:</span>
                    <span className="text-white font-medium whitespace-nowrap">{lastServiceDate}</span>
                </div>
            </div>
        </div>
    );
}
