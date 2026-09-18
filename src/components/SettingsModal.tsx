"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Settings as SettingsIcon,
    Database,
    Shield,
    KeyRound,
    Smartphone,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Copy,
    Check,
    Eye,
    EyeOff,
    Activity,
    Lock,
    Server,
    Cpu,
    ShieldAlert,
    Terminal,
    Download,
    UploadCloud,
    Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ImportBackupModal from "@/components/ImportBackupModal";
import { useCockpitTheme } from "@/context/ThemeContext";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type TabType = "database" | "credentials" | "2fa" | "audit" | "themes";

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>("database");
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const { theme, setTheme, themeConfig, availableThemes } = useCockpitTheme();

    // --- Tab 1: Database Status State ---
    const [dbStatus, setDbStatus] = useState<{
        connected: boolean;
        status: string;
        latencyMs?: number;
        databaseName?: string;
        host?: string;
        totalRecords?: number;
        nodeVersion?: string;
        serverUptimeSeconds?: number;
    } | null>(null);
    const [isPinging, setIsPinging] = useState(false);

    const pingDatabase = async () => {
        setIsPinging(true);
        try {
            const res = await fetch("/api/settings/status");
            const data = await res.json();
            setDbStatus(data);
        } catch {
            setDbStatus({ connected: false, status: "OFFLINE / ERROR" });
        } finally {
            setIsPinging(false);
        }
    };

    // --- Tab 2: Password Change State ---
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPasswords, setShowPasswords] = useState(false);
    const [pwLoading, setPwLoading] = useState(false);
    const [pwMessage, setPwMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwMessage(null);

        if (newPassword !== confirmPassword) {
            setPwMessage({ type: "error", text: "New passwords do not match" });
            return;
        }

        if (newPassword.length < 6) {
            setPwMessage({ type: "error", text: "New password must be at least 6 characters" });
            return;
        }

        setPwLoading(true);
        try {
            const res = await fetch("/api/settings/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to update password");
            }
            setPwMessage({ type: "success", text: "Password updated successfully!" });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            setPwMessage({ type: "error", text: err.message || "Failed to update password" });
        } finally {
            setPwLoading(false);
        }
    };

    // --- Tab 3: 2FA Regeneration State ---
    const [tfaStep, setTfaStep] = useState<"idle" | "pairing">("idle");
    const [newTfaData, setNewTfaData] = useState<{ newSecret: string; qrCodeDataUrl: string } | null>(null);
    const [tfaPassword, setTfaPassword] = useState("");
    const [tfaCode, setTfaCode] = useState("");
    const [tfaLoading, setTfaLoading] = useState(false);
    const [tfaCopied, setTfaCopied] = useState(false);
    const [tfaMessage, setTfaMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleStart2FARegeneration = async () => {
        setTfaLoading(true);
        setTfaMessage(null);
        try {
            const res = await fetch("/api/settings/2fa");
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to generate 2FA secret");
            }
            setNewTfaData(data);
            setTfaStep("pairing");
        } catch (err: any) {
            setTfaMessage({ type: "error", text: err.message || "Failed to generate 2FA" });
        } finally {
            setTfaLoading(false);
        }
    };

    const handleCommit2FA = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTfaData?.newSecret || !tfaPassword || !tfaCode) {
            setTfaMessage({ type: "error", text: "Please enter password and 6-digit authenticator code" });
            return;
        }

        setTfaLoading(true);
        setTfaMessage(null);
        try {
            const res = await fetch("/api/settings/2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: tfaPassword,
                    newSecret: newTfaData.newSecret,
                    confirmationCode: tfaCode,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to commit 2FA");
            }
            setTfaMessage({ type: "success", text: "Google Authenticator re-paired and saved!" });
            if (data.recoveryCodes && Array.isArray(data.recoveryCodes)) {
                setGeneratedRecoveryCodes(data.recoveryCodes);
            }
            setTfaStep("idle");
            setNewTfaData(null);
            setTfaPassword("");
            setTfaCode("");
        } catch (err: any) {
            setTfaMessage({ type: "error", text: err.message || "Failed to commit 2FA" });
        } finally {
            setTfaLoading(false);
        }
    };

    const copySecret = () => {
        if (newTfaData?.newSecret) {
            navigator.clipboard.writeText(newTfaData.newSecret);
            setTfaCopied(true);
            setTimeout(() => setTfaCopied(false), 2000);
        }
    };

    // --- Tab 4: Audit & Threat Telemetry State ---
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [isLoadingAudit, setIsLoadingAudit] = useState(false);
    const [generatedRecoveryCodes, setGeneratedRecoveryCodes] = useState<string[]>([]);
    const [recoveryCopied, setRecoveryCopied] = useState(false);

    const fetchAuditLogs = async () => {
        setIsLoadingAudit(true);
        try {
            const res = await fetch("/api/settings/audit-logs");
            const data = await res.json();
            if (data.success) {
                setAuditLogs(data.data || []);
            }
        } catch {
            // fail-safe
        } finally {
            setIsLoadingAudit(false);
        }
    };

    const copyRecoveryCodes = () => {
        if (generatedRecoveryCodes.length > 0) {
            navigator.clipboard.writeText(generatedRecoveryCodes.join("\n"));
            setRecoveryCopied(true);
            setTimeout(() => setRecoveryCopied(false), 2000);
        }
    };

    const downloadRecoveryCodes = () => {
        if (generatedRecoveryCodes.length === 0) return;
        const text = `=====================================================
YAMAHA MT-15 // EMERGENCY 2FA BACKUP RECOVERY CODES
Date: ${new Date().toISOString()}
User: Chamikaz99
Keep these single-use codes secure and offline.
=====================================================\n\n` +
            generatedRecoveryCodes.map((c, i) => `[${i + 1}] ${c}`).join("\n");
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `yamaha_mt15_emergency_recovery_codes_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Auto-ping when opening modal on database tab or audit tab
    useEffect(() => {
        if (isOpen) {
            if (activeTab === "database") {
                pingDatabase();
            } else if (activeTab === "audit") {
                fetchAuditLogs();
            }
        }
    }, [isOpen, activeTab]);

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div key="settings-modal-container" className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/85 backdrop-blur-md"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 15 }}
                        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#070b14] shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_30px_rgba(0,240,255,0.15)] flex flex-col max-h-[90vh]"
                    >
                        {/* Corner Accents */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400 rounded-tl-xl" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400 rounded-br-xl" />

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/40">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
                                    <SettingsIcon className="w-5 h-5 animate-spin-slow" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-mono font-bold text-white tracking-wider">
                                            COCKPIT SETTINGS
                                        </h2>
                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                    </div>
                                    <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">
                                        SYSTEM DIAGNOSTICS & CREDENTIALS
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex border-b border-white/5 px-6 bg-black/20 gap-2 overflow-x-auto">
                            <button
                                onClick={() => setActiveTab("database")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 text-xs font-mono font-semibold transition-all border-b-2 whitespace-nowrap",
                                    activeTab === "database"
                                        ? "border-cyan-400 text-cyan-300 bg-cyan-500/10"
                                        : "border-transparent text-gray-400 hover:text-white"
                                )}
                            >
                                <Database className="w-4 h-4" />
                                <span>DATABASE HEALTH</span>
                            </button>

                            <button
                                onClick={() => setActiveTab("credentials")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 text-xs font-mono font-semibold transition-all border-b-2 whitespace-nowrap",
                                    activeTab === "credentials"
                                        ? "border-cyan-400 text-cyan-300 bg-cyan-500/10"
                                        : "border-transparent text-gray-400 hover:text-white"
                                )}
                            >
                                <KeyRound className="w-4 h-4" />
                                <span>CHANGE PASSWORD</span>
                            </button>

                            <button
                                onClick={() => setActiveTab("2fa")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 text-xs font-mono font-semibold transition-all border-b-2 whitespace-nowrap",
                                    activeTab === "2fa"
                                        ? "border-cyan-400 text-cyan-300 bg-cyan-500/10"
                                        : "border-transparent text-gray-400 hover:text-white"
                                )}
                            >
                                <Smartphone className="w-4 h-4" />
                                <span>2FA AUTHENTICATOR</span>
                            </button>

                            <button
                                onClick={() => setActiveTab("audit")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 text-xs font-mono font-semibold transition-all border-b-2 whitespace-nowrap",
                                    activeTab === "audit"
                                        ? "border-cyan-400 text-cyan-300 bg-cyan-500/10"
                                        : "border-transparent text-gray-400 hover:text-white"
                                )}
                            >
                                <ShieldAlert className="w-4 h-4" />
                                <span>THREAT TELEMETRY</span>
                            </button>

                            <button
                                onClick={() => setActiveTab("themes")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 text-xs font-mono font-semibold transition-all border-b-2 whitespace-nowrap",
                                    activeTab === "themes"
                                        ? "border-cyan-400 text-cyan-300 bg-cyan-500/10"
                                        : "border-transparent text-gray-400 hover:text-white"
                                )}
                            >
                                <Palette className="w-4 h-4" />
                                <span>FACTORY THEMES</span>
                            </button>
                        </div>

                        {/* Tab Contents */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {/* TAB 1: DATABASE STATUS */}
                            {activeTab === "database" && (
                                <div className="flex flex-col gap-5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
                                            LIVE ATLAS TELEMETRY PING
                                        </span>
                                        <button
                                            onClick={pingDatabase}
                                            disabled={isPinging}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 disabled:opacity-50 transition-all"
                                        >
                                            <RefreshCw className={cn("w-3.5 h-3.5", isPinging && "animate-spin")} />
                                            <span>TEST PING</span>
                                        </button>
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {/* Status */}
                                        <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col justify-between">
                                            <span className="text-[10px] font-mono text-gray-400 uppercase">CLUSTER STATUS</span>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span
                                                    className={cn(
                                                        "w-2.5 h-2.5 rounded-full",
                                                        dbStatus?.connected
                                                            ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                                                            : "bg-rose-500"
                                                    )}
                                                />
                                                <span className="font-mono text-base font-bold text-white uppercase">
                                                    {dbStatus?.status || "CHECKING..."}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Latency */}
                                        <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col justify-between">
                                            <span className="text-[10px] font-mono text-gray-400 uppercase">ROUNDTRIP PING</span>
                                            <div className="flex items-baseline gap-1 mt-2">
                                                <span
                                                    className={cn(
                                                        "font-mono text-2xl font-bold",
                                                        (dbStatus?.latencyMs || 0) < 150
                                                            ? "text-emerald-400"
                                                            : (dbStatus?.latencyMs || 0) < 300
                                                            ? "text-amber-400"
                                                            : "text-rose-400"
                                                    )}
                                                >
                                                    {dbStatus?.latencyMs !== undefined ? `${dbStatus.latencyMs}` : "—"}
                                                </span>
                                                <span className="text-xs font-mono text-gray-400">ms</span>
                                            </div>
                                        </div>

                                        {/* Total Documents */}
                                        <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col justify-between">
                                            <span className="text-[10px] font-mono text-gray-400 uppercase">TOTAL LOGS STORED</span>
                                            <div className="font-mono text-2xl font-bold text-cyan-400 mt-2">
                                                {dbStatus?.totalRecords ?? "—"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Telemetry Box */}
                                    <div className="p-4 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-gray-300 flex flex-col gap-2">
                                        <div className="flex justify-between py-1 border-b border-white/5">
                                            <span className="text-gray-400">Database Name:</span>
                                            <span className="text-white font-semibold">{dbStatus?.databaseName || "yamaha_mt15"}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-white/5">
                                            <span className="text-gray-400">Cluster Host:</span>
                                            <span className="text-white">{dbStatus?.host || "MongoDB Atlas Cloud"}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-white/5">
                                            <span className="text-gray-400">Node Engine:</span>
                                            <span className="text-white">{dbStatus?.nodeVersion || "Node.js"}</span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span className="text-gray-400">Process Uptime:</span>
                                            <span className="text-white">
                                                {dbStatus?.serverUptimeSeconds ? `${Math.floor(dbStatus.serverUptimeSeconds / 60)} minutes` : "Active"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Disaster Recovery / Restore JSON Archive */}
                                    <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-black/40 to-black/40 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-bold">
                                                <UploadCloud className="w-4 h-4 text-amber-400" />
                                                <span>DISASTER RECOVERY // RESTORE ARCHIVE</span>
                                            </div>
                                            <p className="text-[11px] font-mono text-gray-400 mt-0.5">
                                                Restore telemetry records from an encrypted `.json` backup file.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setIsImportModalOpen(true)}
                                            className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-black bg-amber-400 hover:bg-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center gap-1.5 transition-all shrink-0"
                                        >
                                            <UploadCloud className="w-3.5 h-3.5 stroke-[2.5]" />
                                            <span>RESTORE JSON BACKUP</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: CHANGE PASSWORD */}
                            {activeTab === "credentials" && (
                                <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
                                    <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
                                        UPDATE ACCESS CREDENTIALS
                                    </span>

                                    {pwMessage && (
                                        <div
                                            className={cn(
                                                "p-3 rounded-xl border text-xs font-mono flex items-center gap-2.5",
                                                pwMessage.type === "success"
                                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                                            )}
                                        >
                                            {pwMessage.type === "success" ? (
                                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                            ) : (
                                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                            )}
                                            <span>{pwMessage.text}</span>
                                        </div>
                                    )}

                                    {/* Current Password */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-mono text-gray-300">CURRENT PASSWORD</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords ? "text" : "password"}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                required
                                                placeholder="Enter current password"
                                                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-sm focus:border-cyan-400 focus:outline-none transition-colors"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords(!showPasswords)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                            >
                                                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* New Password */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-mono text-gray-300">NEW PASSWORD</label>
                                        <input
                                            type={showPasswords ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            placeholder="Enter new password (min 6 chars)"
                                            className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-sm focus:border-cyan-400 focus:outline-none transition-colors"
                                        />
                                    </div>

                                    {/* Confirm New Password */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-mono text-gray-300">CONFIRM NEW PASSWORD</label>
                                        <input
                                            type={showPasswords ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            placeholder="Re-enter new password"
                                            className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-sm focus:border-cyan-400 focus:outline-none transition-colors"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={pwLoading}
                                        className="mt-2 w-full py-3 rounded-xl text-xs font-mono font-bold tracking-wider text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all disabled:opacity-50"
                                    >
                                        {pwLoading ? "COMMITTING CHANGES..." : "UPDATE COCKPIT PASSWORD"}
                                    </button>
                                </form>
                            )}

                            {/* TAB 3: 2FA REGENERATION */}
                            {activeTab === "2fa" && (
                                <div className="flex flex-col gap-5">
                                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                                        <div>
                                            <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
                                                GOOGLE AUTHENTICATOR (TOTP)
                                            </span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                <span className="text-xs font-mono text-gray-300 font-semibold">
                                                    STATUS: ACTIVE & PROTECTED
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {tfaMessage && (
                                        <div
                                            className={cn(
                                                "p-3 rounded-xl border text-xs font-mono flex items-center gap-2.5",
                                                tfaMessage.type === "success"
                                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                                            )}
                                        >
                                            {tfaMessage.type === "success" ? (
                                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                            ) : (
                                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                            )}
                                            <span>{tfaMessage.text}</span>
                                        </div>
                                    )}

                                    {tfaStep === "idle" ? (
                                        <div className="flex flex-col gap-4">
                                            <p className="text-xs font-mono text-gray-400 leading-relaxed">
                                                If you got a new phone or lost access to your Google Authenticator app, you can generate a fresh pairing key and re-link your device.
                                            </p>

                                            <button
                                                onClick={handleStart2FARegeneration}
                                                disabled={tfaLoading}
                                                className="w-full py-3 rounded-xl text-xs font-mono font-bold tracking-wider text-white bg-rose-500/20 border border-rose-500/40 hover:bg-rose-500/30 hover:border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.2)] transition-all"
                                            >
                                                {tfaLoading ? "GENERATING NEW SECRET..." : "REGENERATE & PAIR NEW 2FA SECRET"}
                                            </button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleCommit2FA} className="flex flex-col gap-4">
                                            <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/30 flex flex-col sm:flex-row items-center gap-4">
                                                {newTfaData?.qrCodeDataUrl && (
                                                    <div className="p-2 bg-white rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                                                        <Image
                                                            src={newTfaData.qrCodeDataUrl}
                                                            alt="New 2FA QR Code"
                                                            width={140}
                                                            height={140}
                                                            className="rounded"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex-1 flex flex-col gap-2">
                                                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                                                        SCAN IN GOOGLE AUTHENTICATOR
                                                    </span>
                                                    <p className="text-[11px] font-mono text-gray-400">
                                                        Tap + in Google Authenticator and scan this code, or copy key:
                                                    </p>
                                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-black/80 border border-white/10 font-mono text-xs text-white">
                                                        <span className="truncate flex-1">{newTfaData?.newSecret}</span>
                                                        <button
                                                            type="button"
                                                            onClick={copySecret}
                                                            className="p-1 text-gray-400 hover:text-cyan-400"
                                                        >
                                                            {tfaCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Verify and commit inputs */}
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-mono text-gray-300">CURRENT PASSWORD (TO AUTHORIZE)</label>
                                                <input
                                                    type="password"
                                                    value={tfaPassword}
                                                    onChange={(e) => setTfaPassword(e.target.value)}
                                                    required
                                                    placeholder="Enter your current password"
                                                    className="w-full px-4 py-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-sm focus:border-cyan-400 focus:outline-none"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-mono text-gray-300">NEW 6-DIGIT CODE (FROM APP)</label>
                                                <input
                                                    type="text"
                                                    maxLength={6}
                                                    value={tfaCode}
                                                    onChange={(e) => setTfaCode(e.target.value)}
                                                    required
                                                    placeholder="000000"
                                                    className="w-full px-4 py-2 rounded-xl bg-black/60 border border-white/10 text-cyan-300 font-mono text-center tracking-widest text-lg font-bold focus:border-cyan-400 focus:outline-none"
                                                />
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setTfaStep("idle")}
                                                    className="flex-1 py-2.5 rounded-xl text-xs font-mono text-gray-400 hover:text-white bg-white/5 border border-white/10 transition-colors"
                                                >
                                                    CANCEL
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={tfaLoading}
                                                    className="flex-1 py-2.5 rounded-xl text-xs font-mono font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-all disabled:opacity-50"
                                                >
                                                    {tfaLoading ? "VERIFYING..." : "CONFIRM & COMMIT 2FA"}
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {/* Generated Recovery Codes Display */}
                                    {generatedRecoveryCodes.length > 0 && (
                                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-bold">
                                                    <Shield className="w-4 h-4 text-amber-400" />
                                                    <span>EMERGENCY 2FA RECOVERY CODES (SAVE NOW)</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={copyRecoveryCodes}
                                                        className="px-2.5 py-1 rounded-lg text-[10px] font-mono text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 flex items-center gap-1 transition-colors"
                                                    >
                                                        {recoveryCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                                        <span>{recoveryCopied ? "COPIED" : "COPY ALL"}</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={downloadRecoveryCodes}
                                                        className="px-2.5 py-1 rounded-lg text-[10px] font-mono text-black font-bold bg-amber-400 hover:bg-amber-300 flex items-center gap-1 transition-colors"
                                                    >
                                                        <Download className="w-3 h-3" />
                                                        <span>DOWNLOAD .TXT</span>
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-[11px] font-mono text-gray-300">
                                                If you ever lose access to your phone or Google Authenticator, each code below can be used exactly once to bypass 2FA at login:
                                            </p>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                {generatedRecoveryCodes.map((code, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="px-2.5 py-1.5 rounded-lg bg-black/80 border border-amber-500/30 font-mono text-xs font-bold text-amber-300 text-center tracking-wider"
                                                    >
                                                        {code}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 4: THREAT TELEMETRY & AUDIT LOGS */}
                            {activeTab === "audit" && (
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-semibold flex items-center gap-1.5">
                                                <Terminal className="w-3.5 h-3.5" />
                                                <span>SECURITY AUDIT TIMELINE // LAST 50 EVENTS</span>
                                            </span>
                                            <p className="text-[11px] font-mono text-gray-400 mt-0.5">
                                                Persistent SIEM-ready security log with automated 90-day retention.
                                            </p>
                                        </div>
                                        <button
                                            onClick={fetchAuditLogs}
                                            disabled={isLoadingAudit}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 disabled:opacity-50 transition-all"
                                        >
                                            <RefreshCw className={cn("w-3.5 h-3.5", isLoadingAudit && "animate-spin")} />
                                            <span>REFRESH</span>
                                        </button>
                                    </div>

                                    {isLoadingAudit && auditLogs.length === 0 ? (
                                        <div className="py-12 text-center text-xs font-mono text-cyan-400/80 animate-pulse">
                                            QUERYING SECURITY AUDIT LOGS...
                                        </div>
                                    ) : auditLogs.length === 0 ? (
                                        <div className="py-12 text-center text-xs font-mono text-gray-500 border border-white/5 rounded-xl bg-black/40">
                                            No security events logged yet.
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                                            {auditLogs.map((log, index) => {
                                                const isCritical = log.status === "CRITICAL";
                                                const isWarning = log.status === "WARNING";
                                                const badgeBg = isCritical
                                                    ? "bg-rose-500/15 border-rose-500/30 text-rose-300"
                                                    : isWarning
                                                    ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                                                    : "bg-cyan-500/15 border-cyan-500/30 text-cyan-300";

                                                return (
                                                    <div
                                                        key={log._id || index}
                                                        className="p-3 rounded-xl bg-black/50 border border-white/5 hover:border-white/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                                    >
                                                        <div className="flex flex-col gap-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className={cn("px-2 py-0.5 rounded font-mono text-[10px] font-bold border", badgeBg)}>
                                                                    {log.eventType}
                                                                </span>
                                                                <span className="text-[10px] font-mono text-gray-400">
                                                                    IP: <span className="text-gray-200">{log.clientIp}</span>
                                                                </span>
                                                                {log.status && (
                                                                    <span className={cn(
                                                                        "text-[9px] font-mono uppercase px-1.5 py-0.2 rounded",
                                                                        isCritical ? "text-rose-400" : isWarning ? "text-amber-400" : "text-emerald-400"
                                                                    )}>
                                                                        ● {log.status}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs font-mono text-gray-300 truncate">
                                                                {log.details || "Telemetry event recorded"}
                                                            </p>
                                                        </div>
                                                        <div className="text-[10px] font-mono text-gray-500 shrink-0 sm:text-right">
                                                            {new Date(log.timestamp).toLocaleString()}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 5: FACTORY COLORWAY THEMES */}
                            {activeTab === "themes" && (
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
                                                    YAMAHA MT-15 FACTORY SHOWROOM
                                                </span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                            </div>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Select the colorway that matches your motorcycle. All dials, glows, cards, and cockpit ambient lighting adapt instantaneously.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono shrink-0">
                                            <span className="text-gray-400">EQUIPPED:</span>
                                            <span className="font-bold text-white uppercase">{themeConfig.name}</span>
                                        </div>
                                    </div>

                                    {/* Colorway Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {availableThemes.map((item) => {
                                            const isCurrent = item.id === theme;
                                            return (
                                                <div
                                                    key={item.id}
                                                    onClick={() => setTheme(item.id)}
                                                    className={cn(
                                                        "group relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-4 overflow-hidden",
                                                        isCurrent
                                                            ? "bg-black/80 border-white/30 shadow-[0_0_25px_rgba(255,255,255,0.1)] ring-1 ring-white/20"
                                                            : "bg-black/40 border-white/10 hover:border-white/25 hover:bg-black/60"
                                                    )}
                                                >
                                                    {/* Glow accent corner */}
                                                    <div
                                                        className="absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity"
                                                        style={{ backgroundColor: item.primaryHex }}
                                                    />

                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="w-8 h-8 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110 shadow-lg shrink-0"
                                                                style={{
                                                                    backgroundColor: `${item.primaryHex}20`,
                                                                    borderColor: `${item.primaryHex}60`,
                                                                    boxShadow: `0 0 15px ${item.primaryHex}40`,
                                                                }}
                                                            >
                                                                <span
                                                                    className="w-3.5 h-3.5 rounded-full"
                                                                    style={{ backgroundColor: item.primaryHex }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <h3 className="font-mono font-bold text-sm text-white">
                                                                        {item.name}
                                                                    </h3>
                                                                    <span
                                                                        className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold"
                                                                        style={{
                                                                            backgroundColor: `${item.primaryHex}25`,
                                                                            color: item.primaryHex,
                                                                        }}
                                                                    >
                                                                        {item.badge}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[11px] font-mono text-gray-400">
                                                                    {item.subname}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {isCurrent && (
                                                            <div
                                                                className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold text-black flex items-center gap-1 shrink-0"
                                                                style={{ backgroundColor: item.primaryHex }}
                                                            >
                                                                <Check className="w-3 h-3 stroke-[3]" />
                                                                <span>ACTIVE</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <p className="text-xs text-gray-300 font-mono leading-relaxed">
                                                        {item.description}
                                                    </p>

                                                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] font-mono">
                                                        <span className="text-gray-400">
                                                            Wheel Accent: <span className="text-gray-200">{item.wheelsColor}</span>
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setTheme(item.id);
                                                            }}
                                                            className={cn(
                                                                "px-3 py-1 rounded-lg font-bold tracking-wider transition-all",
                                                                isCurrent
                                                                    ? "bg-white/10 text-white border border-white/20"
                                                                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                                                            )}
                                                        >
                                                            {isCurrent ? "EQUIPPED" : "EQUIP THEME"}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        <ImportBackupModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
        />
    </>
    );
}
