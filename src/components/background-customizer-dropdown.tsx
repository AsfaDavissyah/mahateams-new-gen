"use client";

import React, { useState } from "react";
import { Palette, RotateCcw, Sun, Moon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useLayoutBg,
  getBgStyle,
  ModeBgConfig,
} from "@/components/layout-bg-provider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type PresetOption = {
  name: string;
  start: string;
  end: string;
};

type SolidPresetOption = {
  name: string;
  color: string;
  gradientEnd: string;
};

const LIGHT_GRADIENT_PRESETS: PresetOption[] = [
  { name: "Ocean", start: "#e0f2fe", end: "#bae6fd" },
  { name: "Sunset", start: "#fef3c7", end: "#fde68a" },
  { name: "Emerald", start: "#dcfce7", end: "#a7f3d0" },
  { name: "Lavender", start: "#f3e8ff", end: "#e9d5ff" },
  { name: "Rose", start: "#ffe4e6", end: "#fecdd3" },
];

const DARK_GRADIENT_PRESETS: PresetOption[] = [
  { name: "Indigo Night", start: "#0f172a", end: "#1e1b4b" },
  { name: "Cyber Violet", start: "#180227", end: "#311042" },
  { name: "Emerald Dark", start: "#022c22", end: "#064e3b" },
  { name: "Obsidian", start: "#09090b", end: "#18181b" },
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

export function BackgroundCustomizerDropdown() {
  const {
    preferences,
    updateModeConfig,
    resetModeConfig,
    activeMode,
  } = useLayoutBg();

  const [selectedMode, setSelectedMode] = useState<"light" | "dark">(activeMode);
  const [isOpen, setIsOpen] = useState(false);

  const currentConfig: ModeBgConfig = preferences[selectedMode];
  const solidPresets = selectedMode === "dark" ? DARK_SOLID_PRESETS : LIGHT_SOLID_PRESETS;
  const gradientPresets = selectedMode === "dark" ? DARK_GRADIENT_PRESETS : LIGHT_GRADIENT_PRESETS;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-lg border border-zinc-200 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative"
          title="Custom Background Style"
        >
          <Palette className="size-4 text-purple-600 dark:text-purple-400" />
          {currentConfig.type !== "default" && (
            <span className="absolute top-1 right-1 size-2 rounded-full bg-purple-500 ring-2 ring-white dark:ring-zinc-900" />
          )}
          <span className="sr-only">Customize Background</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="size-4 text-purple-500" />
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Custom Background
              </h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => resetModeConfig(selectedMode)}
              className="h-7 px-2 text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              title="Reset current mode background"
            >
              <RotateCcw className="size-3 mr-1" />
              Reset
            </Button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setSelectedMode("light")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
                selectedMode === "light"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
              }`}
            >
              <Sun className="size-3.5 text-amber-500" />
              Light Mode
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode("dark")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
                selectedMode === "dark"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
              }`}
            >
              <Moon className="size-3.5 text-indigo-400" />
              Dark Mode
            </button>
          </div>

          {/* Background Type Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
              Style Type
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(["default", "solid", "gradient"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => updateModeConfig(selectedMode, { type: t })}
                  className={`py-1.5 text-xs font-medium capitalize rounded-md border transition-all ${
                    currentConfig.type === t
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-semibold"
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Solid Color Controls & Swatches */}
          {currentConfig.type === "solid" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-500">
                  Solid Color Presets
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {solidPresets.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() =>
                        updateModeConfig(selectedMode, { solidColor: p.color })
                      }
                      className="px-2 py-1 text-[11px] rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 hover:scale-105 transition-transform bg-white dark:bg-zinc-900 cursor-pointer"
                    >
                      <span
                        className="size-3 rounded-full border border-black/10"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {p.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-zinc-500">
                    Custom Color Value
                  </label>
                  <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
                    {currentConfig.solidColor}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentConfig.solidColor}
                    onChange={(e) =>
                      updateModeConfig(selectedMode, { solidColor: e.target.value })
                    }
                    className="size-8 rounded border border-zinc-200 dark:border-zinc-800 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={currentConfig.solidColor}
                    onChange={(e) =>
                      updateModeConfig(selectedMode, { solidColor: e.target.value })
                    }
                    className="h-8 flex-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Linear Gradient Controls & Presets */}
          {currentConfig.type === "gradient" && (
            <div className="space-y-3">
              {/* Presets (Gradient & Solid Color Options for Gradient Setting) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-500">
                  Solid & Gradient Presets
                </label>
                <div className="flex flex-wrap gap-1.5">
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
                      className="px-2 py-1 text-[11px] rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 hover:scale-105 transition-transform bg-white dark:bg-zinc-900 cursor-pointer"
                      title={`Apply ${p.name} gradient pair`}
                    >
                      <span
                        className="size-3 rounded-full border border-black/10"
                        style={{
                          background: `linear-gradient(135deg, ${p.color}, ${p.gradientEnd})`,
                        }}
                      />
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {p.name}
                      </span>
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
                      className="px-2 py-1 text-[11px] rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 hover:scale-105 transition-transform bg-white dark:bg-zinc-900 cursor-pointer"
                    >
                      <span
                        className="size-3 rounded-full border border-black/10"
                        style={{
                          background: `linear-gradient(135deg, ${p.start}, ${p.end})`,
                        }}
                      />
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {p.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Stops */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-zinc-500">
                    Start Color
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={currentConfig.gradientStart}
                      onChange={(e) =>
                        updateModeConfig(selectedMode, {
                          gradientStart: e.target.value,
                        })
                      }
                      className="size-7 rounded border border-zinc-200 dark:border-zinc-800 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={currentConfig.gradientStart}
                      onChange={(e) =>
                        updateModeConfig(selectedMode, {
                          gradientStart: e.target.value,
                        })
                      }
                      className="h-7 w-full rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-1.5 text-[11px] font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-zinc-500">
                    End Color
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={currentConfig.gradientEnd}
                      onChange={(e) =>
                        updateModeConfig(selectedMode, {
                          gradientEnd: e.target.value,
                        })
                      }
                      className="size-7 rounded border border-zinc-200 dark:border-zinc-800 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={currentConfig.gradientEnd}
                      onChange={(e) =>
                        updateModeConfig(selectedMode, {
                          gradientEnd: e.target.value,
                        })
                      }
                      className="h-7 w-full rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-1.5 text-[11px] font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Angle Control Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <label className="font-medium text-zinc-500">
                    Gradient Angle
                  </label>
                  <span className="font-mono font-semibold text-purple-600 dark:text-purple-400">
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
                    updateModeConfig(selectedMode, {
                      gradientAngle: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full accent-purple-600 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
              {/* Surface Tint Opacity (30%-50%) */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between items-center text-[11px]">
                  <label className="font-medium text-zinc-500">
                    Surface Opacity / Tint
                  </label>
                  <span className="font-mono font-semibold text-purple-600 dark:text-purple-400">
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
                    updateModeConfig(selectedMode, {
                      surfaceOpacity: parseInt(e.target.value) || 40,
                    })
                  }
                  className="w-full accent-purple-600 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Mini Live Preview Canvas */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
              Preview
            </label>
            <div
              className="h-12 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-inner flex items-center justify-center text-xs font-semibold text-zinc-600 dark:text-zinc-400 relative overflow-hidden"
              style={getBgStyle(currentConfig)}
            >
              <div
                className="absolute inset-1.5 rounded bg-white/45 dark:bg-zinc-900/45 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-center text-[11px] font-bold text-zinc-900 dark:text-zinc-100"
                style={{ opacity: (currentConfig.surfaceOpacity ?? 40) / 40 }}
              >
                CARD & SIDEBAR PREVIEW
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
