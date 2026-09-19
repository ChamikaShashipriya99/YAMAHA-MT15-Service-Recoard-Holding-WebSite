"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Plus, Cpu, Activity, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useServiceContext } from "@/context/ServiceContext";
import { useCockpitTheme } from "@/context/ThemeContext";
import SettingsModal from "@/components/SettingsModal";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import NotificationCenter from "@/components/NotificationCenter";

const navLinks = [
    { name: "COCKPIT", href: "/" },
    { name: "SERVICE LOGS", href: "/history" },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { openAddModal } = useServiceContext();
    const { theme, setTheme, availableThemes } = useCockpitTheme();

    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            router.push("/login");
            router.refresh();
        }
    };

    if (pathname === "/login" || pathname === "/setup-2fa") {
        return null;
    }

    return (
        <div className="fixed top-4 inset-x-0 mx-auto w-full max-w-6xl xl:max-w-7xl z-50 px-4 sm:px-6 lg:px-8">
            <motion.nav
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex items-center justify-between px-6 py-2.5 bg-[#070b14]/90 backdrop-blur-xl border border-cyan-500/25 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.8),0_0_15px_rgba(0,240,255,0.1)]"
            >
                {/* Branding */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center p-0.5 shadow-[0_0_12px_rgba(0,240,255,0.4)] group-hover:shadow-[0_0_18px_rgba(0,240,255,0.7)] transition-all">
                        <Cpu className="w-4 h-4 text-black stroke-[2.5]" />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="font-mono text-base font-bold tracking-wider text-white group-hover:text-cyan-400 transition-colors">
                                MT<span className="text-cyan-400">-15</span>
                            </span>
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        </div>
                        <span className="text-[9px] font-mono tracking-widest text-gray-400 -mt-1 uppercase">
                            Dark Side of Japan
                        </span>
                    </div>
                </Link>

                {/* Desktop Navigation Links */}
                <div className="hidden md:flex items-center gap-1 bg-black/50 px-3 py-1 rounded-xl border border-white/5">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "relative px-4 py-1.5 text-xs font-mono tracking-wider font-semibold rounded-lg transition-all duration-200",
                                    isActive
                                        ? "text-cyan-300 bg-cyan-500/15 shadow-[0_0_12px_rgba(0,240,255,0.2)]"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {link.name}
                                {isActive && (
                                    <motion.span
                                        layoutId="activeNavIndicator"
                                        className="absolute bottom-0 left-2 right-2 h-[2px] bg-cyan-400 rounded-full"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Actions: Log Service CTA & Logout */}
                <div className="hidden md:flex items-center gap-2.5">
                    <motion.button
                        onClick={openAddModal}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="relative group overflow-hidden flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider text-black bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500 shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] transition-all"
                    >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>LOG SERVICE</span>
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    </motion.button>

                    <NotificationCenter />

                    <ThemeSwitcher />

                    <motion.button
                        onClick={() => setIsSettingsOpen(true)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        title="Cockpit Settings & Diagnostics"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-semibold tracking-wider text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 hover:bg-cyan-500/20 hover:border-cyan-500/40 hover:text-white transition-all shadow-[0_0_12px_rgba(0,240,255,0.12)]"
                    >
                        <Settings className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span className="hidden lg:inline">SETTINGS</span>
                    </motion.button>

                    <motion.button
                        onClick={handleLogout}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        title="Disconnect & Lock Cockpit"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-semibold tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300 transition-all shadow-[0_0_12px_rgba(244,63,94,0.15)]"
                    >
                        <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span className="hidden lg:inline">LOGOUT</span>
                    </motion.button>
                </div>

                {/* Mobile Notification & Menu Buttons */}
                <div className="md:hidden flex items-center gap-2">
                    <NotificationCenter />
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2 rounded-xl text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                        aria-label="Toggle Navigation Menu"
                    >
                        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </motion.nav>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="mobile-nav-menu-dropdown"
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-4 right-4 mt-2 p-4 bg-[#070b14]/95 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.9)] md:hidden flex flex-col gap-3 overflow-hidden"
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-white/5 text-[10px] font-mono text-cyan-400">
                            <span>TELEMETRY CONSOLE</span>
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        </div>

                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-xl text-xs font-mono font-semibold transition-all",
                                    pathname === link.href
                                        ? "text-cyan-300 bg-cyan-500/15 border border-cyan-500/30"
                                        : "text-gray-300 hover:bg-white/5"
                                )}
                            >
                                <span>{link.name}</span>
                                <Activity className="w-3.5 h-3.5 opacity-50" />
                            </Link>
                        ))}

                        {/* Mobile Factory Colorway Switcher Row */}
                        <div className="pt-2 pb-1 border-t border-white/5 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-gray-400">
                                <span>FACTORY COLORWAY</span>
                                <span className="text-cyan-400 font-semibold">{theme.toUpperCase()}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-1.5">
                                {availableThemes.map((item) => {
                                    const isSelected = item.id === theme;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setTheme(item.id)}
                                            className={cn(
                                                "flex flex-col items-center gap-1.5 p-2 rounded-xl text-center border transition-all",
                                                isSelected
                                                    ? "bg-white/10 border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.1)]"
                                                    : "border-white/5 bg-black/40 hover:bg-white/5"
                                            )}
                                        >
                                            <span
                                                className="w-3.5 h-3.5 rounded-full transition-transform"
                                                style={{
                                                    backgroundColor: item.primaryHex,
                                                    boxShadow: isSelected ? `0 0 10px ${item.primaryHex}` : "none",
                                                }}
                                            />
                                            <span className="text-[9px] font-mono font-semibold text-gray-300 truncate w-full">
                                                {item.name.split(" ")[0]}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="w-full pt-1 flex flex-col gap-2">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    openAddModal();
                                }}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-mono font-bold tracking-wider text-black bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                            >
                                <Plus className="w-4 h-4 stroke-[3]" />
                                <span>LOG SERVICE RECORD</span>
                            </button>

                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setIsSettingsOpen(true);
                                }}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 hover:bg-cyan-500/20 transition-all"
                            >
                                <Settings className="w-4 h-4 stroke-[2.5]" />
                                <span>COCKPIT SETTINGS</span>
                            </button>

                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    handleLogout();
                                }}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 transition-all"
                            >
                                <LogOut className="w-4 h-4 stroke-[2.5]" />
                                <span>DISCONNECT & LOGOUT</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cockpit Settings Modal */}
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
}
