"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Megaphone, Calendar, ChevronLeft, ChevronRight, X, List, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type AnnouncementItem = {
  id: string;
  title: string;
  message: string;
  publishAt: Date | string;
  eventDate: Date | string | null;
  priority: number;
};

type Props = {
  announcements: AnnouncementItem[];
};

const STORAGE_KEY = "mahateams_dismissed_announcements";

export function ActiveAnnouncementsClient({ announcements }: Props) {
  const [open, setOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"slide" | "list">("slide");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setDismissedIds(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load dismissed announcements from localStorage:", e);
      }
      setIsLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const activeItems = announcements.filter((a) => !dismissedIds.includes(a.id));

  if (!isLoaded || activeItems.length === 0) return null;

  const formatDate = (dateStr: Date | string | null) => {
    if (!dateStr) return "";
    return new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr));
  };

  const dismissSingle = (id: string) => {
    const next = [...dismissedIds, id];
    setDismissedIds(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Failed to save dismissed announcements:", e);
    }
  };

  const dismissAll = () => {
    const allIds = activeItems.map((a) => a.id);
    const next = Array.from(new Set([...dismissedIds, ...allIds]));
    setDismissedIds(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Failed to save dismissed announcements:", e);
    }
  };

  const safeIndex = Math.min(currentIndex, Math.max(0, activeItems.length - 1));
  const currentItem = activeItems[safeIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : activeItems.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < activeItems.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="relative mb-6 rounded-xl border border-blue-200 bg-blue-50/90 p-4 text-sm text-blue-950 shadow-xs dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200 transition-all">
      {/* Top Bar / Header */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-blue-200/60 dark:border-blue-900/40 pb-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-700 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300 shadow-xs">
            <Megaphone className="size-4" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-blue-950 dark:text-blue-100">Studio Announcements</h3>
            <Badge variant="outline" className="border-blue-300 dark:border-blue-800 bg-blue-100/60 dark:bg-blue-900/40 text-[11px] font-semibold text-blue-800 dark:text-blue-300 px-2 py-0.5">
              {activeItems.length} active
            </Badge>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {activeItems.length > 1 && (
            <>
              {/* View mode toggle */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setViewMode(viewMode === "slide" ? "list" : "slide")}
                className="h-7 px-2 text-[11px] font-medium text-blue-800 dark:text-blue-300 hover:bg-blue-100/80 dark:hover:bg-blue-900/50 cursor-pointer flex items-center gap-1 rounded-md"
                title={viewMode === "slide" ? "Switch to List View" : "Switch to Slide View"}
              >
                {viewMode === "slide" ? (
                  <>
                    <List className="size-3.5" />
                    <span>List View</span>
                  </>
                ) : (
                  <>
                    <Layers className="size-3.5" />
                    <span>Slide View</span>
                  </>
                )}
              </Button>

              {/* Prev / Next controls in slide mode */}
              {viewMode === "slide" && (
                <div className="flex items-center gap-1 border-l border-blue-200/80 dark:border-blue-900/60 pl-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handlePrev}
                    className="size-7 p-0 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer rounded-md"
                    title="Previous announcement"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="text-[11px] font-semibold text-blue-900 dark:text-blue-200 px-1 select-none">
                    {safeIndex + 1} / {activeItems.length}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleNext}
                    className="size-7 p-0 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer rounded-md"
                    title="Next announcement"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Dismiss Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={viewMode === "slide" && currentItem ? () => dismissSingle(currentItem.id) : dismissAll}
            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-100 hover:bg-blue-100/70 dark:hover:bg-blue-900/60 rounded-full cursor-pointer ml-1"
            title="Dismiss announcement"
          >
            <X className="size-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === "slide" && currentItem ? (
        <div className="space-y-1.5 pl-1 sm:pl-12">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              #{safeIndex + 1}
            </span>
            <p className="font-semibold text-blue-950 dark:text-blue-100 text-base leading-snug">
              {currentItem.title}
            </p>
            {currentItem.priority > 0 && (
              <Badge className="bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border-red-200 border text-[9px] font-bold">
                High Priority
              </Badge>
            )}
          </div>

          <p className="text-xs leading-relaxed text-blue-900/80 dark:text-blue-200/80 whitespace-pre-wrap">
            {currentItem.message}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-blue-700/80 dark:text-blue-300/70">
            <div className="flex flex-wrap items-center gap-3">
              <span>Published: {formatDate(currentItem.publishAt)}</span>
              {currentItem.eventDate && (
                <span className="inline-flex items-center gap-1 font-medium text-blue-900 dark:text-blue-200">
                  <Calendar className="size-3 text-blue-600 dark:text-blue-400" />
                  Event: {formatDate(currentItem.eventDate)}
                </span>
              )}
            </div>

            {activeItems.length > 3 && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger
                  render={
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-[11px] text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100 underline underline-offset-2 cursor-pointer"
                    >
                      View all details ({activeItems.length})
                    </Button>
                  }
                />
                <DialogContent className="max-w-lg p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 font-sans max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Megaphone className="size-5 text-blue-700 dark:text-blue-400" />
                      All Active Announcements
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    {activeItems.map((ann, idx) => (
                      <div key={ann.id} className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 space-y-2 relative">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-1.5">
                            <span className="text-blue-600 font-bold">{idx + 1}.</span> {ann.title}
                          </h4>
                          <div className="flex items-center gap-1.5">
                            {ann.priority > 0 && (
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-200 border text-[9px] font-bold">
                                High Priority
                              </Badge>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => dismissSingle(ann.id)}
                              className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                              title="Dismiss this announcement"
                            >
                              <X className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                          {ann.message}
                        </p>
                        <span className="text-[10px] text-zinc-500 block pt-1">
                          Published: {formatDate(ann.publishAt)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <DialogFooter>
                    <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="h-9 text-xs">
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      ) : (
        /* List Mode View */
        <div className="space-y-3 pl-1 sm:pl-12 pt-1">
          {activeItems.map((ann, idx) => (
            <div
              key={ann.id}
              className="group relative rounded-lg border border-blue-200/80 bg-white/70 p-3 shadow-2xs dark:border-blue-900/40 dark:bg-blue-950/40 transition-colors hover:border-blue-300 dark:hover:border-blue-800"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                      {idx + 1}.
                    </span>
                    <h4 className="font-semibold text-blue-950 dark:text-blue-100 text-sm">
                      {ann.title}
                    </h4>
                    {ann.priority > 0 && (
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border-red-200 border text-[9px] font-bold">
                        High Priority
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-blue-900/80 dark:text-blue-200/80 whitespace-pre-wrap">
                    {ann.message}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-blue-700/70 dark:text-blue-300/70">
                    <span>Published: {formatDate(ann.publishAt)}</span>
                    {ann.eventDate && (
                      <span className="inline-flex items-center gap-1 font-medium text-blue-900 dark:text-blue-200">
                        <Calendar className="size-3 text-blue-600 dark:text-blue-400" />
                        Event: {formatDate(ann.eventDate)}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissSingle(ann.id)}
                  className="h-6 w-6 p-0 text-blue-400 hover:text-blue-700 dark:hover:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full cursor-pointer shrink-0"
                  title="Dismiss this announcement"
                >
                  <X className="size-3.5" />
                  <span className="sr-only">Dismiss</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
