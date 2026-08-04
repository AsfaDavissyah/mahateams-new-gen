"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type TocSection = {
  id: string;
  label: string;
  superAdminOnly?: boolean;
  nonSuperAdminOnly?: boolean;
};

export const TOC_SECTIONS: TocSection[] = [
  {
    id: "section-profile",
    label: "My Profile & Account",
  },
  {
    id: "section-security",
    label: "Security PIN",
  },
  {
    id: "section-mood",
    label: "Daily Mood",
    nonSuperAdminOnly: true,
  },
  {
    id: "section-workday",
    label: "Studio Workday Rules",
    superAdminOnly: true,
  },
  {
    id: "section-help-rules",
    label: "Help Rules Popups",
    superAdminOnly: true,
  },
  {
    id: "section-appearance",
    label: "Appearance & Background",
  },
];

type SettingsTocLayoutProps = {
  isSuperAdmin: boolean;
  children: React.ReactNode;
};

export function SettingsTocLayout({ isSuperAdmin, children }: SettingsTocLayoutProps) {
  const [activeId, setActiveId] = useState<string>("section-profile");
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState<boolean>(false);
  const [isMobileCollapsed, setIsMobileCollapsed] = useState<boolean>(true);

  const filteredSections = TOC_SECTIONS.filter((section) => {
    if (section.superAdminOnly && !isSuperAdmin) return false;
    if (section.nonSuperAdminOnly && isSuperAdmin) return false;
    return true;
  });

  const activeIndex = Math.max(0, filteredSections.findIndex((s) => s.id === activeId));
  const activeSection = filteredSections[activeIndex] || filteredSections[0];

  // Track active section reliably via scroll position
  useEffect(() => {
    const handleScroll = () => {
      // Check if user has scrolled to the bottom of the page
      const isAtBottom =
        window.innerHeight + Math.round(window.scrollY) >=
        document.documentElement.scrollHeight - 50;

      if (isAtBottom && filteredSections.length > 0) {
        setActiveId(filteredSections[filteredSections.length - 1].id);
        return;
      }

      const scrollPos = window.scrollY + 140; // Offset below sticky top navbar
      let currentId = filteredSections[0]?.id ?? "section-profile";

      for (const section of filteredSections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            currentId = section.id;
            break;
          } else if (scrollPos >= top) {
            currentId = section.id;
          }
        }
      }

      setActiveId(currentId);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [filteredSections]);

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -110; // Extra clearance below navbar
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveId(id);
      setIsMobileCollapsed(true); // Auto-close mobile accordion on selection
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start w-full relative">
      {/* ─── Mobile Sticky Top Collapsible Accordion (Below Navbar) ─── */}
      <div className="lg:hidden sticky top-20 z-30 w-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm font-sans flex flex-col gap-2">
        <button
          onClick={() => setIsMobileCollapsed(!isMobileCollapsed)}
          className="flex items-center justify-between w-full text-xs font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span>On this page</span>
            <span className="text-zinc-400 dark:text-zinc-500 font-normal">
              • {activeSection?.label}
            </span>
          </div>
          <ChevronUp
            className={cn(
              "size-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200",
              isMobileCollapsed && "rotate-180"
            )}
          />
        </button>

        {!isMobileCollapsed && (
          <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800/80 pl-3.5 flex flex-col gap-0 font-sans mt-2 pt-1">
            {/* Seamless Sliding Accent Line Indicator */}
            <span
              className="absolute -left-[1.5px] w-0.5 bg-blue-600 dark:bg-blue-400 rounded-full shadow-xs transition-all duration-300 ease-out pointer-events-none"
              style={{
                top: `${activeIndex * 36 + 4}px`,
                height: "28px",
              }}
            />

            {filteredSections.map((section) => {
              const isActive = activeId === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToId(section.id)}
                  className={cn(
                    "text-left text-xs transition-colors leading-relaxed cursor-pointer relative flex items-center justify-between group py-2 px-0.5 h-[36px]",
                    isActive
                      ? "text-blue-600 dark:text-blue-400 font-bold"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium"
                  )}
                >
                  <span>{section.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Main Single-Page Settings Content (Left) ─── */}
      <main className="flex-1 w-full min-w-0 flex flex-col gap-8">
        {children}
      </main>

      {/* ─── Desktop Sticky TOC Sidebar (Right) ─── */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-24 self-start">
        <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/75 dark:bg-zinc-900/75 p-4 backdrop-blur-xs shadow-xs transition-all">
          {/* Header with Chevron Toggle matching Reference */}
          <button
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            className="flex items-center justify-between w-full text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-100 cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-blue-600 dark:bg-blue-400" />
              On this page
            </div>
            <ChevronUp
              className={cn(
                "size-4 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-transform duration-200",
                isDesktopCollapsed && "rotate-180"
              )}
            />
          </button>

          {/* Collapsible Outline List */}
          {!isDesktopCollapsed && (
            <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800/80 pl-3.5 flex flex-col gap-0 font-sans mt-1">
              {/* Seamless Sliding Accent Line Indicator Centered 100% on Grey Border */}
              <span
                className="absolute -left-[1.5px] w-0.5 bg-blue-600 dark:bg-blue-400 rounded-full shadow-xs transition-all duration-300 ease-out pointer-events-none"
                style={{
                  top: `${activeIndex * 36 + 4}px`,
                  height: "28px",
                }}
              />

              {filteredSections.map((section) => {
                const isActive = activeId === section.id;

                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToId(section.id)}
                    className={cn(
                      "text-left text-xs transition-colors leading-relaxed cursor-pointer relative flex items-center justify-between group py-2 px-0.5 h-[36px]",
                      isActive
                        ? "text-blue-600 dark:text-blue-400 font-bold"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium"
                    )}
                  >
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
