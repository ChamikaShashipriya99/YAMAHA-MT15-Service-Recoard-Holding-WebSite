"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, AlertOctagon, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface UrgentAlert {
    type: "insurance" | "revenueLicense" | "emissionTest";
    title: string;
    expiryDate: string;
    daysRemaining: number;
    status: "EXPIRED" | "EXPIRING_SOON" | "VALID";
}

interface ComplianceAlertBannerProps {
    alerts: UrgentAlert[];
    onRenewClick: () => void;
}

export default function ComplianceAlertBanner({ alerts, onRenewClick }: ComplianceAlertBannerProps) {
    if (!alerts || alerts.length === 0) {
        return null;
    }

    const hasExpired = alerts.some((a) => a.status === "EXPIRED");
    const primaryAlert = alerts[0];

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
                "relative overflow-hidden rounded-2xl p-4 border transition-all shadow-lg",
                hasExpired
                    ? "bg-rose-950/40 border-rose-500/50 shadow-[0_0_25px_rgba(244,63,94,0.25)]"
                    : "bg-amber-950/40 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.2)]"
            )}
        >
            {/* Background Glow Pulse */}
            <div
                className={cn(
                    "absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-30 animate-pulse",
                    hasExpired ? "bg-rose-500" : "bg-amber-500"
                )}
            />

            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div
                        className={cn(
                            "p-2 rounded-xl border shrink-0 mt-0.5",
                            hasExpired
                                ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                                : "bg-amber-500/20 border-amber-500/40 text-amber-400"
                        )}
                    >
                        {hasExpired ? (
                            <AlertOctagon className="w-5 h-5 animate-bounce" />
                        ) : (
                            <AlertTriangle className="w-5 h-5" />
                        )}
                    </div>

                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border",
                                    hasExpired
                                        ? "bg-rose-500/25 border-rose-500/50 text-rose-200"
                                        : "bg-amber-500/25 border-amber-500/50 text-amber-200"
                                )}
                            >
                                {hasExpired ? "CRITICAL: COMPLIANCE EXPIRED" : "RENEWAL DUE SOON"}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-white">
                                {alerts.length > 1
                                    ? `${alerts.length} Legal Documents Require Immediate Attention`
                                    : `${primaryAlert.title} Expiration Alert`}
                            </span>
                        </div>

                        <p className="text-xs font-mono text-gray-300">
                            {hasExpired ? (
                                <span>
                                    <strong className="text-rose-400 font-bold">{primaryAlert.title}</strong> has expired on{" "}
                                    <span className="text-white underline">{primaryAlert.expiryDate}</span>. Riding with expired documents carries severe legal penalties.
                                </span>
                            ) : (
                                <span>
                                    <strong className="text-amber-300">{primaryAlert.title}</strong> expires in{" "}
                                    <strong className="text-white">{primaryAlert.daysRemaining} days</strong> (on{" "}
                                    {primaryAlert.expiryDate}).
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <button
                        onClick={onRenewClick}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider transition-all shadow-md",
                            hasExpired
                                ? "bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                                : "bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                        )}
                    >
                        <span>UPDATE & RENEW</span>
                        <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
