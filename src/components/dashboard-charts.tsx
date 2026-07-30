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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    <div className="grid gap-6 md:grid-cols-2">
      {/* 1. Composition Horizontal Bars Card */}
      <Card className="shadow-none flex flex-col justify-between">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-zinc-900 dark:text-zinc-50">
            <ClipboardList className="size-4 text-violet-700 dark:text-violet-400" />
            Attendance Status Breakdown
          </CardTitle>
          <CardDescription>Status percentage out of {totalSummary} total records</CardDescription>
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
      <Card className="shadow-none flex flex-col justify-between">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b border-zinc-100 dark:border-zinc-800 py-3 sm:flex-row">
          <div className="grid flex-1 gap-1 text-center sm:text-left">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-zinc-900 dark:text-zinc-50">
              <TrendingUp className="size-4 text-emerald-700 dark:text-emerald-400" />
              Attendance Trend
            </CardTitle>
            <CardDescription className="text-xs">
              Showing On Time vs Late breakdown over time
            </CardDescription>
          </div>
          <Select value={timeRange} onValueChange={(value) => { if (value) setTimeRange(value as "7d" | "30d" | "90d"); }}>
            <SelectTrigger className="w-[120px] h-8 text-xs font-medium rounded-lg" aria-label="Select time range">
              <SelectValue placeholder="Last 7 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl text-xs">
              <SelectItem value="7d" className="rounded-lg text-xs">Last 7 days</SelectItem>
              <SelectItem value="30d" className="rounded-lg text-xs">Last 30 days</SelectItem>
              <SelectItem value="90d" className="rounded-lg text-xs">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 flex-1 flex flex-col justify-center">
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-zinc-400 dark:text-zinc-600 text-xs">
              Daily trend data is insufficient
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="aspect-auto h-[200px] w-full">
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="fillOnTime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillLate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const dateObj = new Date(value);
                    if (isNaN(dateObj.getTime())) return String(value);
                    return dateObj.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  className="text-[10px] text-zinc-400 font-medium"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  allowDecimals={false}
                  className="text-[10px] text-zinc-400 font-medium"
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
                  type="natural"
                  fill="url(#fillLate)"
                  stroke="#f97316"
                  stackId="a"
                  strokeWidth={2}
                />
                <Area
                  dataKey="onTime"
                  type="natural"
                  fill="url(#fillOnTime)"
                  stroke="#10b981"
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
