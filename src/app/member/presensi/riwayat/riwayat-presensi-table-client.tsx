"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, RotateCcw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getJakartaDateKey } from "@/lib/attendance-time";

type AttendanceRecordItem = {
  id: string;
  attendanceDate: Date;
  workMode: string;
  status: string;
  checkInAt: Date | null;
  checkOutAt: Date | null;
  lateMinutes: number;
  earlyCheckoutMinutes: number;
  ownerStudio: { name: string };
  locationStudio: { name: string } | null;
};

type Props = {
  records: AttendanceRecordItem[];
  maxCorrectionDays?: number;
};

const statusLabel: Record<string, string> = {
  PRESENT: "Present",
  ON_TIME: "On Time",
  LATE: "Late",
  WFH: "WFH",
  PERMISSION: "Permission",
  SICK: "Sick",
  LEAVE: "Annual Leave",
  ALPHA: "Alpha",
  HOLIDAY: "Holiday",
  OFF_DAY: "Off Day",
};

const statusColor: Record<string, string> = {
  PRESENT:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60",
  ON_TIME:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60",
  LATE:
    "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/60",
  WFH:
    "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60",
  PERMISSION:
    "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60",
  SICK:
    "bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/60",
  LEAVE:
    "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60",
  ALPHA:
    "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200/60 dark:border-red-800/60",
  HOLIDAY:
    "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700",
  OFF_DAY:
    "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700",
};

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}

function formatTime(date: Date | string | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(date));
}

