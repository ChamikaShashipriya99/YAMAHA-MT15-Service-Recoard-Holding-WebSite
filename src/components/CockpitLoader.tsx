"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, FastForward } from "lucide-react";

export default function CockpitLoader() {
    const [progress, setProgress] = useState(0);
    const [bootStep, setBootStep] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const bootMessages = [
        "CALIBRATING COCKPIT INSTRUMENTATION...",
        "INITIALIZING 155cc VVA TELEMETRY...",
        "ESTABLISHING ATLAS MONGODB LINK...",
        "SYNCHRONIZING SERVICE ARCHIVES...",
        "SYSTEM ONLINE // READY TO RIDE"
    ];

    useEffect(() => {
        // Autoplay the video
        if (videoRef.current) {
            videoRef.current.play().catch(() => {});
        }

        const DURATION_MS = 10000; // 10 seconds total duration
        const startTime = Date.now();

        const timer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const currentProgress = Math.min(100, Math.round((elapsed / DURATION_MS) * 100));
            setProgress(currentProgress);

            // Step through boot messages evenly every 2 seconds
            const step = Math.min(
                bootMessages.length - 1,
                Math.floor((elapsed / DURATION_MS) * bootMessages.length)
            );
            setBootStep(step);

            if (elapsed >= DURATION_MS) {
                clearInterval(timer);
                setIsFinished(true);
            }
        }, 50);

        return () => clearInterval(timer);
    }, [bootMessages.length]);

    const showLoader = !isFinished && !isDismissed;

    return (
        <AnimatePresence>
            {showLoader && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="fixed inset-0 z-[100] w-screen h-screen overflow-hidden bg-black flex flex-col justify-between p-6 sm:p-10 select-none"
                >
                    {/* Full Screen Background Video */}
                    <video
                        ref={videoRef}
                        src="/LoadingScreenMT15.mp4"
                        autoPlay
                        muted
                        playsInline
                        loop
                        className="absolute inset-0 w-full h-full object-cover z-0"
                    />

                    {/* Subtle Cinematic Vignette / HUD Gradients */}
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/85 via-transparent to-black/70 pointer-events-none" />
                    <div className="absolute inset-0 z-10 bg-radial-gradient from-transparent to-black/50 pointer-events-none" />

                    {/* Top HUD Header */}
                    <div className="relative z-20 flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-cyan-500/25 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
                            <span className="p-1 rounded bg-cyan-500/20 text-cyan-400">
                                <Terminal className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-[11px] font-mono tracking-widest text-cyan-300 font-bold uppercase">
                                YAMAHA MT-15 // BOOT SEQUENCE
                            </span>
                        </div>

                        <button
                            onClick={() => setIsDismissed(true)}
                            className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wider text-white bg-black/60 hover:bg-cyan-500/20 backdrop-blur-md border border-white/20 hover:border-cyan-400 transition-all shadow-[0_0_20px_rgba(0,0,0,0.8)]"
                        >
                            <span>SKIP INTRO</span>
                            <FastForward className="w-3.5 h-3.5 text-cyan-400" />
                        </button>
                    </div>

                    {/* Bottom HUD Telemetry & 10-Second Progress Bar */}
                    <div className="relative z-20 w-full max-w-2xl mx-auto flex flex-col gap-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 text-xs font-mono">
                            <div>
                                <span className="text-[10px] text-gray-400 tracking-widest uppercase block mb-0.5">
                                    THE DARK SIDE OF JAPAN
                                </span>
                                <span className="text-cyan-300 font-bold tracking-wider">
                                    {bootMessages[bootStep]}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400">CALIBRATING</span>
                                <span className="text-base font-bold text-white font-mono">{progress}%</span>
                            </div>
                        </div>

                        {/* Glowing Telemetry Progress Bar */}
                        <div className="w-full h-2 bg-black/80 backdrop-blur-md rounded-full overflow-hidden border border-cyan-500/30 p-[1px] shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500 rounded-full shadow-[0_0_20px_rgba(0,240,255,0.9)] transition-all duration-75 ease-linear"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 px-0.5">
                            <span>MODEL: YAMAHA MT-15 V2 (155cc VVA)</span>
                            <span className="flex items-center gap-1 text-cyan-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                                10S BOOT SEQUENCE
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
