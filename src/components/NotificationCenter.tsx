"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bell,
    Shield,
    FileText,
    Wind,
    AlertTriangle,
    AlertOctagon,
    Clock,
    Flame,
    CheckCircle2,
    Volume2,
    X,
    ExternalLink,
    Smartphone,
    RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    evaluateAllComplianceNotices,
    ComplianceNotificationItem,
    getNotificationPermissionStatus,
    requestNotificationPermission,
    triggerTestPushNotification,
    dispatchCompliancePushAlerts,
} from "@/lib/complianceNotifier";

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [notices, setNotices] = useState<ComplianceNotificationItem[]>([]);
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | "unsupported">("default");
    const [isTestingPush, setIsTestingPush] = useState(false);
    const [testAlertMessage, setTestAlertMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const pathname = usePathname();

    const fetchNotices = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/compliance");
            if (!res.ok) return;
            const json = await res.json();
            if (json.success && json.data) {
                const evaluated = evaluateAllComplianceNotices(json.data);
                setNotices(evaluated);
                // Dispatch push notifications if permission is granted
                dispatchCompliancePushAlerts(json.data).catch((err) => {
                    console.warn("Push alert dispatch warning:", err);
                });
            }
        } catch (err) {
            console.warn("Failed to load compliance notices:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setPermissionStatus(getNotificationPermissionStatus());
        fetchNotices();

        const handleUpdate = () => fetchNotices();
        window.addEventListener("complianceUpdated", handleUpdate);

        // Click outside listener to close dropdown
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            window.removeEventListener("complianceUpdated", handleUpdate);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleEnablePush = async () => {
        const result = await requestNotificationPermission();
        setPermissionStatus(result);
        if (result === "granted") {
            setTestAlertMessage("Push alerts activated! You will receive milestone notifications.");
            setTimeout(() => setTestAlertMessage(null), 4000);
            fetchNotices();
        } else if (result === "denied") {
            setTestAlertMessage("Notifications were blocked in your browser settings.");
            setTimeout(() => setTestAlertMessage(null), 4000);
        }
    };

    const handleSendTestPush = async () => {
        setIsTestingPush(true);
        setTestAlertMessage(null);
        try {
            const success = await triggerTestPushNotification();
            setPermissionStatus(getNotificationPermissionStatus());
            if (success) {
                setTestAlertMessage("Test push notification dispatched to your device!");
            } else {
                setTestAlertMessage("Could not send push alert. Check browser notification permissions.");
            }
        } catch (err) {
            setTestAlertMessage("Failed to send test push notification.");
        } finally {
            setIsTestingPush(false);
            setTimeout(() => setTestAlertMessage(null), 4500);
        }
    };

    const handleDocumentAction = (type: string) => {
        setIsOpen(false);
        if (pathname !== "/") {
            router.push("/");
            // Allow navigation before triggering modal
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent("openComplianceModal", { detail: { type } }));
            }, 300);
        } else {
            window.dispatchEvent(new CustomEvent("openComplianceModal", { detail: { type } }));
        }
    };

    const getDocIcon = (type: string) => {
        switch (type) {
            case "insurance":
                return <Shield className="w-4 h-4 text-cyan-400" />;
            case "revenueLicense":
                return <FileText className="w-4 h-4 text-emerald-400" />;
            case "emissionTest":
                return <Wind className="w-4 h-4 text-amber-400" />;
            default:
                return <Bell className="w-4 h-4 text-cyan-400" />;
        }
    };

    // Determine highest severity
    const hasCritical = notices.some((n) => n.severity === "critical");
    const hasUrgent = notices.some((n) => n.severity === "urgent");
    const hasWarning = notices.some((n) => n.severity === "warning");

    const badgeColorClass = hasCritical
        ? "bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.7)] animate-bounce"
        : hasUrgent
        ? "bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.7)] animate-pulse"
        : hasWarning
        ? "bg-orange-500 text-black shadow-[0_0_8px_rgba(249,115,22,0.6)]"
        : "bg-amber-400 text-black shadow-[0_0_8px_rgba(245,158,11,0.5)]";

    return (
        <div className="relative" ref={popoverRef}>
            {/* Bell Trigger Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Compliance Notifications"
                title="Vehicle Compliance & Legal Alerts"
                className={cn(
                    "relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all",
                    isOpen
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                        : notices.length > 0
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                        : "bg-cyan-500/10 border-cyan-500/20 text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/15"
                )}
            >
                <Bell className="w-4 h-4 stroke-[2.2]" />

                {/* Animated Notification Badge Counter */}
                {notices.length > 0 && (
                    <span
                        className={cn(
                            "absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-mono font-bold flex items-center justify-center transition-all",
                            badgeColorClass
                        )}
                    >
                        {notices.length}
                    </span>
                )}
            </motion.button>

            {/* Notification Popover Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="absolute right-0 mt-3 w-[340px] sm:w-[410px] rounded-2xl bg-[#080d19]/95 backdrop-blur-2xl border border-cyan-500/30 shadow-[0_15px_45px_rgba(0,0,0,0.9),0_0_25px_rgba(0,240,255,0.15)] overflow-hidden z-[100] flex flex-col text-left"
                    >
                        {/* Popover Header */}
                        <div className="flex items-center justify-between p-3.5 border-b border-white/10 bg-black/40">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                                    <Bell className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-mono font-bold tracking-wider text-white uppercase">
                                        COMPLIANCE NOTIFIER
                                    </span>
                                    <span className="text-[9px] font-mono text-gray-400">
                                        3-Stage Automated Milestones (30d // 15d // 5d)
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={fetchNotices}
                                    title="Refresh Notices"
                                    className="p-1 rounded-lg text-gray-400 hover:text-cyan-300 hover:bg-white/5 transition-colors"
                                >
                                    <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Push Notification Controls & Status */}
                        <div className="px-3.5 py-2.5 bg-black/60 border-b border-white/5 flex items-center justify-between gap-3 text-[10px] font-mono">
                            <div className="flex items-center gap-2">
                                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="text-gray-300">
                                    {permissionStatus === "granted" ? (
                                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                            Push Alerts Active
                                        </span>
                                    ) : permissionStatus === "denied" ? (
                                        <span className="text-rose-400 font-semibold">Push Blocked in Browser</span>
                                    ) : (
                                        <span className="text-amber-300">Push Permissions Inactive</span>
                                    )}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                {permissionStatus !== "granted" ? (
                                    <button
                                        onClick={handleEnablePush}
                                        className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold tracking-wider transition-all shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                                    >
                                        ENABLE PUSH
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSendTestPush}
                                        disabled={isTestingPush}
                                        className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 border border-cyan-500/30 transition-all disabled:opacity-50"
                                    >
                                        {isTestingPush ? "SENDING..." : "TEST ALERT"}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Test Alert Feedback Message */}
                        {testAlertMessage && (
                            <div className="px-3.5 py-1.5 bg-cyan-950/60 border-b border-cyan-500/30 text-[10px] font-mono text-cyan-200 flex items-center gap-1.5 animate-fadeIn">
                                <Volume2 className="w-3 h-3 text-cyan-400 shrink-0" />
                                <span>{testAlertMessage}</span>
                            </div>
                        )}

                        {/* Notification Items List */}
                        <div className="max-h-[360px] overflow-y-auto p-3 flex flex-col gap-2.5 custom-scrollbar">
                            {notices.length === 0 ? (
                                <div className="py-6 px-4 flex flex-col items-center text-center gap-2 text-gray-400">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-mono font-bold text-white tracking-wider">
                                        ALL COMPLIANCE NOMINAL
                                    </span>
                                    <p className="text-[10px] font-mono text-gray-400 max-w-xs leading-relaxed">
                                        Insurance, Revenue License, and Emission Test are fully valid (&gt; 30 days remaining).
                                        Automated reminders will notify you 30, 15, and 5 days prior to expiration.
                                    </p>
                                    {permissionStatus === "granted" && (
                                        <button
                                            onClick={handleSendTestPush}
                                            disabled={isTestingPush}
                                            className="mt-2 px-3 py-1.5 rounded-xl text-[10px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all"
                                        >
                                            {isTestingPush ? "Testing..." : "Send Test Push Alert"}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                notices.map((item) => {
                                    const isCritical = item.severity === "critical";
                                    const isUrgent = item.severity === "urgent";
                                    const isWarning = item.severity === "warning";

                                    return (
                                        <div
                                            key={item.id}
                                            className={cn(
                                                "p-3 rounded-xl border transition-all flex flex-col gap-2 relative overflow-hidden",
                                                isCritical
                                                    ? "bg-rose-950/40 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                                                    : isUrgent
                                                    ? "bg-red-950/35 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                                                    : isWarning
                                                    ? "bg-orange-950/30 border-orange-500/40"
                                                    : "bg-amber-950/25 border-amber-500/35"
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 rounded-lg bg-black/40 border border-white/10 shrink-0">
                                                        {getDocIcon(item.type)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-mono font-bold text-white tracking-wide">
                                                            {item.title}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-gray-400">
                                                            Due: <strong className="text-white">{item.expiryDate}</strong>
                                                        </span>
                                                    </div>
                                                </div>

                                                <span
                                                    className={cn(
                                                        "px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border shrink-0",
                                                        isCritical
                                                            ? "bg-rose-500/25 border-rose-500/60 text-rose-200"
                                                            : isUrgent
                                                            ? "bg-red-500/25 border-red-500/60 text-red-200"
                                                            : isWarning
                                                            ? "bg-orange-500/25 border-orange-500/50 text-orange-200"
                                                            : "bg-amber-500/20 border-amber-500/40 text-amber-200"
                                                    )}
                                                >
                                                    {item.stageLabel}
                                                </span>
                                            </div>

                                            <p className="text-[11px] font-mono text-gray-300 leading-relaxed">
                                                {item.message}
                                            </p>

                                            <div className="flex items-center justify-between pt-1 border-t border-white/5">
                                                <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400">
                                                    {isCritical ? (
                                                        <span className="text-rose-400 font-bold flex items-center gap-1">
                                                            <AlertOctagon className="w-3 h-3" />
                                                            Expired {Math.abs(item.daysRemaining)}d ago
                                                        </span>
                                                    ) : isUrgent ? (
                                                        <span className="text-red-400 font-bold flex items-center gap-1">
                                                            <Flame className="w-3 h-3 animate-pulse" />
                                                            {item.daysRemaining} Days Remaining
                                                        </span>
                                                    ) : isWarning ? (
                                                        <span className="text-orange-300 font-semibold flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {item.daysRemaining} Days Remaining
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-300 flex items-center gap-1">
                                                            <Bell className="w-3 h-3" />
                                                            {item.daysRemaining} Days Remaining
                                                        </span>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => handleDocumentAction(item.type)}
                                                    className={cn(
                                                        "flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider transition-all",
                                                        isCritical
                                                            ? "bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)]"
                                                            : isUrgent
                                                            ? "bg-red-500 hover:bg-red-400 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                                                            : "bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                                    )}
                                                >
                                                    <span>UPDATE & RENEW</span>
                                                    <ExternalLink className="w-3 h-3 stroke-[2.5]" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Popover Footer Info */}
                        <div className="p-2.5 bg-black/60 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-gray-500">
                            <span>Stage 1: 30d // Stage 2: 15d // Stage 3: 5d</span>
                            <span className="text-cyan-400">Dark Side of Japan</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
