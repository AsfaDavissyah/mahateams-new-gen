"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ATTENDANCE_STATUS_LABEL } from "@/lib/attendance-report";

type Props = {
  initialMonth: string;
  initialStatus: string;
  filterableStatuses: readonly string[];
};

export function LaporanPresensiFilterClient({
  initialMonth,
  initialStatus,
  filterableStatuses,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (newMonth: string, newStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", newMonth);
    params.set("status", newStatus);
    router.push(`/laporan-presensi?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-end gap-3 flex-1">
      <div className="grid gap-1.5">
        <label htmlFor="report-month" className="text-sm font-medium">
          Month
        </label>
        <input
          id="report-month"
          name="month"
          type="month"
          value={initialMonth}
          onChange={(e) => updateFilter(e.target.value, initialStatus)}
          className="h-9 rounded-md border border-input bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 px-3 text-sm focus:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="report-status" className="text-sm font-medium">
          Detail Status
        </label>
        <select
          id="report-status"
          name="status"
          value={initialStatus}
          onChange={(e) => updateFilter(initialMonth, e.target.value)}
          className="h-9 rounded-md border border-input bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 px-3 text-sm focus:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="ALL">All Statuses</option>
          {filterableStatuses.map((item) => (
            <option key={item} value={item}>
              {ATTENDANCE_STATUS_LABEL[item]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
