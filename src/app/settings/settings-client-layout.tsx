"use client";

import Link from "next/link";
import { User, ShieldCheck, Smile, Palette, Clock, BookOpen, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  superAdminOnly?: boolean;
  nonSuperAdminOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    id: "profile",
    label: "My Profile",
    description: "Personal details & password",
    icon: User,
  },
  {
    id: "security",
    label: "Security & PIN",
    description: "6-digit QR attendance PIN",
    icon: ShieldCheck,
  },
  {
    id: "mood",
    label: "Daily Mood",
    description: "Mood status & daily notes",
    icon: Smile,
    nonSuperAdminOnly: true,
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "Themes & background styles",
    icon: Palette,
  },
  {
    id: "workday",
    label: "Workday Rules",
    description: "Studio schedule & policies",
    icon: Clock,
    superAdminOnly: true,
  },
  {
    id: "help-dialogs",
    label: "Help Rules",
    description: "Help popup dialog content",
    icon: BookOpen,
    superAdminOnly: true,
  },
];

type SettingsClientLayoutProps = {
  isSuperAdmin: boolean;
  activeTab: string;
  profileContent: React.ReactNode;
  workdayContent?: React.ReactNode;
  helpContent?: React.ReactNode;
};

export function SettingsClientLayout({
  isSuperAdmin,
  activeTab,
  profileContent,
  workdayContent,
  helpContent,
}: SettingsClientLayoutProps) {
  const filteredNav = NAV_ITEMS.filter((item) => {
    if (item.superAdminOnly && !isSuperAdmin) return false;
    if (item.nonSuperAdminOnly && isSuperAdmin) return false;
    return true;
  });

  const validActiveTab = filteredNav.some((n) => n.id === activeTab)
    ? activeTab
    : filteredNav[0]?.id ?? "profile";

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      {/* ─── Sidebar Sub-navigation (Desktop sticky sidebar / Mobile scrollable pills) ─── */}
      <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-4">
        {/* Mobile Horizontal Pill Bar */}
        <div className="flex lg:hidden overflow-x-auto gap-1.5 pb-2 scrollbar-none font-sans">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = validActiveTab === item.id;
            return (
              <Link
                key={item.id}
                href={`/settings?tab=${item.id}`}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
                  isActive
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 border-zinc-900 dark:border-zinc-100 shadow-sm"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                )}
              >
                <Icon className={cn("size-3.5", isActive ? "text-white dark:text-zinc-950" : "text-zinc-400")} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Desktop Vertical Navigation Menu */}
        <div className="hidden lg:flex flex-col gap-1 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 p-2 shadow-xs backdrop-blur-xs">
          <div className="px-3 py-2 text-[11px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
            Preferences
          </div>
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = validActiveTab === item.id;
            return (
              <Link
                key={item.id}
                href={`/settings?tab=${item.id}`}
                className={cn(
                  "group flex items-center justify-between p-2.5 rounded-xl transition-all duration-150 text-left border",
                  isActive
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 border-zinc-900 dark:border-zinc-100 shadow-xs"
                    : "bg-transparent text-zinc-700 dark:text-zinc-300 border-transparent hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg transition-colors",
                      isActive
                        ? "bg-white/15 dark:bg-zinc-900/10 text-white dark:text-zinc-950"
                        : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold leading-tight">{item.label}</span>
                    <span
                      className={cn(
                        "text-[10px] mt-0.5 leading-tight",
                        isActive ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-400 dark:text-zinc-500"
                      )}
                    >
                      {item.description}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  className={cn(
                    "size-3.5 opacity-0 transition-opacity group-hover:opacity-100",
                    isActive ? "opacity-100 text-white dark:text-zinc-950" : "text-zinc-400"
                  )}
                />
              </Link>
            );
          })}
        </div>
      </aside>

      {/* ─── Main Active Content Area ─── */}
      <main className="flex-1 w-full min-w-0">
        {validActiveTab === "workday" && workdayContent}
        {validActiveTab === "help-dialogs" && helpContent}
        {validActiveTab !== "workday" && validActiveTab !== "help-dialogs" && profileContent}
      </main>
    </div>
  );
}
