import React from "react";
import { Terminal } from "lucide-react";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[100] w-screen h-screen overflow-hidden bg-black flex flex-col justify-between p-6 sm:p-10 select-none">
            {/* FULL SCREEN VIDEO */}
            <video
                src="/LoadingScreenMT15.mp4"
                autoPlay
                muted
                playsInline
                loop
                className="absolute inset-0 w-full h-full object-cover z-0"
            />

            {/* Subtle Vignette */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />

            {/* Top Tag */}
            <div className="relative z-20 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-cyan-500/25">
                    <span className="p-1 rounded bg-cyan-500/20 text-cyan-400">
                        <Terminal className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[11px] font-mono tracking-widest text-cyan-300 font-bold uppercase">
                        YAMAHA MT-15 // TELEMETRY
                    </span>
                </div>
            </div>

            {/* Bottom Status */}
            <div className="relative z-20 w-full max-w-2xl mx-auto text-center">
                <p className="text-xs font-mono text-cyan-300 tracking-wider">
                    SYNCHRONIZING TELEMETRY ARCHIVE...
                </p>
            </div>
        </div>
    );
}
