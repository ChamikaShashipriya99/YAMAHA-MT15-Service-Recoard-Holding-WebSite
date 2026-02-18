"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
    { name: "Home", href: "/" },
    { name: "History", href: "/history" },
    { name: "Maintenance", href: "/maintenance" },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Close mobile menu when route changes
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    return (
        <div className="fixed top-5 inset-x-0 mx-auto w-full max-w-2xl z-50 px-4 sm:px-0">
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={cn(
                    "relative flex items-center justify-between px-6 py-3",
                    "bg-black/40 backdrop-blur-md border border-white/10",
                    "rounded-full shadow-2xl shadow-black/50"
                )}
            >
                {/* Branding */}
                <Link href="/" className="group">
                    <span className="text-xl font-bold tracking-wider text-white drop-shadow-[0_0_8px_rgba(0,255,255,0.6)] group-hover:drop-shadow-[0_0_12px_rgba(0,255,255,0.8)] transition-all duration-300">
                        MT-15
                    </span>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-6">
                    {links.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-cyan-400",
                                pathname === link.href ? "text-cyan-400" : "text-gray-300"
                            )}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Add Record Button (Desktop) */}
                <div className="hidden md:block">
                    <Link href="/add-record">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg shadow-cyan-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Record</span>
                        </motion.button>
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden text-white hover:text-cyan-400 transition-colors"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </motion.nav>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-4 right-4 mt-2 p-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl md:hidden flex flex-col gap-4 overflow-hidden"
                    >
                        {links.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "text-base font-medium transition-colors p-2 rounded-lg hover:bg-white/5",
                                    pathname === link.href ? "text-cyan-400 bg-white/5" : "text-gray-300"
                                )}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <Link href="/add-record" className="w-full">
                            <button
                                className="flex w-full items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-cyan-500/20"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Record</span>
                            </button>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
