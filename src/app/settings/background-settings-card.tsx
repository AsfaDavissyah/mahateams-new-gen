"use client";

import React, { useState } from "react";
import { Palette, RotateCcw, Sun, Moon, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLayoutBg, getBgStyle, ModeBgConfig } from "@/components/layout-bg-provider";

type SolidPresetOption = {
  name: string;
  color: string;
  gradientEnd: string;
};

const LIGHT_GRADIENT_PRESETS = [
  { name: "Ocean Slate", start: "#e0f2fe", end: "#bae6fd" },
  { name: "Warm Sunset", start: "#fef3c7", end: "#fde68a" },
  { name: "Emerald Mist", start: "#dcfce7", end: "#a7f3d0" },
  { name: "Soft Lavender", start: "#f3e8ff", end: "#e9d5ff" },
  { name: "Rose Petal", start: "#ffe4e6", end: "#fecdd3" },
];

const DARK_GRADIENT_PRESETS = [
  { name: "Indigo Night", start: "#0f172a", end: "#1e1b4b" },
  { name: "Cyber Violet", start: "#180227", end: "#311042" },
  { name: "Emerald Dark", start: "#022c22", end: "#064e3b" },
  { name: "Obsidian Slate", start: "#09090b", end: "#18181b" },
  { name: "Deep Crimson", start: "#2a080c", end: "#450a0a" },
];

const LIGHT_SOLID_PRESETS: SolidPresetOption[] = [
  { name: "Slate", color: "#f1f5f9", gradientEnd: "#cbd5e1" },
  { name: "Sky", color: "#e0f2fe", gradientEnd: "#7dd3fc" },
  { name: "Indigo", color: "#e0e7ff", gradientEnd: "#a5b4fc" },
  { name: "Violet", color: "#f3e8ff", gradientEnd: "#c084fc" },
  { name: "Emerald", color: "#dcfce7", gradientEnd: "#86efac" },
  { name: "Amber", color: "#fef3c7", gradientEnd: "#fcd34d" },
  { name: "Rose", color: "#ffe4e6", gradientEnd: "#fda4af" },
];

const DARK_SOLID_PRESETS: SolidPresetOption[] = [
  { name: "Obsidian", color: "#09090b", gradientEnd: "#18181b" },
  { name: "Slate", color: "#0f172a", gradientEnd: "#1e293b" },
  { name: "Indigo", color: "#1e1b4b", gradientEnd: "#312e81" },
  { name: "Violet", color: "#180227", gradientEnd: "#311042" },
  { name: "Emerald", color: "#022c22", gradientEnd: "#065f46" },
  { name: "Crimson", color: "#2a080c", gradientEnd: "#7f1d1d" },
  { name: "Midnight", color: "#0c4a6e", gradientEnd: "#0369a1" },
];

