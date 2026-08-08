import { format, parseISO } from "date-fns";

export interface EffectiveWorkdaysResult {
  workingDays: number;
  offDays: number;
  totalDays: number;
}

/**
 * Determines whether a given date is an effective off-day for a studio.
 * Priority:
 * 1. REPLACEMENT_WORKDAY -> Forced working day (isOff = false)
 * 2. NATIONAL_HOLIDAY / COMPANY_LEAVE / REGULAR_OFF_DAY -> Off day (isOff = true)
 * 3. Studio weekly rules (offDaysOfWeek, 0=Sun, 1=Mon, ..., 6=Sat)
 */
export function isEffectiveOffDay({
  date,
  offDaysOfWeek = [0, 1],
  holidayDates = [],
  replacementDates = [],
}: {
  date: Date;
  offDaysOfWeek?: number[];
  holidayDates?: string[];
  replacementDates?: string[];
}): boolean {
  const dateStr = format(date, "yyyy-MM-dd");

  // 1. Replacement workday overrides everything to be a working day
  if (replacementDates.includes(dateStr)) {
    return false;
  }

  // 2. National holiday or company leave is an off day
  if (holidayDates.includes(dateStr)) {
    return true;
  }

  // 3. Studio weekly off days
  const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const isStudioOff =
    offDaysOfWeek.includes(dayOfWeek) || (dayOfWeek === 0 && offDaysOfWeek.includes(7));

  return isStudioOff;
}

/**
 * Calculates effective working days between startDateStr and endDateStr (inclusive),
 * considering studio weekly off-days, national holidays, and replacement workdays.
 */
export function calculateEffectiveWorkdays({
  startDateStr,
  endDateStr,
  offDaysOfWeek = [0, 1],
  holidayDates = [],
  replacementDates = [],
}: {
  startDateStr: string;
  endDateStr?: string;
  offDaysOfWeek?: number[];
  holidayDates?: string[];
  replacementDates?: string[];
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
    const isOff = isEffectiveOffDay({
      date: current,
      offDaysOfWeek,
      holidayDates,
      replacementDates,
    });

    if (isOff) {
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
 * e.g. "2 Working Days (3 Studio Off-days excluded)"
 */
export function getDurationLabel({
  startDateStr,
  endDateStr,
  offDaysOfWeek = [0, 1],
  holidayDates = [],
  replacementDates = [],
}: {
  startDateStr: string;
  endDateStr?: string;
  offDaysOfWeek?: number[];
  holidayDates?: string[];
  replacementDates?: string[];
}): string {
  if (!startDateStr) return "";

  const { workingDays, offDays, totalDays } = calculateEffectiveWorkdays({
    startDateStr,
    endDateStr,
    offDaysOfWeek,
    holidayDates,
    replacementDates,
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
