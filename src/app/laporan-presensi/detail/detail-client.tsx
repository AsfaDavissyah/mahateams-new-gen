"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Download,
  HeartPulse,
  Home,
  Printer,
  Search,
  ShieldAlert,
  Users,
  Building,
  Info,
  Calendar,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ATTENDANCE_STATUS_COLOR,
  ATTENDANCE_STATUS_LABEL,
  formatMonthLabel,
} from "@/lib/attendance-report";
import type { MetricType } from "./page";

type Props = {
  currentUser: {
    id: string;
    name: string;
    role: string;
    defaultStudioId: string | null;
    defaultStudioName: string | null;
  };
  metric: MetricType;
  month: string;
  selectedStudio: string;
  memberStatus: "ALL" | "TEAM" | "INTERN";
  searchQuery: string;
  studios: Array<{ id: string; name: string }>;
  summary: {
    total: number;
    sick: number;
    dispensation: number;
    late: number;
    onTime: number;
    alpha: number;
    wfh: number;
    permission: number;
    leave: number;
    minusWorkdays: number;
  };
  attendanceRecords: Array<{
    id: string;
    attendanceDate: string;
    workMode: string;
    status: string;
    checkInAt: string | null;
    checkOutAt: string | null;
    lateMinutes: number | null;
    earlyCheckoutMinutes: number | null;
    locationValidationStatus: string;
    distanceMeters: number | null;
    isManualCorrection: boolean;
    mood: string | null;
    moodNote: string | null;
    createdAt: string;
    updatedAt: string;
    wfhPlan: string | null;
    wfhReport: string | null;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      memberStatus: string;
      defaultStudio: { name: string } | null;
    };
    ownerStudio: { name: string } | null;
    locationStudio: { name: string } | null;
  }>;
  minusWorkdayUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    memberStatus: string;
    workDayBalance: number;
    internStartDate: string | null;
    internEndDate: string | null;
    defaultStudio: { name: string } | null;
    placementStudio: { name: string } | null;
    lastAttendance: {
      attendanceDate: string;
      status: string;
    } | null;
  }>;
};

const METRIC_CONFIG: Record<
  MetricType,
  { label: string; icon: any; color: string; bgActive: string }
> = {
  TOTAL: {
    label: "Total Presensi",
    icon: ClipboardCheck,
    color: "text-blue-600 dark:text-blue-400",
    bgActive: "border-blue-500 bg-blue-50/60 dark:bg-blue-950/40",
  },
  SICK: {
    label: "Sakit",
    icon: HeartPulse,
    color: "text-violet-600 dark:text-violet-400",
    bgActive: "border-violet-500 bg-violet-50/60 dark:bg-violet-950/40",
  },
  LATE: {
    label: "Terlambat",
    icon: Clock3,
    color: "text-orange-600 dark:text-orange-400",
    bgActive: "border-orange-500 bg-orange-50/60 dark:bg-orange-950/40",
  },
  ON_TIME: {
    label: "Tepat Waktu",
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bgActive: "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40",
  },
  ALPHA: {
    label: "Alpha (Tidak Hadir)",
    icon: AlertTriangle,
    color: "text-red-600 dark:text-red-400",
    bgActive: "border-red-500 bg-red-50/60 dark:bg-red-950/40",
  },
  WFH: {
    label: "WFH",
    icon: Home,
    color: "text-sky-600 dark:text-sky-400",
    bgActive: "border-sky-500 bg-sky-50/60 dark:bg-sky-950/40",
  },
  LEAVE: {
    label: "Cuti / Izin",
    icon: Calendar,
    color: "text-amber-600 dark:text-amber-400",
    bgActive: "border-amber-500 bg-amber-50/60 dark:bg-amber-950/40",
  },
  MINUS_WORKDAYS: {
    label: "Hutang Hari Kerja",
    icon: ShieldAlert,
    color: "text-rose-600 dark:text-rose-400",
    bgActive: "border-rose-500 bg-rose-50/60 dark:bg-rose-950/40",
  },
};

