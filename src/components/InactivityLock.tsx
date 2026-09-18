"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Shield, KeyRound, ArrowRight, LogOut, AlertCircle } from "lucide-react";

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes

export default function InactivityLock() {
    const pathname = usePathname();
    const router = useRouter();
    const [isLocked, setIsLocked] = useState(false);
    const [unlockCode, setUnlockCode] = useState("");
    const [unlockMode, setUnlockMode] = useState<"password" | "totp">("password");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Public auth pages should never be locked
    const isPublicPage = pathname === "/login" || pathname === "/setup-2fa";

    const resetTimer = useCallback(() => {
        if (isLocked || isPublicPage) return;
        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
            setIsLocked(true);
        }, INACTIVITY_TIMEOUT_MS);
    }, [isLocked, isPublicPage]);

    // Setup global user interaction listeners
    useEffect(() => {
        if (isPublicPage) {
            setIsLocked(false);
            if (timerRef.current) clearTimeout(timerRef.current);
            return;
        }

        const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
        const handleActivity = () => resetTimer();

        // Hotkey for manual lock: Ctrl + Shift + L
        const handleHotkey = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && (e.key === "L" || e.key === "l")) {
                e.preventDefault();
                setIsLocked(true);
            }
        };

        events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));
        window.addEventListener("keydown", handleHotkey);

        resetTimer();

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach((evt) => window.removeEventListener(evt, handleActivity));
            window.removeEventListener("keydown", handleHotkey);
        };
    }, [resetTimer, isPublicPage]);

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!unlockCode.trim()) return;

        setIsLoading(true);
        try {
            const body =
                unlockMode === "password"
                    ? { password: unlockCode.trim() }
                    : { totpCode: unlockCode.trim() };

            const res = await fetch("/api/auth/verify-unlock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Unlock verification failed");
            }

            setIsLocked(false);
            setUnlockCode("");
            resetTimer();
        } catch (err: any) {
            setError(err.message || "Invalid credentials");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch {
            // ignore
        }
        setIsLocked(false);
        router.push("/login");
        router.refresh();
    };

    if (isPublicPage) return null;

    return (
        <AnimatePresence>
            {isLocked && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-[#03050a]/90 backdrop-blur-2xl"
                >
                    {/* Cyber Ambient Halo */}
                    <div className="absolute w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

                    <motion.div
                        initial={{ scale: 0.95, y: 15 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 15 }}
                        className="relative w-full max-w-md rounded-2xl border border-cyan-500/30 bg-[#070b14] p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_30px_rgba(0,240,255,0.2)] overflow-hidden"
                    >
                        {/* Decorative Corners */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400 rounded-tl-xl" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400 rounded-br-xl" />

                        {/* Lock Header */}
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="relative mb-3">
                                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.25)]">
                                    <Lock className="w-8 h-8" />
                                </div>
                                <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
                                </span>
                            </div>

                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-bold">
                                    COCKPIT SECURED // DEAD MAN&apos;S SWITCH
                                </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-mono font-bold text-white tracking-wider">
                                INACTIVITY SCREEN GUARD
                            </h2>
                            <p className="text-xs font-mono text-gray-400 mt-1.5 max-w-xs">
                                Telemetry display locked after 15m idle time. Provide credentials to resume.
                            </p>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Mode Switcher */}
                        <div className="flex rounded-xl bg-black/60 p-1 border border-white/5 mb-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setUnlockMode("password");
                                    setUnlockCode("");
                                    setError(null);
                                }}
                                className={`flex-1 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all ${
                                    unlockMode === "password"
                                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,240,255,0.15)]"
                                        : "text-gray-400 hover:text-white"
                                }`}
                            >
                                PASSWORD
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setUnlockMode("totp");
                                    setUnlockCode("");
                                    setError(null);
                                }}
                                className={`flex-1 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all ${
                                    unlockMode === "totp"
                                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,240,255,0.15)]"
                                        : "text-gray-400 hover:text-white"
                                }`}
                            >
                                GOOGLE AUTH (6-DIGIT)
                            </button>
                        </div>

                        {/* Unlock Form */}
                        <form onSubmit={handleUnlock} className="flex flex-col gap-4">
                            <div>
                                {unlockMode === "password" ? (
                                    <input
                                        type="password"
                                        required
                                        autoFocus
                                        placeholder="Enter cockpit password"
                                        value={unlockCode}
                                        onChange={(e) => setUnlockCode(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-black/80 border border-cyan-500/30 text-white font-mono text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all"
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        maxLength={6}
                                        placeholder="000000"
                                        value={unlockCode}
                                        onChange={(e) => setUnlockCode(e.target.value.replace(/\D/g, ""))}
                                        className="w-full px-4 py-3 text-center rounded-xl bg-black/80 border border-cyan-500/30 text-cyan-300 font-mono text-lg font-bold tracking-[0.3em] placeholder-gray-700 focus:outline-none focus:border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.15)] transition-all"
                                    />
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 rounded-xl text-xs font-mono font-bold tracking-wider text-black bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500 shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                <span>{isLoading ? "AUTHENTICATING..." : "DISENGAGE LOCK // RESUME COCKPIT"}</span>
                                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                            </button>

                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                <span className="text-[10px] font-mono text-gray-500">
                                    HOTKEY: <span className="text-gray-300">CTRL + SHIFT + L</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="text-[11px] font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    <span>TERMINATE SESSION</span>
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
