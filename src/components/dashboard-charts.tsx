"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ClipboardList, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type AttendanceSummary = {
  total: number;
  sick: number;
  late: number;
  onTime: number;
  alpha: number;
  wfh: number;
  permission: number;
  leave: number;
};

type TrendPoint = {
  date?: string;
  dateLabel: string;
  onTime?: number;
  late?: number;
  count: number;
};

type Props = {
  summary: AttendanceSummary;
  dailyTrend?: TrendPoint[];
};

const chartConfig = {
  attendance: {
    label: "Attendance",
  },
  onTime: {
    label: "On Time",
    color: "#10b981",
  },
  late: {
    label: "Late",
    color: "#f97316",
  },
} satisfies ChartConfig;

export function DashboardCharts({ summary, dailyTrend }: Props) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");

  // ── 1. Composition Horizontal Bars Calculations ──────────────────────────
  const totalSummary = summary.total;
  const composition = useMemo(() => {
    if (totalSummary === 0) return [];
    const items = [
      { label: "On Time", count: summary.onTime, color: "bg-emerald-500", textColor: "text-emerald-500" },
      { label: "Late", count: summary.late, color: "bg-orange-500", textColor: "text-orange-500" },
      { label: "Sick / Permission / Leave", count: summary.sick + summary.permission + summary.leave, color: "bg-blue-500", textColor: "text-blue-500" },
      { label: "Alpha", count: summary.alpha, color: "bg-red-500", textColor: "text-red-500" },
    ];
    return items.map((item) => ({
      ...item,
      percent: Math.round((item.count / totalSummary) * 100),
    }));
  }, [summary, totalSummary]);

  // ── 2. Filtered Trend Points based on timeRange ─────────────────────────
  const filteredData = useMemo(() => {
    if (!dailyTrend || dailyTrend.length === 0) return [];
    let sliceDays = 7;
    if (timeRange === "30d") sliceDays = 30;
    if (timeRange === "90d") sliceDays = 90;

    return dailyTrend.slice(-sliceDays).map((item) => ({
      date: item.date || item.dateLabel,
      dateLabel: item.dateLabel,
      onTime: item.onTime ?? item.count,
      late: item.late ?? 0,
    }));
  }, [dailyTrend, timeRange]);

  return (
    <div className="grid gap-6 md:grid-cols-2 items-stretch">
      {/* 1. Composition Horizontal Bars Card */}
      <Card className="shadow-none flex flex-col justify-between h-full border border-zinc-200 dark:border-zinc-800">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-zinc-900 dark:text-zinc-50">
            <ClipboardList className="size-4 text-violet-700 dark:text-violet-400" />
            Attendance Status Breakdown
          </CardTitle>
          <CardDescription className="text-xs">
            Status percentage out of {totalSummary} total records
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 py-4 flex-1 flex flex-col justify-center">
          {totalSummary === 0 ? (
            <div className="text-center py-8 text-zinc-400 dark:text-zinc-600 text-xs">
              No attendance status data yet
            </div>
          ) : (
            <div className="space-y-3.5 w-full">
              {composition.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-zinc-600 dark:text-zinc-400">{item.label}</span>
                    <span className={item.textColor}>{item.count} ({item.percent}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Interactive Area Chart Card */}
      <Card className="shadow-none flex flex-col justify-between h-full border border-zinc-200 dark:border-zinc-800">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-zinc-900 dark:text-zinc-50">
              <TrendingUp className="size-4 text-emerald-700 dark:text-emerald-400" />
              Attendance Trend
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Showing On Time vs Late breakdown over time
            </CardDescription>
          </div>

          {/* Interactive Time Range Filter Segment Buttons */}
          <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900 p-0.5 shadow-xs shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setTimeRange("7d")}
              className={`h-7 px-2.5 text-[11px] font-semibold rounded-md transition-all duration-150 cursor-pointer ${
                timeRange === "7d"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs border border-zinc-200/50 dark:border-zinc-700"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeRange("30d")}
              className={`h-7 px-2.5 text-[11px] font-semibold rounded-md transition-all duration-150 cursor-pointer ${
                timeRange === "30d"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs border border-zinc-200/50 dark:border-zinc-700"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeRange("90d")}
              className={`h-7 px-2.5 text-[11px] font-semibold rounded-md transition-all duration-150 cursor-pointer ${
                timeRange === "90d"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs border border-zinc-200/50 dark:border-zinc-700"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              90 Days
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-3 pb-3 px-2 sm:px-4 flex-1 flex flex-col justify-center">
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-zinc-400 dark:text-zinc-600 text-xs">
              Daily trend data is insufficient
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="aspect-auto h-[210px] w-full">
              <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillOnTime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fillLate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800/80" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={28}
                  tickFormatter={(value) => {
                    const dateObj = new Date(value);
                    if (isNaN(dateObj.getTime())) return String(value);
                    return dateObj.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  className="text-[10px] text-zinc-500 font-medium"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  allowDecimals={false}
                  className="text-[10px] text-zinc-500 font-medium"
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        const dateObj = new Date(value);
                        if (isNaN(dateObj.getTime())) return String(value);
                        return dateObj.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });
                      }}
                      indicator="dot"
                    />
                  }
                />
                <Area
                  dataKey="late"
                  type="monotone"
                  fill="url(#fillLate)"
                  stroke="var(--color-late)"
                  stackId="a"
                  strokeWidth={2}
                />
                <Area
                  dataKey="onTime"
                  type="monotone"
                  fill="url(#fillOnTime)"
                  stroke="var(--color-onTime)"
                  stackId="a"
                  strokeWidth={2}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
