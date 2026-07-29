"use client";

import React from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import { useLayoutBg, getBgStyle } from "@/components/layout-bg-provider";

export function DashboardInset({ children }: { children: React.ReactNode }) {
  const { activeConfig } = useLayoutBg();
  const bgStyle = getBgStyle(activeConfig);

  return (
    <SidebarInset
      style={bgStyle}
      className="flex flex-col bg-white/70 dark:bg-background/70 backdrop-blur-md border border-zinc-300 dark:border-zinc-700/80 rounded-xl overflow-hidden shadow-xs m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2 text-zinc-950 dark:text-zinc-50 transition-all duration-300"
    >
      {children}
    </SidebarInset>
  );
}
