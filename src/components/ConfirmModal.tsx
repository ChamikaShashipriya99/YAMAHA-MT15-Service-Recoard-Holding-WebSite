"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, ShieldAlert } from "lucide-react";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
}: ConfirmModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-rose-500/30 bg-[#090b14] shadow-[0_0_35px_rgba(255,42,95,0.2)] p-6"
                    >
                        {/* Cyber Corner Brackets */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-rose-500 rounded-tl-xl" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-rose-500 rounded-br-xl" />

                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                                <ShieldAlert className="w-6 h-6 animate-pulse" />
                            </div>
                            <div className="flex-1">
                                <div className="text-[10px] font-mono tracking-widest text-rose-400 font-bold uppercase mb-1">
                                    [ALERT // PURGE_RECORD]
                                </div>
                                <h3 className="text-lg font-mono font-bold text-white mb-2">{title}</h3>
                                <p className="text-gray-400 text-xs font-mono leading-relaxed">
                                    {message}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/5 flex gap-3 justify-end">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-mono font-semibold transition-colors border border-white/10"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold tracking-wider transition-all shadow-[0_0_15px_rgba(255,42,95,0.4)]"
                            >
                                PURGE RECORD
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
