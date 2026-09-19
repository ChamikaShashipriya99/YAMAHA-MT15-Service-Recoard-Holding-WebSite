"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle,
    AlertOctagon,
    ArrowRight,
    Bell,
    Clock,
    Flame,
    ChevronRight,
    ChevronLeft,
    Shield,
    FileText,
    Wind,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationMilestone, getComplianceMilestone } from "@/lib/complianceNotifier";

export interface UrgentAlert {
    type: "insurance" | "revenueLicense" | "emissionTest";
    title: string;
    expiryDate: string;
    daysRemaining: number;
    status: "EXPIRED" | "EXPIRING_SOON" | "VALID";
    milestone?: NotificationMilestone;
    stageNumber?: number;
}

interface ComplianceAlertBannerProps {
    alerts: UrgentAlert[];
    onRenewClick: () => void;
}

export default function ComplianceAlertBanner({ alerts, onRenewClick }: ComplianceAlertBannerProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    if (!alerts || alerts.length === 0) {
        return null;
    }

    // Sort alerts by urgency (most urgent first: expired -> 5 days -> 15 days -> 30 days)
    const sortedAlerts = [...alerts].sort((a, b) => a.daysRemaining - b.daysRemaining);
    const currentAlert = sortedAlerts[Math.min(activeIndex, sortedAlerts.length - 1)] || sortedAlerts[0];

    const milestone: NotificationMilestone =
        currentAlert.milestone || getComplianceMilestone(currentAlert.daysRemaining);

    // Determine visual style according to the 3-stage reminder specification
    let stageBadge = "RENEWAL REMINDER";
    let stageColorClasses = {
        banner: "bg-amber-950/40 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.2)]",
        glow: "bg-amber-500",
        iconBox: "bg-amber-500/20 border-amber-500/40 text-amber-400",
        badge: "bg-amber-500/25 border-amber-500/50 text-amber-200",
        titleHighlight: "text-amber-300",
        button: "bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]",
    };

    if (milestone === "EXPIRED") {
        stageBadge = "CRITICAL // COMPLIANCE EXPIRED";
        stageColorClasses = {
            banner: "bg-rose-950/50 border-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.35)]",
            glow: "bg-rose-500",
            iconBox: "bg-rose-500/25 border-rose-500/50 text-rose-400 animate-pulse",
            badge: "bg-rose-500/30 border-rose-500/60 text-rose-200",
            titleHighlight: "text-rose-400 font-bold",
            button: "bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_20px_rgba(244,63,94,0.5)]",
        };
    } else if (milestone === "5_DAYS") {
        stageBadge = "STAGE 3 // 5-DAY FINAL NOTICE";
        stageColorClasses = {
            banner: "bg-red-950/45 border-red-500/60 shadow-[0_0_25px_rgba(239,68,68,0.3)]",
            glow: "bg-red-500",
            iconBox: "bg-red-500/20 border-red-500/40 text-red-400 animate-pulse",
            badge: "bg-red-500/30 border-red-500/60 text-red-200",
            titleHighlight: "text-red-400 font-bold",
            button: "bg-red-500 hover:bg-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.45)]",
        };
    } else if (milestone === "15_DAYS") {
        stageBadge = "STAGE 2 // 15-DAY NOTICE";
        stageColorClasses = {
            banner: "bg-orange-950/40 border-orange-500/50 shadow-[0_0_25px_rgba(249,115,22,0.25)]",
            glow: "bg-orange-500",
            iconBox: "bg-orange-500/20 border-orange-500/40 text-orange-400",
            badge: "bg-orange-500/25 border-orange-500/50 text-orange-200",
            titleHighlight: "text-orange-300 font-semibold",
            button: "bg-orange-500 hover:bg-orange-400 text-black shadow-[0_0_15px_rgba(249,115,22,0.4)]",
        };
    } else if (milestone === "30_DAYS") {
        stageBadge = "STAGE 1 // 30-DAY NOTICE";
        stageColorClasses = {
            banner: "bg-amber-950/35 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.18)]",
            glow: "bg-amber-400",
            iconBox: "bg-amber-500/15 border-amber-500/30 text-amber-300",
            badge: "bg-amber-500/20 border-amber-500/40 text-amber-200",
            titleHighlight: "text-amber-200",
            button: "bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_12px_rgba(245,158,11,0.35)]",
        };
    }

    const getDocIcon = (type: string) => {
        switch (type) {
            case "insurance":
                return <Shield className="w-3.5 h-3.5" />;
            case "revenueLicense":
                return <FileText className="w-3.5 h-3.5" />;
            case "emissionTest":
                return <Wind className="w-3.5 h-3.5" />;
            default:
                return null;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
                "relative overflow-hidden rounded-2xl p-4 border transition-all shadow-lg",
                stageColorClasses.banner
            )}
        >
            {/* Ambient Pulse Glow */}
            <div
                className={cn(
                    "absolute -right-10 -top-10 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-35 animate-pulse",
                    stageColorClasses.glow
                )}
            />

            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                    <div className={cn("p-2.5 rounded-xl border shrink-0 mt-0.5", stageColorClasses.iconBox)}>
                        {milestone === "EXPIRED" ? (
                            <AlertOctagon className="w-5 h-5 animate-bounce" />
                        ) : milestone === "5_DAYS" ? (
                            <Flame className="w-5 h-5 animate-pulse text-red-400" />
                        ) : milestone === "15_DAYS" ? (
                            <Clock className="w-5 h-5 text-orange-400" />
                        ) : (
                            <Bell className="w-5 h-5 text-amber-400" />
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border",
                                    stageColorClasses.badge
                                )}
                            >
                                {stageBadge}
                            </span>

                            <span className="text-[11px] font-mono font-bold text-white flex items-center gap-1.5">
                                {getDocIcon(currentAlert.type)}
                                {currentAlert.title}
                            </span>

                            {sortedAlerts.length > 1 && (
                                <span className="text-[10px] font-mono text-gray-400 bg-black/40 px-2 py-0.5 rounded border border-white/10">
                                    {activeIndex + 1} of {sortedAlerts.length} notices
                                </span>
                            )}
                        </div>

                        <p className="text-xs font-mono text-gray-300 leading-relaxed">
                            {milestone === "EXPIRED" ? (
                                <span>
                                    <strong className={stageColorClasses.titleHighlight}>{currentAlert.title}</strong>{" "}
                                    expired on <span className="text-white underline">{currentAlert.expiryDate}</span>{" "}
                                    ({Math.abs(currentAlert.daysRemaining)} days ago). Operating the MT-15 carries severe legal penalties.
                                </span>
                            ) : milestone === "5_DAYS" ? (
                                <span>
                                    <strong className={stageColorClasses.titleHighlight}>{currentAlert.title}</strong>{" "}
                                    expires in <strong className="text-white underline">{currentAlert.daysRemaining} days</strong>{" "}
                                    (on {currentAlert.expiryDate}). Final warning window active; immediate renewal required.
                                </span>
                            ) : milestone === "15_DAYS" ? (
                                <span>
                                    <strong className={stageColorClasses.titleHighlight}>{currentAlert.title}</strong>{" "}
                                    expires in <strong className="text-white font-bold">{currentAlert.daysRemaining} days</strong>{" "}
                                    (on {currentAlert.expiryDate}). 15-day reminder window active.
                                </span>
                            ) : (
                                <span>
                                    <strong className={stageColorClasses.titleHighlight}>{currentAlert.title}</strong>{" "}
                                    renewal is approaching in <strong className="text-white font-bold">{currentAlert.daysRemaining} days</strong>{" "}
                                    (on {currentAlert.expiryDate}). 1-month advance notice active.
                                </span>
                            )}
                        </p>

                        {/* Multi-alert indicator pills if more than 1 document has an alert */}
                        {sortedAlerts.length > 1 && (
                            <div className="flex items-center gap-1.5 mt-1">
                                {sortedAlerts.map((alert, idx) => (
                                    <button
                                        key={alert.type}
                                        onClick={() => setActiveIndex(idx)}
                                        className={cn(
                                            "flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono transition-all border",
                                            idx === activeIndex
                                                ? "bg-white/20 border-white/40 text-white font-bold"
                                                : "bg-black/40 border-white/5 text-gray-400 hover:text-white"
                                        )}
                                    >
                                        <span>{alert.title.split(" ")[0]}</span>
                                        <span className="opacity-70 font-mono">
                                            ({alert.daysRemaining < 0 ? "EXP" : `${alert.daysRemaining}d`})
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {sortedAlerts.length > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setActiveIndex((prev) => (prev > 0 ? prev - 1 : sortedAlerts.length - 1))}
                                className="p-1.5 rounded-lg bg-black/40 border border-white/10 text-gray-400 hover:text-white transition-colors"
                                title="Previous Notice"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setActiveIndex((prev) => (prev < sortedAlerts.length - 1 ? prev + 1 : 0))}
                                className="p-1.5 rounded-lg bg-black/40 border border-white/10 text-gray-400 hover:text-white transition-colors"
                                title="Next Notice"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    <button
                        onClick={onRenewClick}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider transition-all shadow-md",
                            stageColorClasses.button
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

