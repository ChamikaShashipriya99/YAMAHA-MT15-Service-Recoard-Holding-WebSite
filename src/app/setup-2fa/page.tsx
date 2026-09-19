"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    ShieldCheck,
    Smartphone,
    Terminal,
    ArrowRight,
    Copy,
    Check,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    Lock,
    Key,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Setup2FAPage() {
    const [setupData, setSetupData] = useState<{
        username: string;
        secret: string;
        qrCodeDataUrl: string;
        authenticated?: boolean;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [testCode, setTestCode] = useState("");
    const [testStatus, setTestStatus] = useState<{
        checked: boolean;
        valid?: boolean;
        message?: string;
    }>({ checked: false });

    // Password unlock state for unauthenticated setup
    const [requiresPassword, setRequiresPassword] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [authError, setAuthError] = useState("");
    const [authenticating, setAuthenticating] = useState(false);

    useEffect(() => {
        fetch("/api/auth/setup-2fa")
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.authenticated && data.secret) {
                    setSetupData(data);
                    setRequiresPassword(false);
                } else {
                    setRequiresPassword(true);
                }
                setLoading(false);
            })
            .catch(() => {
                setRequiresPassword(true);
                setLoading(false);
            });
    }, []);

    const copySecret = () => {
        if (setupData?.secret) {
            navigator.clipboard.writeText(setupData.secret);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const unlockWithPassword = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!passwordInput.trim()) {
            setAuthError("Please enter your master password to reveal 2FA pairing data.");
            return;
        }

        setAuthenticating(true);
        setAuthError("");

        try {
            const res = await fetch("/api/auth/setup-2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: passwordInput.trim() }),
            });

            const data = await res.json();
            if (res.ok && data.success && data.secret) {
                setSetupData(data);
                setRequiresPassword(false);
                setPasswordInput("");
            } else {
                setAuthError(data.error || "Authentication failed. Incorrect password.");
            }
        } catch {
            setAuthError("Network error. Please try again.");
        } finally {
            setAuthenticating(false);
        }
    };

    const verifyTestCode = async () => {
        if (!testCode || testCode.length !== 6) {
            setTestStatus({ checked: true, valid: false, message: "Enter a 6-digit code" });
            return;
        }

        try {
            const res = await fetch("/api/auth/setup-2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "test_code",
                    totpCode: testCode,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success && data.valid) {
                setTestStatus({
                    checked: true,
                    valid: true,
                    message: "Code verified successfully! Google Authenticator is configured.",
                });
            } else {
                setTestStatus({
                    checked: true,
                    valid: false,
                    message: data.error || "Code mismatch. Check your phone's clock & app code.",
                });
            }
        } catch {
            setTestStatus({
                checked: true,
                valid: false,
                message: "Failed to connect to verification service.",
            });
        }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-xl cyber-card rounded-2xl p-6 sm:p-8 relative overflow-hidden"
            >
                <div className="cyber-corner-tl" />
                <div className="cyber-corner-br" />

                {/* Header */}
                <div className="pb-4 mb-6 border-b border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="p-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                            <Terminal className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">
                            SECURITY INITIALIZATION // 2FA_PAIRING
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-mono font-bold text-white">
                        GOOGLE AUTHENTICATOR <span className="text-cyan-400">SETUP</span>
                    </h1>
                    <p className="text-xs font-mono text-gray-400 mt-1">
                        Pair your mobile device with your Yamaha MT-15 Cockpit
                    </p>
                </div>

                {loading ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-3">
                        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                        <span className="text-xs font-mono text-cyan-400">GENERATING 2FA SECRET & QR CODE...</span>
                    </div>
                ) : setupData ? (
                    <div className="flex flex-col gap-6">
                        {/* Step 1: Scan QR Code */}
                        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-black/50 border border-cyan-500/20">
                            <div className="p-3 bg-white rounded-xl shadow-[0_0_25px_rgba(0,240,255,0.25)] flex-shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={setupData.qrCodeDataUrl}
                                    alt="Google Authenticator QR Code"
                                    width={160}
                                    height={160}
                                    className="rounded-lg block"
                                />
                            </div>

                            <div className="flex flex-col gap-2 text-xs font-mono">
                                <span className="text-cyan-400 font-bold tracking-wider uppercase flex items-center gap-1.5">
                                    <Smartphone className="w-4 h-4" />
                                    STEP 1: SCAN WITH PHONE
                                </span>
                                <ol className="list-decimal list-inside space-y-1.5 text-gray-300">
                                    <li>Open <strong>Google Authenticator</strong> on your phone.</li>
                                    <li>Tap the <strong>+</strong> button (bottom right).</li>
                                    <li>Choose <strong>Scan a QR code</strong> and point your camera here.</li>
                                </ol>
                            </div>
                        </div>

                        {/* Step 2: Manual Key (Fallback) */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                                OR ENTER CODE MANUALLY (ACCOUNT: {setupData.username})
                            </span>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs font-mono text-cyan-300 tracking-widest break-all">
                                    {setupData.secret}
                                </code>
                                <button
                                    onClick={copySecret}
                                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-300 border border-white/10 transition-colors flex items-center gap-1.5 text-xs font-mono"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copied ? "COPIED" : "COPY"}</span>
                                </button>
                            </div>
                        </div>

                        {/* Step 3: Test Verification */}
                        <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-3">
                            <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                                TEST YOUR 6-DIGIT CODE
                            </span>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="e.g. 123456"
                                    value={testCode}
                                    onChange={(e) => setTestCode(e.target.value.replace(/\D/g, ""))}
                                    className="flex-1 px-3 py-2 text-center text-sm font-mono tracking-widest bg-black/60 border border-white/15 rounded-xl text-white focus:border-cyan-400 focus:outline-none"
                                />
                                <button
                                    onClick={verifyTestCode}
                                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-colors"
                                >
                                    VERIFY
                                </button>
                            </div>

                            {testStatus.checked && (
                                <div
                                    className={`p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 border ${
                                        testStatus.valid
                                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                            : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                                    }`}
                                >
                                    {testStatus.valid ? (
                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    )}
                                    <span>{testStatus.message}</span>
                                </div>
                            )}
                        </div>

                        {/* Action Navigation */}
                        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                            <span className="text-[10px] font-mono text-gray-500 uppercase">
                                STATUS: 2FA ACTIVATED
                            </span>
                            <Link href="/login">
                                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold text-black bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] transition-all">
                                    <span>PROCEED TO LOGIN</span>
                                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                            </Link>
                        </div>
                    </div>
                ) : requiresPassword ? (
                    <form onSubmit={unlockWithPassword} className="flex flex-col gap-5 py-4">
                        <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col gap-1 text-xs font-mono">
                                <span className="text-white font-bold tracking-wider">
                                    MASTER CREDENTIALS REQUIRED
                                </span>
                                <span className="text-gray-400 leading-relaxed">
                                    To prevent unauthorized interception of your Google Authenticator key, enter your master password to generate and reveal the pairing QR matrix.
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                                <Key className="w-3.5 h-3.5" />
                                ENTER MASTER COCKPIT PASSWORD
                            </label>
                            <input
                                type="password"
                                placeholder="Enter master password to unlock 2FA"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className="w-full px-4 py-3 bg-black/60 border border-white/15 focus:border-cyan-400 rounded-xl text-white font-mono text-sm tracking-wider focus:outline-none transition-all shadow-inner"
                                autoFocus
                            />
                        </div>

                        {authError && (
                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{authError}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={authenticating}
                            className="w-full py-3 rounded-xl text-xs font-mono font-bold text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 shadow-[0_0_20px_rgba(0,240,255,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                            {authenticating ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>DECRYPTING PAIRING PROTOCOL...</span>
                                </>
                            ) : (
                                <>
                                    <span>AUTHENTICATE & REVEAL 2FA QR</span>
                                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="py-8 text-center text-xs font-mono text-rose-400">
                        Failed to load 2FA setup data. Please refresh the page.
                    </div>
                )}
            </motion.div>
        </div>
    );
}
