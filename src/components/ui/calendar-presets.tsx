"use client";

import * as React from "react";
import { format, addDays, isSameDay, parseISO, startOfDay, differenceInCalendarDays } from "date-fns";
import { Calendar as CalendarIcon, AlertCircle, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DateRange } from "react-day-picker";
import { isEffectiveOffDay } from "@/lib/workday-calc";

export type RequestType = "PERMISSION" | "SICK" | "DISPENSATION" | "LEAVE" | "WFH";

interface CalendarPresetsDatePickerProps {
  id?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  onRangeChange?: (range: { startDate: string; endDate: string }) => void;
  requestType?: RequestType;
  placeholder?: string;
  minDate?: Date;
  disabled?: boolean;
  offDaysOfWeek?: number[];
  holidayDates?: string[];
  replacementDates?: string[];
}

export function CalendarPresetsDatePicker({
  id,
  startDate = "",
  endDate = "",
  onRangeChange,
  requestType = "PERMISSION",
  placeholder = "Select date or date range",
  minDate,
  disabled = false,
  offDaysOfWeek = [0, 1], // Default Sunday & Monday off
  holidayDates = [],
  replacementDates = [],
}: CalendarPresetsDatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse today and tomorrow
  const today = React.useMemo(() => startOfDay(new Date()), []);
  const tomorrow = React.useMemo(() => addDays(today, 1), [today]);

  // Transient state for range selection while popover is open
  const [rangeState, setRangeState] = React.useState<DateRange | undefined>(() => {
    if (!startDate) return undefined;
    try {
      const from = parseISO(startDate);
      const to = endDate ? parseISO(endDate) : from;
      return { from, to };
    } catch {
      return undefined;
    }
  });

  // Track whether the user has clicked start date and is currently picking end date
  const [isSelectingRange, setIsSelectingRange] = React.useState(false);

  // Sync rangeState with prop changes when popover opens
  React.useEffect(() => {
    if (open) {
      setIsSelectingRange(false);
      if (startDate) {
        try {
          const from = parseISO(startDate);
          const to = endDate ? parseISO(endDate) : from;
          setRangeState({ from, to });
        } catch {
          setRangeState(undefined);
        }
      } else {
        setRangeState(undefined);
      }
    } else {
      setIsSelectingRange(false);
    }
  }, [open, startDate, endDate]);

  const selectedFromDate = React.useMemo(() => {
    if (rangeState?.from) return rangeState.from;
    if (!startDate) return undefined;
    try {
      return parseISO(startDate);
    } catch {
      return undefined;
    }
  }, [rangeState, startDate]);

  const selectedToDate = React.useMemo(() => {
    if (isSelectingRange) return undefined;
    if (rangeState?.to) return rangeState.to;
    if (!endDate) return selectedFromDate;
    try {
      return parseISO(endDate);
    } catch {
      return selectedFromDate;
    }
  }, [rangeState, isSelectingRange, endDate, selectedFromDate]);

  // Determine if 'Today' preset is disabled for the chosen request type
  const isTodayDisabled = React.useMemo(() => {
    if (requestType === "PERMISSION" || requestType === "LEAVE") {
      return true; // Minimum H-1 required
    }
    return false;
  }, [requestType]);

  // Determine if 'Tomorrow' preset is disabled
  const isTomorrowDisabled = React.useMemo(() => {
    if (requestType === "SICK") {
      return true; // Sick leave can only be requested for Today
    }
    return false;
  }, [requestType]);

  // Custom function to disable dates in the Calendar grid
  const isDateDisabled = React.useCallback(
    (date: Date) => {
      const day = startOfDay(date);

      if (minDate && day < startOfDay(minDate)) {
        return true;
      }

      if (requestType === "SICK") {
        // Sick can ONLY be today
        return !isSameDay(day, today);
      }

      if (requestType === "PERMISSION" || requestType === "LEAVE") {
        // Must be H-1 or later (tomorrow onwards)
        return day < tomorrow;
      }

      // WFH & DISPENSATION: Cannot be in the past
      return day < today;
    },
    [requestType, today, tomorrow, minDate]
  );

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRangeState(undefined);
    setIsSelectingRange(false);
    onRangeChange?.({ startDate: "", endDate: "" });
  };

  const handleSelectPreset = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setRangeState({ from: date, to: date });
    setIsSelectingRange(false);
    onRangeChange?.({ startDate: dateStr, endDate: dateStr });
    setOpen(false);
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (!range || !range.from) {
      setRangeState(undefined);
      setIsSelectingRange(false);
      onRangeChange?.({ startDate: "", endDate: "" });
      return;
    }

    // Single-day constraint for SICK request type
    if (requestType === "SICK") {
      const todayStr = format(today, "yyyy-MM-dd");
      setRangeState({ from: today, to: today });
      setIsSelectingRange(false);
      onRangeChange?.({ startDate: todayStr, endDate: todayStr });
      setOpen(false);
      return;
    }

    if (!isSelectingRange) {
      // 1st click: Sets start date AND end date to the clicked date (1-day selection) immediately!
      const clickedFrom = range.from;
      setRangeState({ from: clickedFrom, to: clickedFrom });
      setIsSelectingRange(true);

      const fromStr = format(clickedFrom, "yyyy-MM-dd");
      onRangeChange?.({ startDate: fromStr, endDate: fromStr });
      // Keep popover open so user can pick a 2nd date for a range if desired!
    } else {
      // 2nd click: End date selected!
      const startD = rangeState?.from || range.from;
      const endD = range.to || range.from;

      let finalFrom = startD;
      let finalTo = endD;
      if (finalFrom > finalTo) {
        finalFrom = endD;
        finalTo = startD;
      }

      setRangeState({ from: finalFrom, to: finalTo });
      setIsSelectingRange(false);

      const fromStr = format(finalFrom, "yyyy-MM-dd");
      const toStr = format(finalTo, "yyyy-MM-dd");
      onRangeChange?.({ startDate: fromStr, endDate: toStr });
      setOpen(false);
    }
  };

  const isTodaySelected =
    selectedFromDate &&
    selectedToDate &&
    isSameDay(selectedFromDate, today) &&
    isSameDay(selectedToDate, today);

  const isTomorrowSelected =
    selectedFromDate &&
    selectedToDate &&
    isSameDay(selectedFromDate, tomorrow) &&
    isSameDay(selectedToDate, tomorrow);

  // Compute trigger button display label
  const displayLabel = React.useMemo(() => {
    if (!startDate) return placeholder;

    try {
      const fromD = parseISO(startDate);
      const fromText = format(fromD, "EEE, dd MMM yyyy");

      if (!endDate || endDate === startDate) {
        return `${fromText} (1 Day)`;
      }

      const toD = parseISO(endDate);
      const toText = format(toD, "EEE, dd MMM yyyy");
      const daysCount = differenceInCalendarDays(toD, fromD) + 1;
      return `${fromText} – ${toText} (${daysCount} Days)`;
    } catch {
      return placeholder;
    }
  }, [startDate, endDate, placeholder]);

  const isStudioOffDay = React.useCallback(
    (date: Date) => {
      return isEffectiveOffDay({
        date,
        offDaysOfWeek,
        holidayDates,
        replacementDates,
      });
    },
    [offDaysOfWeek, holidayDates, replacementDates]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <input type="hidden" id={id ? `${id}-start` : "startDate"} name="startDate" value={startDate} />
      <input type="hidden" id={id ? `${id}-end` : "endDate"} name="endDate" value={endDate || startDate} />
      <PopoverTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-1 text-sm shadow-xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer select-none",
            !startDate && "text-zinc-500 dark:text-zinc-400"
          )}
        >
          <span className="truncate font-normal">{displayLabel}</span>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {startDate && (
              <button
                type="button"
                onClick={handleClear}
                title="Clear date selection"
                className="p-0.5 rounded-full text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
            <CalendarIcon className="size-4 text-zinc-500 dark:text-zinc-400" />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0 overflow-hidden w-full z-50">
        <div className="flex flex-col sm:flex-row border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl shadow-2xl w-full">
          {/* Preset Sidebar - Only Today and Tomorrow */}
          <div className="flex flex-col justify-between gap-3 p-3 border-b sm:border-b-0 sm:border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 shrink-0 min-w-[130px] sm:w-[140px]">
            <div className="flex flex-col gap-3">
              <div>
                <div className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-1.5 px-2">
                  DAYS
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isTodayDisabled}
                    onClick={() => handleSelectPreset(today)}
                    className={cn(
                      "justify-start text-xs h-8 px-2.5 font-normal rounded-md border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-none hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer",
                      isTodaySelected &&
                        "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 border-transparent"
                    )}
                  >
                    {isTodaySelected && <span className="mr-1.5 size-1.5 rounded-full bg-current" />}
                    Today
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isTomorrowDisabled}
                    onClick={() => handleSelectPreset(tomorrow)}
                    className={cn(
                      "justify-start text-xs h-8 px-2.5 font-normal rounded-md border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-none hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer",
                      isTomorrowSelected &&
                        "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 border-transparent"
                    )}
                  >
                    {isTomorrowSelected && <span className="mr-1.5 size-1.5 rounded-full bg-current" />}
                    Tomorrow
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
              {startDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleClear(e)}
                  className="justify-start text-xs h-7 px-2 font-normal text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                >
                  <RotateCcw className="mr-1.5 size-3" />
                  Clear Date
                </Button>
              )}
              {isTodayDisabled && (
                <div className="text-[10px] text-amber-600 dark:text-amber-400 flex items-start gap-1">
                  <AlertCircle className="size-3 shrink-0 mt-0.5" />
                  <span>Today disabled (H-1 notice)</span>
                </div>
              )}
              {requestType === "SICK" && (
                <div className="text-[10px] text-violet-600 dark:text-violet-400 flex items-start gap-1">
                  <AlertCircle className="size-3 shrink-0 mt-0.5" />
                  <span>Sick leave limited to Today</span>
                </div>
              )}
            </div>
          </div>

          {/* Calendar Range View */}
          <div className="p-2 flex-1 flex justify-center items-center">
            <Calendar
              mode="range"
              selected={
                selectedFromDate
                  ? {
                      from: selectedFromDate,
                      to: selectedToDate,
                    }
                  : undefined
              }
              onSelect={handleRangeSelect}
              disabled={isDateDisabled}
              modifiers={{ studioOffDay: isStudioOffDay }}
              className="w-full flex justify-center"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
