"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useTheme } from "next-themes";

export type ModeBgConfig = {
  type: "default" | "solid" | "gradient";
  solidColor: string;
  gradientStart: string;
  gradientEnd: string;
  gradientAngle: number;
  surfaceOpacity: number; // 30 to 50 percent
};

export type LayoutBgPreferences = {
  light: ModeBgConfig;
  dark: ModeBgConfig;
};

export const DEFAULT_BG_PREFERENCES: LayoutBgPreferences = {
  light: {
    type: "default",
    solidColor: "#f8fafc",
    gradientStart: "#3b82f6",
    gradientEnd: "#9333ea",
    gradientAngle: 135,
    surfaceOpacity: 40,
  },
  dark: {
    type: "default",
    solidColor: "#09090b",
    gradientStart: "#1e1b4b",
    gradientEnd: "#311042",
    gradientAngle: 135,
    surfaceOpacity: 40,
  },
};

const STORAGE_KEY = "kolega_layout_bg_config";

type LayoutBgContextType = {
  preferences: LayoutBgPreferences;
  activeConfig: ModeBgConfig;
  updateModeConfig: (mode: "light" | "dark", updates: Partial<ModeBgConfig>) => void;
  resetModeConfig: (mode: "light" | "dark") => void;
  resetAll: () => void;
  activeMode: "light" | "dark";
  isHydrated: boolean;
};

const LayoutBgContext = createContext<LayoutBgContextType | null>(null);

export function LayoutBgProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const activeMode: "light" | "dark" = resolvedTheme === "dark" ? "dark" : "light";

  const [preferences, setPreferences] = useState<LayoutBgPreferences>(DEFAULT_BG_PREFERENCES);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferences({
          light: { ...DEFAULT_BG_PREFERENCES.light, ...(parsed.light || {}) },
          dark: { ...DEFAULT_BG_PREFERENCES.dark, ...(parsed.dark || {}) },
        });
      }
    } catch {
      // Ignore JSON parse error
    }
    setIsHydrated(true);
  }, []);

  const savePreferences = (newPrefs: LayoutBgPreferences) => {
    setPreferences(newPrefs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
    } catch {
      // Ignore quota error
    }
  };

  const updateModeConfig = (mode: "light" | "dark", updates: Partial<ModeBgConfig>) => {
    const updated = {
      ...preferences,
      [mode]: {
        ...preferences[mode],
        ...updates,
      },
    };
    savePreferences(updated);
  };

  const resetModeConfig = (mode: "light" | "dark") => {
    const updated = {
      ...preferences,
      [mode]: { ...DEFAULT_BG_PREFERENCES[mode] },
    };
    savePreferences(updated);
  };

  const resetAll = () => {
    savePreferences(DEFAULT_BG_PREFERENCES);
  };

  const activeConfig = preferences[activeMode];

  return (
    <LayoutBgContext.Provider
      value={{
        preferences,
        activeConfig,
        updateModeConfig,
        resetModeConfig,
        resetAll,
        activeMode,
        isHydrated,
      }}
    >
      {children}
    </LayoutBgContext.Provider>
  );
}

export function useLayoutBg() {
  const context = useContext(LayoutBgContext);
  if (!context) {
    throw new Error("useLayoutBg must be used within a LayoutBgProvider");
  }
  return context;
}

/**
 * Computes exact inline CSS background style object based on ModeBgConfig.
 */
export function getBgStyle(config?: ModeBgConfig): React.CSSProperties {
  if (!config || config.type === "default") {
    return {};
  }

  if (config.type === "solid") {
    return {
      backgroundColor: config.solidColor,
      backgroundImage: "none",
    };
  }

  if (config.type === "gradient") {
    return {
      backgroundImage: `linear-gradient(${config.gradientAngle}deg, ${config.gradientStart}, ${config.gradientEnd})`,
    };
  }

  return {};
}
