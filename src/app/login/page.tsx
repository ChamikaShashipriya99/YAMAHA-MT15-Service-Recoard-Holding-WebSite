"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Shield,
    Lock,
    User,
    KeyRound,
    Eye,
    EyeOff,
    Terminal,
    ArrowRight,
    AlertCircle,
    Smartphone,
} from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [totpCode, setTotpCode] = useState("");
    const [recoveryCode, setRecoveryCode] = useState("");
    const [useRecoveryCode, setUseRecoveryCode] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    password,
                    totpCode: useRecoveryCode ? undefined : totpCode,
                    recoveryCode: useRecoveryCode ? recoveryCode : undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Authentication failed");
            }

            // Redirect to dashboard
            router.push("/");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Failed to authenticate");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md cyber-card rounded-2xl p-6 sm:p-8 relative overflow-hidden"
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
                            SECURITY TERMINAL // ACCESS_RESTRICTED
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-mono font-bold text-white">
                        RIDER <span className="text-cyan-400">AUTHENTICATION</span>
                    </h1>
                    <p className="text-xs font-mono text-gray-400 mt-1">
                        Enter your credentials & Google Authenticator 2FA code
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs font-mono shadow-[0_0_20px_rgba(255,42,95,0.15)]">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Username Input */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-mono text-gray-300 flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-cyan-400" />
                            USERNAME
                        </label>
                        <input
                            type="text"
                            required
                            autoComplete="username"
                            placeholder="e.g. Chamikaz99"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-xs font-mono bg-black/60 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 transition-colors"
                        />
                    </div>

                    {/* Password Input */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-mono text-gray-300 flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-cyan-400" />
                            PASSWORD
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                autoComplete="current-password"
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-3.5 pr-10 py-2.5 text-xs font-mono bg-black/60 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* 2FA TOTP Code or Recovery Code */}
                    {!useRecoveryCode ? (
                        <div className="flex flex-col gap-1.5 mt-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-mono text-cyan-300 font-bold flex items-center gap-2">
                                    <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                                    GOOGLE AUTHENTICATOR (6 DIGITS)
                                </label>
                                <Link
                                    href="/setup-2fa"
                                    className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
                                >
                                    <Smartphone className="w-3 h-3" />
                                    <span>PAIR PHONE</span>
                                </Link>
                            </div>
                            <input
                                type="text"
                                required
                                maxLength={6}
                                autoComplete="one-time-code"
                                placeholder="000000"
                                value={totpCode}
                                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                                className="w-full px-3.5 py-3 text-center text-lg font-mono font-bold tracking-[0.3em] bg-black/80 border border-cyan-500/30 rounded-xl text-cyan-300 placeholder-gray-700 focus:outline-none focus:border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.15)] transition-all"
                            />
                            <div className="flex justify-end pt-0.5">
                                <button
                                    type="button"
                                    onClick={() => setUseRecoveryCode(true)}
                                    className="text-[10px] font-mono text-gray-400 hover:text-amber-400 transition-colors"
                                >
                                    Lost phone? Use Emergency Recovery Code
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1.5 mt-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-mono text-amber-300 font-bold flex items-center gap-2">
                                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                                    EMERGENCY RECOVERY CODE
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setUseRecoveryCode(false)}
                                    className="text-[10px] font-mono text-cyan-400 hover:underline"
                                >
                                    Use Google Authenticator
                                </button>
                            </div>
                            <input
                                type="text"
                                required
                                maxLength={10}
                                placeholder="XXXX-XXXX"
                                value={recoveryCode}
                                onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                                className="w-full px-3.5 py-3 text-center text-base font-mono font-bold tracking-[0.2em] bg-black/80 border border-amber-500/40 rounded-xl text-amber-300 placeholder-gray-700 focus:outline-none focus:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all uppercase"
                            />
                            <p className="text-[10px] font-mono text-amber-400/80">
                                Single-use emergency backup key.
                            </p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-3">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-mono font-bold tracking-wider text-black bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500 shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] transition-all disabled:opacity-50"
                        >
                            <span>{isLoading ? "VERIFYING SECURITY TOKENS..." : "INITIALIZE SECURE ACCESS"}</span>
                            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                    </div>

                    {/* First Time Setup Link */}
                    <div className="pt-2 text-center">
                        <Link
                            href="/setup-2fa"
                            className="text-xs font-mono text-gray-400 hover:text-cyan-300 transition-colors"
                        >
                            First time setting up 2FA? <span className="text-cyan-400 underline">Scan QR Code</span>
                        </Link>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