export function BackgroundSettingsCard() {
  const { preferences, updateModeConfig, resetModeConfig, resetAll, activeMode } = useLayoutBg();
  const [selectedMode, setSelectedMode] = useState<"light" | "dark">(activeMode);

  const currentConfig: ModeBgConfig = preferences[selectedMode];
  const solidPresets = selectedMode === "dark" ? DARK_SOLID_PRESETS : LIGHT_SOLID_PRESETS;
  const gradientPresets = selectedMode === "dark" ? DARK_GRADIENT_PRESETS : LIGHT_GRADIENT_PRESETS;

  return (
    <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
              <Palette className="size-5 text-purple-600 dark:text-purple-400" />
              Custom Layout Background
            </CardTitle>
            <CardDescription>
              Customize background colors and linear gradients with angle controls for Light and Dark modes.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetAll}
            className="text-xs h-8 border-zinc-200 dark:border-zinc-800"
          >
            <RotateCcw className="size-3.5 mr-1.5" />
            Reset All
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Mode Switcher Tabs */}
        <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-950 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setSelectedMode("light")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md transition-all ${
              selectedMode === "light"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
            }`}
          >
            <Sun className="size-4 text-amber-500" />
            Light Mode Settings
          </button>

          <button
            type="button"
            onClick={() => setSelectedMode("dark")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md transition-all ${
              selectedMode === "dark"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
            }`}
          >
            <Moon className="size-4 text-indigo-400" />
            Dark Mode Settings
          </button>
        </div>

        {/* Style Type Selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Background Type
          </label>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            {(["default", "solid", "gradient"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => updateModeConfig(selectedMode, { type: t })}
                className={`py-2 text-xs font-medium capitalize rounded-lg border transition-all ${
                  currentConfig.type === t
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-semibold ring-1 ring-purple-500"
                    : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-950"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Solid Color Config & Swatches */}
        {currentConfig.type === "solid" && (
          <div className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Solid Color Presets
              </label>
              <div className="flex flex-wrap gap-2">
                {solidPresets.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => updateModeConfig(selectedMode, { solidColor: p.color })}
                    className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 hover:scale-105 transition-transform bg-zinc-50 dark:bg-zinc-950 cursor-pointer"
                  >
                    <span
                      className="size-3.5 rounded-full border border-black/10"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="text-zinc-700 dark:text-zinc-300">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 max-w-md">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Custom Color Value
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={currentConfig.solidColor}
                  onChange={(e) => updateModeConfig(selectedMode, { solidColor: e.target.value })}
                  className="size-10 rounded border border-zinc-200 dark:border-zinc-800 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={currentConfig.solidColor}
                  onChange={(e) => updateModeConfig(selectedMode, { solidColor: e.target.value })}
                  className="h-10 flex-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>
        )}

        {/* Linear Gradient Config & Presets */}
        {currentConfig.type === "gradient" && (
          <div className="space-y-4 max-w-xl">
            {/* Presets (Gradient & Solid Color Options for Gradient Setting) */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Solid & Gradient Presets
              </label>
              <div className="flex flex-wrap gap-2">
                {/* Solid Presets applied in Gradient mode */}
                {solidPresets.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() =>
                      updateModeConfig(selectedMode, {
                        gradientStart: p.color,
                        gradientEnd: p.gradientEnd,
                      })
                    }
                    className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 hover:scale-105 transition-transform bg-zinc-50 dark:bg-zinc-950 cursor-pointer"
                    title={`Apply ${p.name} gradient pair`}
                  >
                    <span
                      className="size-3.5 rounded-full border border-black/10"
                      style={{ background: `linear-gradient(135deg, ${p.color}, ${p.gradientEnd})` }}
                    />
                    <span className="text-zinc-700 dark:text-zinc-300">{p.name}</span>
                  </button>
                ))}

                {/* Curated Gradient Pairs */}
                {gradientPresets.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() =>
                      updateModeConfig(selectedMode, {
                        gradientStart: p.start,
                        gradientEnd: p.end,
                      })
                    }
                    className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 hover:scale-105 transition-transform bg-zinc-50 dark:bg-zinc-950 cursor-pointer"
                  >
                    <span
                      className="size-3.5 rounded-full border border-black/10"
                      style={{ background: `linear-gradient(135deg, ${p.start}, ${p.end})` }}
                    />
                    <span className="text-zinc-700 dark:text-zinc-300">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Gradient Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Start Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentConfig.gradientStart}
                    onChange={(e) => updateModeConfig(selectedMode, { gradientStart: e.target.value })}
                    className="size-9 rounded border border-zinc-200 dark:border-zinc-800 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={currentConfig.gradientStart}
                    onChange={(e) => updateModeConfig(selectedMode, { gradientStart: e.target.value })}
                    className="h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  End Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentConfig.gradientEnd}
                    onChange={(e) => updateModeConfig(selectedMode, { gradientEnd: e.target.value })}
                    className="size-9 rounded border border-zinc-200 dark:border-zinc-800 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={currentConfig.gradientEnd}
                    onChange={(e) => updateModeConfig(selectedMode, { gradientEnd: e.target.value })}
                    className="h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Gradient Angle Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-medium text-zinc-600 dark:text-zinc-400">
                  Gradient Angle Control
                </label>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400 text-sm">
                  {currentConfig.gradientAngle}&deg;
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={currentConfig.gradientAngle}
                onChange={(e) =>
                  updateModeConfig(selectedMode, { gradientAngle: parseInt(e.target.value) || 0 })
                }
                className="w-full accent-purple-600 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Surface Tint Opacity (30%-50%) */}
            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
              <div className="flex justify-between items-center text-xs">
                <label className="font-medium text-zinc-600 dark:text-zinc-400">
                  Surface Tint Opacity (Sidebar, Navbar & Cards)
                </label>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400 text-sm">
                  {currentConfig.surfaceOpacity ?? 40}%
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="50"
                step="1"
                value={currentConfig.surfaceOpacity ?? 40}
                onChange={(e) =>
                  updateModeConfig(selectedMode, { surfaceOpacity: parseInt(e.target.value) || 40 })
                }
                className="w-full accent-purple-600 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Live Preview Card */}
        <div className="space-y-2 max-w-xl">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Realtime Background Preview ({selectedMode.toUpperCase()} MODE)
          </label>
          <div
            className="h-20 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-center text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-wider relative overflow-hidden"
            style={getBgStyle(currentConfig)}
          >
            <div
              className="absolute inset-2.5 rounded-lg bg-white/45 dark:bg-zinc-900/45 backdrop-blur-md border border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-center text-xs font-bold text-zinc-950 dark:text-zinc-50 shadow-xs"
              style={{ opacity: (currentConfig.surfaceOpacity ?? 40) / 40 }}
            >
              SIDEBAR, NAVBAR & CARD PREVIEW (HIGH CONTRAST TEXT)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
