"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type CockpitTheme = "cyan-storm" | "ice-fluo" | "racing-blue" | "monster-energy";

export interface ThemeConfig {
    id: CockpitTheme;
    name: string;
    subname: string;
    primaryHex: string;
    glowHex: string;
    badge: string;
    description: string;
    wheelsColor: string;
}

export const FACTORY_THEMES: Record<CockpitTheme, ThemeConfig> = {
    "cyan-storm": {
        id: "cyan-storm",
        name: "Cyan Storm",
        subname: "Neo-Tokyo Cyber Default",
        primaryHex: "#00f0ff",
        glowHex: "rgba(0, 240, 255, 0.4)",
        badge: "FACTORY DEFAULT",
        description: "Matte Storm Grey chassis crowned with high-voltage neon cyan wheels & dual predator projectors.",
        wheelsColor: "Neon Cyan #00f0ff",
    },
    "ice-fluo": {
        id: "ice-fluo",
        name: "Ice Fluo-Vermillion",
        subname: "Aggressive Streetfighter",
        primaryHex: "#ff3b19",
        glowHex: "rgba(255, 59, 25, 0.45)",
        badge: "FACTORY RACING",
        description: "Ice-Fluo metallic silver tank framed against striking vermillion red-orange aerodynamic wheels.",
        wheelsColor: "Fluo Vermillion #ff3b19",
    },
    "racing-blue": {
        id: "racing-blue",
        name: "Racing Blue",
        subname: "MotoGP Heritage DNA",
        primaryHex: "#2563eb",
        glowHex: "rgba(37, 99, 235, 0.45)",
        badge: "YAMAHA FACTORY GP",
        description: "Pure Yamaha Grand Prix Racing Blue with deep metallic gloss and track-inspired telemetry aesthetics.",
        wheelsColor: "GP Cobalt Blue #2563eb",
    },
    "monster-energy": {
        id: "monster-energy",
        name: "Monster Energy Stealth",
        subname: "Dark Side Blackout",
        primaryHex: "#39ff14",
        glowHex: "rgba(57, 255, 20, 0.45)",
        badge: "SPECIAL EDITION",
        description: "Pitch-black stealth bodywork energized with radioactive Monster Energy neon lime green claws.",
        wheelsColor: "Monster Lime #39ff14",
    },
};

interface ThemeContextType {
    theme: CockpitTheme;
    themeConfig: ThemeConfig;
    setTheme: (theme: CockpitTheme) => void;
    availableThemes: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "mt15_cockpit_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<CockpitTheme>("cyan-storm");

    useEffect(() => {
        try {
            const saved = localStorage.getItem(THEME_STORAGE_KEY) as CockpitTheme | null;
            if (saved && FACTORY_THEMES[saved]) {
                setThemeState(saved);
                document.documentElement.setAttribute("data-theme", saved);
            } else {
                document.documentElement.setAttribute("data-theme", "cyan-storm");
            }
        } catch {
            document.documentElement.setAttribute("data-theme", "cyan-storm");
        }
    }, []);

    const setTheme = (newTheme: CockpitTheme) => {
        setThemeState(newTheme);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        } catch {
            // Ignore storage errors
        }
        document.documentElement.setAttribute("data-theme", newTheme);
    };

    const themeConfig = FACTORY_THEMES[theme] || FACTORY_THEMES["cyan-storm"];
    const availableThemes = Object.values(FACTORY_THEMES);

    return (
        <ThemeContext.Provider value={{ theme, themeConfig, setTheme, availableThemes }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useCockpitTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useCockpitTheme must be used within a ThemeProvider");
    }
    return context;
}
