"use client";

import React, { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PwaRegister() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    useEffect(() => {
        // Register Service Worker
        if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
            window.addEventListener("load", () => {
                navigator.serviceWorker
                    .register("/sw.js")
                    .then((reg) => {
                        console.log("Cockpit PWA ServiceWorker registered:", reg.scope);
                    })
                    .catch((err) => {
                        console.warn("Cockpit PWA ServiceWorker registration failed:", err);
                    });
            });
        }

        // Listen for installable prompt
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Show subtle install banner only if not standalone
            const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
            if (!isStandalone) {
                setShowInstallBanner(true);
            }
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstall);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setShowInstallBanner(false);
        }
        setDeferredPrompt(null);
    };

    return (
        <AnimatePresence>
            {showInstallBanner && deferredPrompt && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-5 left-5 z-[900] max-w-sm p-3.5 rounded-2xl bg-[#090d18]/95 backdrop-blur-2xl border border-cyan-500/35 shadow-[0_10px_35px_rgba(0,0,0,0.9),0_0_20px_rgba(0,240,255,0.2)] flex items-center justify-between gap-3 text-white"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center p-0.5 shadow-[0_0_12px_rgba(0,240,255,0.4)] flex-shrink-0">
                            <Smartphone className="w-5 h-5 text-black stroke-[2.5]" />
                        </div>
                        <div>
                            <div className="text-xs font-mono font-bold text-white tracking-wide">
                                INSTALL MT-15 COCKPIT
                            </div>
                            <div className="text-[10px] font-mono text-gray-400">
                                Fullscreen native app mode
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleInstallClick}
                            className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-black bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.3)] transition-all"
                        >
                            INSTALL
                        </button>
                        <button
                            onClick={() => setShowInstallBanner(false)}
                            className="p-1 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