export function RiwayatPresensiTableClient({ records, maxCorrectionDays = 14 }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [modeFilter, setModeFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<string>("date");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const hasActiveFilters =
    statusFilter !== "ALL" || modeFilter !== "ALL" || searchQuery.trim() !== "";

  const handleResetFilters = () => {
    setStatusFilter("ALL");
    setModeFilter("ALL");
    setSearchQuery("");
  };

  const sortedAndFilteredRecords = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = records;

    if (statusFilter !== "ALL") {
      if (statusFilter === "PRESENT") {
        result = result.filter(
          (r) =>
            r.status === "PRESENT" ||
            r.status === "ON_TIME" ||
            r.status === "DISPENSATION"
        );
      } else {
        result = result.filter((r) => r.status === statusFilter);
      }
    }

    if (modeFilter !== "ALL") {
      result = result.filter((r) => r.workMode === modeFilter);
    }

    if (q) {
      result = result.filter(
        (r) =>
          r.workMode.toLowerCase().includes(q) ||
          statusLabel[r.status]?.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q) ||
          r.ownerStudio.name.toLowerCase().includes(q) ||
          r.locationStudio?.name.toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      if (sortField === "date") {
        aVal = new Date(a.attendanceDate).getTime();
        bVal = new Date(b.attendanceDate).getTime();
      } else if (sortField === "mode") {
        aVal = a.workMode;
        bVal = b.workMode;
      } else if (sortField === "status") {
        aVal = statusLabel[a.status] ?? a.status;
        bVal = statusLabel[b.status] ?? b.status;
      } else if (sortField === "checkIn") {
        aVal = a.checkInAt ? new Date(a.checkInAt).getTime() : 0;
        bVal = b.checkInAt ? new Date(b.checkInAt).getTime() : 0;
      } else if (sortField === "checkOut") {
        aVal = a.checkOutAt ? new Date(a.checkOutAt).getTime() : 0;
        bVal = b.checkOutAt ? new Date(b.checkOutAt).getTime() : 0;
      } else if (sortField === "late") {
        aVal = a.lateMinutes;
        bVal = b.lateMinutes;
      } else if (sortField === "early") {
        aVal = a.earlyCheckoutMinutes;
        bVal = b.earlyCheckoutMinutes;
      } else if (sortField === "studio") {
        aVal = a.ownerStudio.name.toLowerCase();
        bVal = b.ownerStudio.name.toLowerCase();
      } else if (sortField === "location") {
        aVal = (a.locationStudio?.name ?? "").toLowerCase();
        bVal = (b.locationStudio?.name ?? "").toLowerCase();
      }

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [records, searchQuery, statusFilter, modeFilter, sortField, sortAsc]);

  return (
    <div className="space-y-4 min-w-0 w-full max-w-full">
      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 min-w-0 w-full">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5 min-w-0 w-full">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mode, status, or studio..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "ALL")}>
              <SelectTrigger className="h-9 text-xs min-w-[130px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PRESENT">On Time / Present</SelectItem>
                <SelectItem value="LATE">Late</SelectItem>
                <SelectItem value="ALPHA">Alpha</SelectItem>
                <SelectItem value="WFH">WFH</SelectItem>
                <SelectItem value="SICK">Sick</SelectItem>
                <SelectItem value="LEAVE">Annual Leave</SelectItem>
                <SelectItem value="PERMISSION">Permission</SelectItem>
              </SelectContent>
            </Select>

            <Select value={modeFilter} onValueChange={(val) => setModeFilter(val || "ALL")}>
              <SelectTrigger className="h-9 text-xs min-w-[110px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <SelectValue placeholder="All Modes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Modes</SelectItem>
                <SelectItem value="WFO">WFO</SelectItem>
                <SelectItem value="WFH">WFH</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 px-2 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950 min-w-0 w-full max-w-full">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort("date")} className="cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <div className="flex items-center gap-1">
                    Date <ArrowUpDown className="size-3 text-zinc-400" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("mode")} className="cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <div className="flex items-center gap-1">
                    Mode <ArrowUpDown className="size-3 text-zinc-400" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("status")} className="cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <div className="flex items-center gap-1">
                    Status <ArrowUpDown className="size-3 text-zinc-400" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("checkIn")} className="cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <div className="flex items-center gap-1">
                    Check-in <ArrowUpDown className="size-3 text-zinc-400" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("checkOut")} className="cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <div className="flex items-center gap-1">
                    Check-out <ArrowUpDown className="size-3 text-zinc-400" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("late")} className="cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <div className="flex items-center gap-1">
                    Late <ArrowUpDown className="size-3 text-zinc-400" />
                  </div>
                </TableHead>

                <TableHead onClick={() => handleSort("studio")} className="cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <div className="flex items-center gap-1">
                    Default Studio <ArrowUpDown className="size-3 text-zinc-400" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("location")} className="cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <div className="flex items-center gap-1">
                    Location <ArrowUpDown className="size-3 text-zinc-400" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-24 text-center text-sm text-zinc-500"
                  >
                    No attendance records found.
                  </TableCell>
                </TableRow>
              ) : (
                sortedAndFilteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="text-xs font-mono">{formatDate(record.attendanceDate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{record.workMode}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn("text-[10px]", statusColor[record.status])}
                      >
                        {statusLabel[record.status] ?? record.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{formatTime(record.checkInAt)}</TableCell>
                    <TableCell className="text-xs font-mono">{formatTime(record.checkOutAt)}</TableCell>
                    <TableCell className="text-xs">
                      {record.lateMinutes > 0
                        ? `${record.lateMinutes} min`
                        : "-"}
                    </TableCell>

                    <TableCell className="text-xs">{record.ownerStudio.name}</TableCell>
                    <TableCell className="text-xs">
                      {record.locationStudio?.name ?? "No location required"}
                    </TableCell>
                    <TableCell className="text-right">
                      {(() => {
                        const todayKey = getJakartaDateKey(new Date());
                        const todayMidnight = new Date(`${todayKey}T00:00:00.000Z`);
                        const recordDate = new Date(record.attendanceDate);
                        const diffTime = todayMidnight.getTime() - recordDate.getTime();
                        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays >= 0 && diffDays <= maxCorrectionDays) {
                          return (
                            <Link
                              href={`/member/corrections?recordId=${record.id}`}
                              className={cn(
                                buttonVariants({ variant: "outline", size: "sm" }),
                                "h-7 px-2 text-xs"
                              )}
                            >
                              Correction
                            </Link>
                          );
                        }
                        return <span className="text-xs text-zinc-400 dark:text-zinc-500">-</span>;
                      })()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

