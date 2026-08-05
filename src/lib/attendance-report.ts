import { dateOnlyFromKey, getJakartaDateKey } from "@/lib/attendance-time";

export const ATTENDANCE_STATUS_LABEL: Record<string, string> = {
  PRESENT: "Present",
  ON_TIME: "On Time",
  LATE: "Late",
  WFH: "WFH",
  PERMISSION: "Permission",
  SICK: "Sick",
  DISPENSATION: "Dispensation",
  LEAVE: "Leave",
  ALPHA: "Alpha",
  HOLIDAY: "Holiday",
  OFF_DAY: "Off Day",
};

export const ATTENDANCE_STATUS_COLOR: Record<string, string> = {
  PRESENT: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  ON_TIME: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  LATE: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  WFH: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  PERMISSION: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  SICK: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  DISPENSATION: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  LEAVE: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  ALPHA: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  HOLIDAY: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  OFF_DAY: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export type AttendanceSummary = {
  total: number;
  sick: number;
  dispensation: number;
  late: number;
  onTime: number;
  alpha: number;
  wfh: number;
  permission: number;
  leave: number;
};

export function summarizeAttendanceStatuses(
  groups: Array<{ status: string; _count: { _all: number } }>
): AttendanceSummary {
  const counts = Object.fromEntries(
    groups.map((group) => [group.status, group._count._all])
  );

  return {
    total: groups.reduce((total, group) => total + group._count._all, 0),
    sick: counts.SICK ?? 0,
    dispensation: counts.DISPENSATION ?? 0,
    late: counts.LATE ?? 0,
    onTime: (counts.ON_TIME ?? 0) + (counts.PRESENT ?? 0) + (counts.DISPENSATION ?? 0),
    alpha: counts.ALPHA ?? 0,
    wfh: counts.WFH ?? 0,
    permission: counts.PERMISSION ?? 0,
    leave: (counts.LEAVE ?? 0) + (counts.PERMISSION ?? 0),
  };
}

export function normalizeReportMonth(value?: string) {
  if (value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    return value;
  }

  return getJakartaDateKey().slice(0, 7);
}

export function getMonthRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = dateOnlyFromKey(`${month}-01`);
  const nextMonth = new Date(Date.UTC(year, monthNumber, 1));

  return { start, endExclusive: nextMonth };
}

export function formatMonthLabel(month: string) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(dateOnlyFromKey(`${month}-01`));
}
