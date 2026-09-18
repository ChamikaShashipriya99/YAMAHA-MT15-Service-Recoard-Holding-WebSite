"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CyberDatePickerProps {
    value: string; // YYYY-MM-DD
    onChange: (dateStr: string) => void;
    label?: string;
    required?: boolean;
}

const MONTHS = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
];

const DAYS_OF_WEEK = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

export default function CyberDatePicker({
    value,
    onChange,
    label = "SERVICE DATE",
    required = false,
}: CyberDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Parse initial value or default to today
    const parsedInitial = value ? new Date(value + "T00:00:00") : new Date();
    const [viewYear, setViewYear] = useState(
        isNaN(parsedInitial.getTime()) ? new Date().getFullYear() : parsedInitial.getFullYear()
    );
    const [viewMonth, setViewMonth] = useState(
        isNaN(parsedInitial.getTime()) ? new Date().getMonth() : parsedInitial.getMonth()
    );

    // Sync view when value changes
    useEffect(() => {
        if (value) {
            const d = new Date(value + "T00:00:00");
            if (!isNaN(d.getTime())) {
                setViewYear(d.getFullYear());
                setViewMonth(d.getMonth());
            }
        }
    }, [value]);

    // Close popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Navigate months
    const prevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(viewYear - 1);
        } else {
            setViewMonth(viewMonth - 1);
        }
    };

    const nextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(viewYear + 1);
        } else {
            setViewMonth(viewMonth + 1);
        }
    };

    const setToday = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;
        setViewYear(yyyy);
        setViewMonth(today.getMonth());
        onChange(dateStr);
        setIsOpen(false);
    };

    // Calculate grid days
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    // Pad previous month days
    const prevDays: number[] = [];
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        prevDays.push(daysInPrevMonth - i);
    }

    // Current month days
    const currentDays: number[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
        currentDays.push(i);
    }

    // Next month padding days to fill 42 cells (6 rows * 7) or 35 cells
    const totalFilled = prevDays.length + currentDays.length;
    const nextDaysCount = totalFilled <= 35 ? 35 - totalFilled : 42 - totalFilled;
    const nextDays: number[] = [];
    for (let i = 1; i <= nextDaysCount; i++) {
        nextDays.push(i);
    }

    // Check if day is selected
    const isSelected = (day: number) => {
        if (!value) return false;
        const [y, m, d] = value.split("-").map(Number);
        return y === viewYear && m === viewMonth + 1 && d === day;
    };

    // Check if day is today
    const isToday = (day: number) => {
        const now = new Date();
        return (
            now.getFullYear() === viewYear &&
            now.getMonth() === viewMonth &&
            now.getDate() === day
        );
    };

    const selectDay = (day: number) => {
        const mm = String(viewMonth + 1).padStart(2, "0");
        const dd = String(day).padStart(2, "0");
        const dateStr = `${viewYear}-${mm}-${dd}`;
        onChange(dateStr);
        setIsOpen(false);
    };

    // Formatted display date (e.g., "18 Sep 2026")
    const formattedDisplay = () => {
        if (!value) return "SELECT DATE";
        const d = new Date(value + "T00:00:00");
        if (isNaN(d.getTime())) return value;
        return d.toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <div ref={containerRef} className="relative flex flex-col gap-1.5 w-full">
            {label && (
                <label className="text-xs font-mono text-gray-300 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <CalendarIcon className="w-3.5 h-3.5 text-cyan-400" />
                        {label}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400/80 uppercase">
                        {value || "NOT SET"}
                    </span>
                </label>
            )}

            {/* Custom Trigger Input Field */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-3.5 py-2.5 text-xs font-mono rounded-xl cursor-pointer select-none transition-all flex items-center justify-between border ${
                    isOpen
                        ? "bg-black/80 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.25)] text-white"
                        : "bg-black/60 border-white/10 hover:border-cyan-500/40 text-gray-200"
                }`}
            >
                <div className="flex items-center gap-2.5">
                    <CalendarIcon className={`w-4 h-4 transition-colors ${isOpen ? "text-cyan-400" : "text-gray-400"}`} />
                    <span className="font-semibold tracking-wider">{formattedDisplay()}</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded">
                        CALENDAR
                    </span>
                </div>
            </div>

            {/* Hidden native input for required form validation */}
            <input
                type="text"
                required={required}
                value={value}
                onChange={() => {}}
                className="sr-only"
                tabIndex={-1}
            />

            {/* Custom Cyber Calendar Dropdown Popover */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-2 z-50 w-full sm:w-[340px] bg-[#070b14]/95 backdrop-blur-2xl border border-cyan-500/35 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.9),0_0_25px_rgba(0,240,255,0.2)] p-4"
                    >
                        {/* Tech Corner Brackets */}
                        <div className="cyber-corner-tl" />
                        <div className="cyber-corner-br" />

                        {/* Calendar Header */}
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                            <button
                                type="button"
                                onClick={prevMonth}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-gray-400 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/30 transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            <div className="flex flex-col items-center">
                                <span className="font-mono text-sm font-bold text-white tracking-wider">
                                    {MONTHS[viewMonth]} {viewYear}
                                </span>
                                <span className="text-[9px] font-mono text-cyan-400 tracking-widest uppercase">
                                    TELEMETRY DATEPICKER
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={nextMonth}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-gray-400 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/30 transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Days of Week */}
                        <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                            {DAYS_OF_WEEK.map((day, idx) => (
                                <span
                                    key={day}
                                    className={`text-[10px] font-mono font-bold py-1 ${
                                        idx === 0 || idx === 6 ? "text-cyan-400/70" : "text-gray-400"
                                    }`}
                                >
                                    {day}
                                </span>
                            ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {/* Previous Month Padding */}
                            {prevDays.map((day, idx) => (
                                <div
                                    key={`prev-${idx}`}
                                    className="h-8 flex items-center justify-center text-[11px] font-mono text-gray-700 select-none"
                                >
                                    {day}
                                </div>
                            ))}

                            {/* Current Month Active Days */}
                            {currentDays.map((day) => {
                                const selected = isSelected(day);
                                const today = isToday(day);
                                return (
                                    <button
                                        type="button"
                                        key={`curr-${day}`}
                                        onClick={() => selectDay(day)}
                                        className={`h-8 rounded-lg text-xs font-mono font-bold transition-all relative flex items-center justify-center ${
                                            selected
                                                ? "bg-cyan-400 text-black shadow-[0_0_12px_rgba(0,240,255,0.7)] scale-105"
                                                : today
                                                ? "border border-cyan-400 text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20"
                                                : "text-gray-300 hover:bg-white/10 hover:text-white"
                                        }`}
                                    >
                                        {day}
                                        {today && !selected && (
                                            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-cyan-400" />
                                        )}
                                    </button>
                                );
                            })}

                            {/* Next Month Padding */}
                            {nextDays.map((day, idx) => (
                                <div
                                    key={`next-${idx}`}
                                    className="h-8 flex items-center justify-center text-[11px] font-mono text-gray-700 select-none"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Footer Actions */}
                        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={setToday}
                                className="px-3 py-1 text-[10px] font-mono font-bold tracking-wider text-cyan-300 hover:text-black bg-cyan-500/10 hover:bg-cyan-400 border border-cyan-500/30 rounded-lg transition-all"
                            >
                                SET TO TODAY
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="text-[10px] font-mono text-gray-400 hover:text-white px-2 py-1 transition-colors"
                            >
                                CLOSE
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
