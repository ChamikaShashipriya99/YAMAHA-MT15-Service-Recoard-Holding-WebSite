"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, EyeOff, Lock, AlertTriangle } from "lucide-react";

export default function SecurityGuardian() {
    const [securityAlert, setSecurityAlert] = useState<string | null>(null);
    const [isScreenMasked, setIsScreenMasked] = useState(false);

    const triggerAlert = (message: string) => {
        setSecurityAlert(message);
        setTimeout(() => {
            setSecurityAlert(null);
        }, 2200);
    };

    useEffect(() => {
        // 1. Block Context Menu (Right Click)
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            triggerAlert("RIGHT-CLICK CONTEXT MENU DISABLED");
        };

        // 2. Block DevTools, Inspect, View Source, Print & Save Shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            // F12
            if (e.key === "F12" || e.keyCode === 123) {
                e.preventDefault();
                e.stopPropagation();
                triggerAlert("DEVELOPER CONSOLE ACCESS RESTRICTED");
                return;
            }

            const isCmdOrCtrl = e.ctrlKey || e.metaKey;

            // Ctrl + Shift + I / J / C (DevTools / Inspect)
            if (isCmdOrCtrl && e.shiftKey && ["I", "i", "J", "j", "C", "c"].includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                triggerAlert("ELEMENT INSPECTOR RESTRICTED");
                return;
            }

            // Ctrl + U (View Source)
            if (isCmdOrCtrl && ["U", "u"].includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                triggerAlert("SOURCE CODE INSPECTION RESTRICTED");
                return;
            }

            // Ctrl + S (Save Page)
            if (isCmdOrCtrl && ["S", "s"].includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                triggerAlert("OFFLINE PAGE SAVE RESTRICTED");
                return;
            }

            // Ctrl + P (Print Webpage)
            if (isCmdOrCtrl && ["P", "p"].includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                triggerAlert("DIRECT PRINTING RESTRICTED // USE EXPORT DOSSIER");
                return;
            }
        };

        // 3. Scrub Clipboard on PrintScreen key
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === "PrintScreen" || e.code === "PrintScreen") {
                try {
                    navigator.clipboard.writeText("SECURITY RESTRICTION: SCREENSHOT SCRUBBED");
                } catch {
                    // Clipboard API might require focus
                }
                triggerAlert("SCREEN CAPTURE ATTEMPT DETECTED // CLIPBOARD SCRUBBED");
            }
        };

        // 4. Block Dragging and Unauthorized Copying
        const handleDragStart = (e: DragEvent) => {
            e.preventDefault();
        };

        const handleCopy = (e: ClipboardEvent) => {
            const target = e.target as HTMLElement;
            if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
                return; // allow form inputs
            }
            e.preventDefault();
            triggerAlert("TEXT & DATA CLONING RESTRICTED");
        };

        const handleCut = (e: ClipboardEvent) => {
            const target = e.target as HTMLElement;
            if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
                return;
            }
            e.preventDefault();
        };

        // 5. Anti-Snipping & Focus Loss Protection
        // When Windows Snipping Tool (Win+Shift+S) or window blur happens, mask screen
        const handleBlur = () => {
            setIsScreenMasked(true);
        };

        const handleFocus = () => {
            setIsScreenMasked(false);
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setIsScreenMasked(true);
            } else {
                setIsScreenMasked(false);
            }
        };

        // Attach event listeners
        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("keyup", handleKeyUp);
        document.addEventListener("dragstart", handleDragStart);
        document.addEventListener("copy", handleCopy);
        document.addEventListener("cut", handleCut);
        window.addEventListener("blur", handleBlur);
        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("keyup", handleKeyUp);
            document.removeEventListener("dragstart", handleDragStart);
            document.removeEventListener("copy", handleCopy);
            document.removeEventListener("cut", handleCut);
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    return (
        <>
            {/* Anti-Screen Capture Mask (Triggers on Blur / Snipping Tool invocation) */}
            <AnimatePresence>
                {isScreenMasked && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => setIsScreenMasked(false)}
                        className="fixed inset-0 z-[999] bg-black/85 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 10 }}
                            className="relative max-w-md w-full p-6 rounded-2xl bg-[#090d18]/95 border border-rose-500/40 shadow-[0_0_50px_rgba(244,63,94,0.25)] flex flex-col items-center gap-4"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                                <EyeOff className="w-7 h-7 animate-pulse" />
                            </div>

                            <div>
                                <div className="text-[10px] font-mono tracking-widest text-rose-400 font-bold uppercase mb-1">
                                    [SHIELD PROTOCOL ENGAGED // PRIVACY MASK]
                                </div>
                                <h3 className="text-xl font-mono font-bold text-white tracking-wide">
                                    TELEMETRY SCREEN MASKED
                                </h3>
                                <p className="text-xs font-mono text-gray-400 mt-2 leading-relaxed">
                                    Display masked to prevent unauthorized background screen recording and snipping capture.
                                </p>
                            </div>

                            <div className="mt-2 px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-cyan-300 font-medium">
                                CLICK OR RETURN TO WINDOW TO RESUME COCKPIT
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cyber HUD Security Alert Toast */}
            <AnimatePresence>
                {securityAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-6 right-6 z-[1000] flex items-center gap-3 px-4 py-3 rounded-xl bg-[#090d18]/95 border border-rose-500/50 shadow-[0_0_25px_rgba(244,63,94,0.3)] backdrop-blur-xl text-white select-none pointer-events-none"
                    >
                        <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                            <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-mono tracking-widest text-rose-400 font-bold uppercase">
                                SECURITY GUARDIAN // RESTRICTED
                            </span>
                            <span className="text-xs font-mono font-semibold text-gray-200">
                                {securityAlert}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}