"use client";

import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useLayoutBg, getBgStyle } from "@/components/layout-bg-provider";

export function DashboardShellWrapper({
  defaultOpen,
  children,
}: {
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const { activeConfig } = useLayoutBg();
  const bgStyle = getBgStyle(activeConfig);

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={bgStyle}
      className="transition-all duration-300 min-h-screen"
    >
      {children}
    </SidebarProvider>
  );
}
