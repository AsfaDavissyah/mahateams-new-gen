import { format, parseISO } from "date-fns";

export interface EffectiveWorkdaysResult {
  workingDays: number;
  offDays: number;
  totalDays: number;
}

/**
 * Calculates effective working days between startDateStr and endDateStr (inclusive),
 * excluding studio weekly off-days (e.g. Sunday=0, Monday=1) and national holidays.
 */
export function calculateEffectiveWorkdays({
  startDateStr,
  endDateStr,
  offDaysOfWeek = [0, 1], // Default: Sunday (0) and Monday (1)
  holidayDates = [],
}: {
  startDateStr: string;
  endDateStr?: string;
  offDaysOfWeek?: number[];
  holidayDates?: string[];
}): EffectiveWorkdaysResult {
  if (!startDateStr) {
    return { workingDays: 0, offDays: 0, totalDays: 0 };
  }

  let start: Date;
  let end: Date;

  try {
    start = parseISO(startDateStr);
    end = endDateStr ? parseISO(endDateStr) : start;
  } catch {
    return { workingDays: 0, offDays: 0, totalDays: 0 };
  }

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return { workingDays: 0, offDays: 0, totalDays: 0 };
  }

  let workingDays = 0;
  let offDays = 0;

  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const dateStr = format(current, "yyyy-MM-dd");

    const isStudioOff = offDaysOfWeek.includes(dayOfWeek);
    const isHoliday = holidayDates.includes(dateStr);

    if (isStudioOff || isHoliday) {
      offDays++;
    } else {
      workingDays++;
    }

    current.setDate(current.getDate() + 1);
  }

  return {
    workingDays,
    offDays,
    totalDays: workingDays + offDays,
  };
}

/**
 * Returns a human-readable duration label for the request form.
 * e.g. "2 Working Days (2 Studio Off-days excluded)"
 */
export function getDurationLabel({
  startDateStr,
  endDateStr,
  offDaysOfWeek = [0, 1],
  holidayDates = [],
}: {
  startDateStr: string;
  endDateStr?: string;
  offDaysOfWeek?: number[];
  holidayDates?: string[];
}): string {
  if (!startDateStr) return "";

  const { workingDays, offDays, totalDays } = calculateEffectiveWorkdays({
    startDateStr,
    endDateStr,
    offDaysOfWeek,
    holidayDates,
  });

  if (totalDays === 0) return "Invalid date range";

  if (workingDays === 0) {
    return `0 Working Days (${offDays} Studio Off-${offDays === 1 ? "day" : "days"} selected)`;
  }

  if (offDays === 0) {
    return `${workingDays} ${workingDays === 1 ? "Working Day" : "Working Days"}`;
  }

  return `${workingDays} ${workingDays === 1 ? "Working Day" : "Working Days"} (${offDays} Studio Off-${
    offDays === 1 ? "day" : "days"
  } excluded)`;
}
