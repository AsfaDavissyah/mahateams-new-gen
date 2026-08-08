"use client";

import * as React from "react";
import { format, addDays, isSameDay, parseISO, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type RequestType = "PERMISSION" | "SICK" | "DISPENSATION" | "LEAVE" | "WFH";

interface CalendarPresetsDatePickerProps {
  id?: string;
  name?: string;
  value?: string; // YYYY-MM-DD
  onChange?: (dateStr: string) => void;
  requestType?: RequestType;
  placeholder?: string;
  minDate?: Date;
  isEndDate?: boolean;
  startDateValue?: string;
  disabled?: boolean;
}

export function CalendarPresetsDatePicker({
  id,
  name,
  value,
  onChange,
  requestType = "PERMISSION",
  placeholder = "Select date",
  minDate,
  isEndDate = false,
  startDateValue,
  disabled = false,
}: CalendarPresetsDatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse today and tomorrow in UTC/local start of day
  const today = React.useMemo(() => startOfDay(new Date()), []);
  const tomorrow = React.useMemo(() => addDays(today, 1), [today]);
  const next7Days = React.useMemo(() => addDays(today, 6), [today]);

  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    try {
      return parseISO(value);
    } catch {
      return undefined;
    }
  }, [value]);

  // Determine if 'Today' preset is disabled for the chosen request type
  const isTodayDisabled = React.useMemo(() => {
    if (isEndDate && startDateValue) {
      const start = parseISO(startDateValue);
      if (today < startOfDay(start)) return true;
    }
    if (requestType === "PERMISSION" || requestType === "LEAVE") {
      return true; // Minimum H-1 required
    }
    return false;
  }, [requestType, isEndDate, startDateValue, today]);

  // Determine if 'Tomorrow' preset is disabled
  const isTomorrowDisabled = React.useMemo(() => {
    if (requestType === "SICK") {
      return true; // Sick leave can only be requested for Today
    }
    if (isEndDate && startDateValue) {
      const start = parseISO(startDateValue);
      if (tomorrow < startOfDay(start)) return true;
    }
    return false;
  }, [requestType, isEndDate, startDateValue, tomorrow]);

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

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) {
      onChange?.("");
      setOpen(false);
      return;
    }
    const dateStr = format(date, "yyyy-MM-dd");
    onChange?.(dateStr);
    setOpen(false);
  };

  const isTodaySelected = selectedDate && isSameDay(selectedDate, today);
  const isTomorrowSelected = selectedDate && isSameDay(selectedDate, tomorrow);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <input type="hidden" id={id} name={name} value={value || ""} />
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-1 text-sm shadow-xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
            !value && "text-zinc-500 dark:text-zinc-400"
          )}
        >
          <span className="truncate font-normal">
            {selectedDate ? format(selectedDate, "EEE, dd MMM yyyy") : placeholder}
          </span>
          <CalendarIcon className="ml-2 size-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0 overflow-hidden w-auto">
        <div className="flex flex-col sm:flex-row border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl shadow-xl">
          {/* Preset Sidebar - Inspired by @shadcn-space/calendar-14 */}
          <div className="flex flex-col gap-3 p-3 border-b sm:border-b-0 sm:border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 min-w-[140px]">
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
                  onClick={() => handleSelectDate(today)}
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
                  onClick={() => handleSelectDate(tomorrow)}
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

            {requestType !== "SICK" && (
              <div>
                <div className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-1.5 px-2">
                  QUICK PICK
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectDate(next7Days)}
                  className="justify-start text-xs h-8 px-2.5 font-normal rounded-md border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-none hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  Next 7 days
                </Button>
              </div>
            )}

            {isTodayDisabled && (
              <div className="mt-auto pt-2 border-t border-zinc-200 dark:border-zinc-800/80 text-[10px] text-amber-600 dark:text-amber-400 flex items-start gap-1">
                <AlertCircle className="size-3 shrink-0 mt-0.5" />
                <span>Today disabled (H-1 notice)</span>
              </div>
            )}
            {requestType === "SICK" && (
              <div className="mt-auto pt-2 border-t border-zinc-200 dark:border-zinc-800/80 text-[10px] text-violet-600 dark:text-violet-400 flex items-start gap-1">
                <AlertCircle className="size-3 shrink-0 mt-0.5" />
                <span>Sick leave limited to Today</span>
              </div>
            )}
          </div>

          {/* Calendar View */}
          <div className="p-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelectDate}
              disabled={isDateDisabled}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