export function DetailStatisticClient({
  currentUser,
  metric,
  month,
  selectedStudio,
  memberStatus,
  searchQuery,
  studios,
  summary,
  attendanceRecords,
  minusWorkdayUsers,
}: Props) {
  const router = useRouter();
  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";

  const [inputSearch, setInputSearch] = useState(searchQuery);

  const activeConfig = METRIC_CONFIG[metric] || METRIC_CONFIG.TOTAL;
  const ActiveIcon = activeConfig.icon;

  const currentStudioObj = studios.find((s) => s.id === selectedStudio);
  const studioLabel =
    selectedStudio === "all"
      ? "Semua Studio"
      : currentStudioObj?.name ||
        currentUser.defaultStudioName ||
        "Studio Admin";

  // Helper to update URL with new parameters
  const updateParams = (newParams: Partial<{
    metric: MetricType;
    month: string;
    studio: string;
    memberStatus: string;
    q: string;
  }>) => {
    const p = new URLSearchParams();
    p.set("metric", newParams.metric ?? metric);
    p.set("month", newParams.month ?? month);
    p.set("studio", newParams.studio ?? selectedStudio);
    p.set("memberStatus", newParams.memberStatus ?? memberStatus);
    const qVal = newParams.q !== undefined ? newParams.q : searchQuery;
    if (qVal) p.set("q", qVal);

    router.push(`/laporan-presensi/detail?${p.toString()}`);
  };

  // Debounced auto-update for live search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputSearch !== searchQuery) {
        updateParams({ q: inputSearch });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inputSearch, searchQuery]);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (metric === "MINUS_WORKDAYS") {
      const headers = ["Nama", "Email", "Role", "Status Anggota", "Default Studio", "Hutang Hari Kerja (Hari)", "Mulai Intern", "Selesai Intern"];
      const rows = minusWorkdayUsers.map((u) => [
        `"${u.name}"`,
        `"${u.email}"`,
        u.role,
        u.memberStatus,
        `"${u.defaultStudio?.name || "-"}"`,
        Math.abs(u.workDayBalance),
        u.internStartDate ? u.internStartDate.slice(0, 10) : "-",
        u.internEndDate ? u.internEndDate.slice(0, 10) : "-",
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Hutang_Hari_Kerja_${studioLabel}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ["Tanggal", "Nama", "Email", "Status Anggota", "Mode Kerja", "Status", "Jam Masuk", "Jam Keluar", "Terlambat (Menit)", "Rencana WFH / Catatan", "Studio"];
      const rows = attendanceRecords.map((r) => [
        r.attendanceDate.slice(0, 10),
        `"${r.user.name}"`,
        `"${r.user.email}"`,
        r.user.memberStatus,
        r.workMode,
        r.status,
        r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-",
        r.checkOutAt ? new Date(r.checkOutAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-",
        r.lateMinutes ?? 0,
        `"${(r.wfhPlan || r.moodNote || "").replace(/"/g, '""')}"`,
        `"${r.ownerStudio?.name || "-"}"`,
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Presensi_${metric}_${month}_${studioLabel}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const dashboardBackUrl = isSuperAdmin ? "/super-admin" : "/admin";

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          aside, header, form, button, .no-print, nav {
            display: none !important;
          }
          main, div, body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `,
        }}
      />

      <div className="flex flex-col gap-6">
        {/* Navigation & Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <Link
              href="/laporan-presensi"
              className={buttonVariants({ variant: "outline", size: "sm", className: "h-9 gap-1.5" })}
            >
              <ArrowLeft className="size-4" />
              Kembali ke Laporan
            </Link>
            <Link
              href={dashboardBackUrl}
              className={buttonVariants({ variant: "ghost", size: "sm", className: "h-9 text-xs text-muted-foreground" })}
            >
              Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-9 gap-1.5 text-xs"
            >
              <Download className="size-3.5" />
              Ekspor CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="h-9 gap-1.5 text-xs"
            >
              <Printer className="size-3.5" />
              Cetak
            </Button>
          </div>
        </div>

        {/* Quick Metric Selectors Grid */}
        <section className="grid gap-2.5 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 no-print">
          {(
            [
              { key: "TOTAL", count: summary.total },
              { key: "ON_TIME", count: summary.onTime },
              { key: "LATE", count: summary.late },
              { key: "SICK", count: summary.sick },
              { key: "ALPHA", count: summary.alpha },
              { key: "WFH", count: summary.wfh },
              { key: "LEAVE", count: summary.leave },
              { key: "MINUS_WORKDAYS", count: summary.minusWorkdays },
            ] as const
          ).map((m) => {
            const cfg = METRIC_CONFIG[m.key];
            const IconComp = cfg.icon;
            const isActive = metric === m.key;

            return (
              <button
                key={m.key}
                type="button"
                onClick={() => updateParams({ metric: m.key })}
                className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all duration-150 ${
                  isActive
                    ? `${cfg.bgActive} border-2 shadow-sm`
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-medium text-muted-foreground truncate">
                    {cfg.label}
                  </span>
                  <IconComp className={`size-3.5 ${cfg.color}`} />
                </div>
                <span className={`text-xl font-bold ${cfg.color}`}>
                  {m.count}
                </span>
              </button>
            );
          })}
        </section>

        {/* Filter Controls Toolbar */}
        <Card className="shadow-none border border-zinc-200 dark:border-zinc-800 no-print">
          <CardContent className="p-4 flex flex-wrap items-end gap-3 justify-between">
            <div className="flex flex-wrap items-end gap-3 flex-1">
              {/* Month Picker */}
              {metric !== "MINUS_WORKDAYS" && (
                <div className="grid gap-1.5">
                  <label htmlFor="filter-month" className="text-xs font-medium text-muted-foreground">
                    Bulan
                  </label>
                  <input
                    id="filter-month"
                    type="month"
                    value={month}
                    onChange={(e) => updateParams({ month: e.target.value })}
                    className="h-9 rounded-md border border-input bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              )}

              {/* Studio Selector */}
              <div className="grid gap-1.5">
                <label htmlFor="filter-studio" className="text-xs font-medium text-muted-foreground">
                  Cakupan Studio
                </label>
                <select
                  id="filter-studio"
                  value={selectedStudio}
                  disabled={!isSuperAdmin}
                  onChange={(e) => updateParams({ studio: e.target.value })}
                  className="h-9 rounded-md border border-input bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-75"
                >
                  {isSuperAdmin && <option value="all">Semua Studio (Mahative & Kipa)</option>}
                  {studios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                  {!isSuperAdmin && !studios.some(s => s.id === selectedStudio) && (
                    <option value={selectedStudio}>{currentUser.defaultStudioName || "Studio Saya"}</option>
                  )}
                </select>
              </div>

              {/* Member Status Filter */}
              <div className="grid gap-1.5">
                <label htmlFor="filter-member-status" className="text-xs font-medium text-muted-foreground">
                  Status Anggota
                </label>
                <select
                  id="filter-member-status"
                  value={memberStatus}
                  onChange={(e) =>
                    updateParams({
                      memberStatus: e.target.value as "ALL" | "TEAM" | "INTERN",
                    })
                  }
                  className="h-9 rounded-md border border-input bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="ALL">Semua Tipe (Team & Intern)</option>
                  <option value="TEAM">Khusus Team</option>
                  <option value="INTERN">Khusus Intern</option>
                </select>
              </div>

              {/* Search Field */}
              <div className="grid gap-1.5">
                <label htmlFor="filter-search" className="text-xs font-medium text-muted-foreground">
                  Cari Nama / Email
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <input
                    id="filter-search"
                    type="text"
                    placeholder="Cari anggota..."
                    value={inputSearch}
                    onChange={(e) => setInputSearch(e.target.value)}
                    className="h-9 rounded-md border border-input bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 pl-8 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-ring w-48 sm:w-64"
                  />
                  {inputSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setInputSearch("");
                        updateParams({ q: "" });
                      }}
                      className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                      title="Clear search"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {(searchQuery || memberStatus !== "ALL" || (isSuperAdmin && selectedStudio !== "all")) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  updateParams({
                    q: "",
                    memberStatus: "ALL",
                    studio: isSuperAdmin ? "all" : selectedStudio,
                  })
                }
                className="h-9 text-xs text-muted-foreground"
              >
                Reset Filter
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Data Table Section */}
        <Card className="shadow-none border border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ActiveIcon className={`size-5 ${activeConfig.color}`} />
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <span>{activeConfig.label}</span>
                  <Badge variant="outline" className="font-normal text-xs">
                    {metric === "MINUS_WORKDAYS"
                      ? `${minusWorkdayUsers.length} Anggota`
                      : `${attendanceRecords.length} Catatan`}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  {metric === "MINUS_WORKDAYS"
                    ? "Daftar anggota dengan hutang saldo hari kerja (< 0)."
                    : `Data presensi bulan ${formatMonthLabel(month)} untuk ${studioLabel}.`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {metric === "MINUS_WORKDAYS" ? (
              /* Table View for MINUS_WORKDAYS */
              minusWorkdayUsers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Tidak ada anggota dengan saldo hutang hari kerja (minus).
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">#</TableHead>
                      <TableHead>Nama / Email</TableHead>
                      <TableHead>Tipe Anggota</TableHead>
                      <TableHead>Default Studio</TableHead>
                      <TableHead className="text-center">Hutang Hari Kerja</TableHead>
                      <TableHead>Periode Magang (Intern)</TableHead>
                      <TableHead>Presensi Terakhir</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {minusWorkdayUsers.map((user, idx) => {
                      const debtDays = Math.abs(user.workDayBalance);

                      return (
                        <TableRow key={user.id}>
                          <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant={user.memberStatus === "INTERN" ? "secondary" : "outline"}
                                className="text-[10px] uppercase font-semibold"
                              >
                                {user.memberStatus}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{user.role}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {user.defaultStudio?.name || "-"}
                            {user.placementStudio && (
                              <span className="text-muted-foreground block text-[11px]">
                                Penempatan: {user.placementStudio.name}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-900 font-bold px-2.5 py-0.5">
                              -{debtDays} Hari
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {user.memberStatus === "INTERN" && user.internStartDate ? (
                              <span>
                                {user.internStartDate.slice(0, 10)} s/d{" "}
                                {user.internEndDate ? user.internEndDate.slice(0, 10) : "Selesai"}
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {user.lastAttendance ? (
                              <div>
                                <span className="font-medium">
                                  {new Date(user.lastAttendance.attendanceDate).toLocaleDateString("id-ID", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                                <span className="block text-[11px] text-muted-foreground">
                                  Status: {user.lastAttendance.status}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Belum ada</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )
            ) : (
              /* Table View for Attendance Records */
              attendanceRecords.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Tidak ada catatan presensi ditemukan untuk filter ini.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">#</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Anggota</TableHead>
                      <TableHead>Status & Mode</TableHead>
                      <TableHead>Check-In / Out</TableHead>
                      <TableHead>Catatan / Plan</TableHead>
                      <TableHead>Studio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map((r, idx) => {
                      const formattedDate = new Date(r.attendanceDate).toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      });

                      const checkInTime = r.checkInAt
                        ? new Date(r.checkInAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-";

                      const checkOutTime = r.checkOutAt
                        ? new Date(r.checkOutAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-";

                      const badgeColor =
                        ATTENDANCE_STATUS_COLOR[r.status] ||
                        "bg-zinc-100 text-zinc-800";
                      const statusText =
                        ATTENDANCE_STATUS_LABEL[r.status] || r.status;

                      return (
                        <TableRow key={r.id}>
                          <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                          <TableCell className="font-medium text-xs whitespace-nowrap">
                            {formattedDate}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">{r.user.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs text-muted-foreground">{r.user.email}</span>
                              <Badge
                                variant={r.user.memberStatus === "INTERN" ? "secondary" : "outline"}
                                className="text-[9px] uppercase px-1 py-0"
                              >
                                {r.user.memberStatus}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 items-start">
                              <Badge className={`text-xs font-semibold ${badgeColor}`}>
                                {statusText}
                              </Badge>
                              <span className="text-[11px] font-medium text-muted-foreground">
                                Mode: {r.workMode}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            <div>
                              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                In: {checkInTime}
                              </span>
                              {r.lateMinutes && r.lateMinutes > 0 ? (
                                <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold block">
                                  (Terlambat {r.lateMinutes} mnt)
                                </span>
                              ) : null}
                            </div>
                            <div className="text-zinc-600 dark:text-zinc-400">
                              Out: {checkOutTime}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs min-w-[200px] max-w-md whitespace-pre-wrap break-words">
                            {r.wfhPlan && (
                              <div>
                                <span className="font-semibold text-blue-600 dark:text-blue-400">Plan: </span>
                                {r.wfhPlan}
                              </div>
                            )}
                            {r.wfhReport && (
                              <div className="mt-0.5">
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Report: </span>
                                {r.wfhReport}
                              </div>
                            )}
                            {r.moodNote && (
                              <div className="text-muted-foreground italic mt-0.5">
                                "{r.moodNote}"
                              </div>
                            )}
                            {!r.wfhPlan && !r.wfhReport && !r.moodNote && (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-medium whitespace-nowrap">
                            {r.ownerStudio?.name || "-"}
                            {r.locationValidationStatus === "OUTSIDE_RADIUS" && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-semibold">
                                Di Luar Radius
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
