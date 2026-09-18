"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Check, Sparkles } from "lucide-react";
import { useCockpitTheme, CockpitTheme } from "@/context/ThemeContext";

export default function ThemeSwitcher() {
    const { theme, setTheme, availableThemes } = useCockpitTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const activeTheme = availableThemes.find((t) => t.id === theme) || availableThemes[0];

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                title="MT-15 Factory Colorway Themes"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-semibold tracking-wider text-white bg-black/40 border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-all shadow-sm"
            >
                {/* Theme color swatch dot */}
                <span
                    className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor] transition-colors duration-300"
                    style={{
                        backgroundColor: activeTheme.primaryHex,
                        color: activeTheme.primaryHex,
                    }}
                />
                <Palette className="w-3.5 h-3.5 opacity-80" />
                <span className="hidden xl:inline text-[11px] text-gray-300">
                    {activeTheme.name.split(" ")[0].toUpperCase()}
                </span>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="theme-switcher-dropdown-panel"
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-72 p-2 rounded-2xl bg-[#070b14]/95 backdrop-blur-2xl border border-cyan-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.9),0_0_20px_rgba(0,240,255,0.15)] z-50 flex flex-col gap-1.5"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
                            <div className="flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3" />
                                <span>FACTORY COLORWAYS</span>
                            </div>
                            <span className="text-gray-500">YAMAHA MT-15</span>
                        </div>

                        {/* Theme Options */}
                        <div className="flex flex-col gap-1 p-1">
                            {availableThemes.map((item) => {
                                const isSelected = item.id === theme;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setTheme(item.id);
                                            setIsOpen(false);
                                        }}
                                        className={`group relative flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-200 border ${
                                            isSelected
                                                ? "bg-white/10 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.06)]"
                                                : "border-transparent hover:bg-white/5 hover:border-white/10"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Swatch & Glow */}
                                            <div className="relative flex items-center justify-center">
                                                <div
                                                    className="w-4 h-4 rounded-full transition-transform group-hover:scale-110"
                                                    style={{
                                                        backgroundColor: item.primaryHex,
                                                        boxShadow: isSelected
                                                            ? `0 0 12px ${item.primaryHex}`
                                                            : `0 0 6px ${item.primaryHex}66`,
                                                    }}
                                                />
                                            </div>

                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-mono font-bold text-white tracking-wide">
                                                        {item.name}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-mono text-gray-400 leading-tight">
                                                    {item.subname}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            {isSelected && (
                                                <div
                                                    className="p-1 rounded-full text-black flex items-center justify-center"
                                                    style={{ backgroundColor: item.primaryHex }}
                                                >
                                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
