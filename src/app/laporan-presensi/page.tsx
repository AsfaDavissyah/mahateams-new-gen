import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  HeartPulse,
  Home,
} from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard-shell";
import { AttendanceReportExportClient } from "./export-client";
import { LaporanPresensiTabsClient } from "./laporan-presensi-tabs-client";
import { LaporanPresensiFilterClient } from "./laporan-presensi-filter-client";
import {
  ATTENDANCE_STATUS_COLOR,
  ATTENDANCE_STATUS_LABEL,
  formatMonthLabel,
  getMonthRange,
  normalizeReportMonth,
  summarizeAttendanceStatuses,
} from "@/lib/attendance-report";
import { requireAnyRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { materializeDailyAlpha } from "@/lib/attendance-alpha";

export const dynamic = "force-dynamic";

const FILTERABLE_STATUSES = [
  "ON_TIME",
  "LATE",
  "WFH",
  "SICK",
  "DISPENSATION",
  "LEAVE",
  "ALPHA",
] as const;

function normalizeStatus(value?: string) {
  return FILTERABLE_STATUSES.find((status) => status === value) ?? "ALL";
}

export default async function AttendanceReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; studio?: string; status?: string }>;
}) {
  const [currentUser, params] = await Promise.all([
    requireAnyRole(["SUPER_ADMIN", "ADMIN"]),
    searchParams,
  ]);
  const month = normalizeReportMonth(params.month);
  const status = normalizeStatus(params.status);
  const { start, endExclusive } = getMonthRange(month);

  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";

  // Automatically materialize Alpha records for today and yesterday
  try {
    await materializeDailyAlpha();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await materializeDailyAlpha(yesterday);
  } catch (err) {
    console.error("Auto Alpha materialization failed:", err);
  }

  const selectedStudioId =
    !isSuperAdmin
      ? (currentUser.defaultStudioId ?? "__unassigned__")
      : undefined;

  const baseWhere: Prisma.AttendanceRecordWhereInput = {
    attendanceDate: { gte: start, lt: endExclusive },
    ...(selectedStudioId
      ? {
          OR: [
            { ownerStudioId: selectedStudioId },
            { locationStudioId: selectedStudioId }
          ]
        }
      : {}),
  };

  const detailWhere: Prisma.AttendanceRecordWhereInput = {
    ...baseWhere,
    ...(status !== "ALL" ? { status } : {}),
  };

  const [groups, records, studios] = await Promise.all([
    prisma.attendanceRecord.groupBy({
      by: ["status"],
      where: baseWhere,
      _count: { _all: true },
    }),
    prisma.attendanceRecord.findMany({
      take: 500,
      where: detailWhere,
      orderBy: [{ attendanceDate: "desc" }, { user: { name: "asc" } }],
      select: {
        id: true,
        attendanceDate: true,
        workMode: true,
        status: true,
        checkInAt: true,
        checkOutAt: true,
        lateMinutes: true,
        earlyCheckoutMinutes: true,
        locationValidationStatus: true,
        distanceMeters: true,
        checkInLatitude: true,
        checkInLongitude: true,
        checkOutLatitude: true,
        checkOutLongitude: true,
        isManualCorrection: true,
        mood: true,
        moodNote: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            memberStatus: true,
            currentMood: true,
            workDayBalance: true,
            annualLeaveBalance: true,
            notes: true,
            defaultStudio: { select: { name: true } },
            internProfile: {
              select: {
                program: true,
                institution: true,
                startDate: true,
                endDate: true,
                mentor: { select: { name: true } },
              },
            },
            attendanceRecords: {
              orderBy: [{ attendanceDate: "desc" }, { createdAt: "desc" }],
              select: {
                id: true,
                attendanceDate: true,
                workMode: true,
                status: true,
                checkInAt: true,
                checkOutAt: true,
                lateMinutes: true,
                mood: true,
              },
            },
          },
        },
        createdBy: { select: { name: true } },
        ownerStudio: { select: { name: true } },
        locationStudio: { select: { name: true } },
        wfhPlan: true,
        wfhReport: true,
      },
    }),
    prisma.studio.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const summary = summarizeAttendanceStatuses(groups);
  const metrics = [
    {
      metricKey: "TOTAL",
      label: "Total Attendance",
      value: summary.total,
      icon: ClipboardCheck,
      color: "text-blue-700",
    },
    {
      metricKey: "SICK",
      label: "Sick",
      value: summary.sick,
      icon: HeartPulse,
      color: "text-violet-700",
    },
    {
      metricKey: "LATE",
      label: "Late",
      value: summary.late,
      icon: Clock3,
      color: "text-orange-700",
    },
    {
      metricKey: "ON_TIME",
      label: "On Time",
      value: summary.onTime,
      icon: CheckCircle2,
      color: "text-emerald-700",
    },
    {
      metricKey: "ALPHA",
      label: "Alpha",
      value: summary.alpha,
      icon: AlertTriangle,
      color: "text-red-700",
    },
    {
      metricKey: "WFH",
      label: "WFH",
      value: summary.wfh,
      icon: Home,
      color: "text-sky-700",
    },
  ];

  // Serialize records to match the export component and detail modal expectations
  const serializedRecords = records.map(r => ({
    id: r.id,
    attendanceDate: r.attendanceDate.toISOString(),
    workMode: r.workMode,
    status: r.status,
    checkInAt: r.checkInAt ? r.checkInAt.toISOString() : null,
    checkOutAt: r.checkOutAt ? r.checkOutAt.toISOString() : null,
    lateMinutes: r.lateMinutes,
    earlyCheckoutMinutes: r.earlyCheckoutMinutes,
    locationValidationStatus: r.locationValidationStatus,
    distanceMeters: r.distanceMeters,
    checkInLatitude: r.checkInLatitude,
    checkInLongitude: r.checkInLongitude,
    checkOutLatitude: r.checkOutLatitude,
    checkOutLongitude: r.checkOutLongitude,
    isManualCorrection: r.isManualCorrection,
    mood: r.mood,
    moodNote: r.moodNote,
    user: {
      ...r.user,
      internProfile: r.user.internProfile
        ? {
            program: r.user.internProfile.program,
            institution: r.user.internProfile.institution,
            startDate: r.user.internProfile.startDate.toISOString(),
            endDate: r.user.internProfile.endDate.toISOString(),
            mentorName: r.user.internProfile.mentor?.name ?? null,
          }
        : null,
    },
    createdBy: r.createdBy,
    ownerStudio: r.ownerStudio,
    locationStudio: r.locationStudio,
    wfhPlan: r.wfhPlan,
    wfhReport: r.wfhReport,
  }));

  const studioScope = isSuperAdmin ? "all" : (currentUser.defaultStudioId ?? "all");

  return (
    <DashboardShell
      user={currentUser}
      currentPath="/laporan-presensi"
      badge="PostgreSQL Data"
      title="Attendance Report"
      description={`${formatMonthLabel(month)}. ${
        isSuperAdmin
          ? "Scope can include all studios."
          : `Scope is locked to ${currentUser.defaultStudio?.name ?? "the Admin studio"}.`
      }`}
    >
      {/* CSS @media print helper to hide shell UI */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          aside, header, form, button, .no-print, [data-slot="dialog-portal"] {
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
      `}} />

      <div className="flex flex-col gap-4">
        <Card className="shadow-none">
          <CardContent className="p-4 flex flex-wrap items-end justify-between gap-4">
            <LaporanPresensiFilterClient
              initialMonth={month}
              initialStatus={status}
              filterableStatuses={FILTERABLE_STATUSES}
            />

            <div className="grid gap-1.5 justify-self-end">
              <div className="h-5" />
              <AttendanceReportExportClient
                records={serializedRecords}
                monthLabel={formatMonthLabel(month)}
              />
            </div>
          </CardContent>
        </Card>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const targetUrl = `/laporan-presensi/detail?metric=${metric.metricKey}&month=${month}&studio=${studioScope}`;

          return (
            <Link key={metric.label} href={targetUrl} className="block group">
              <Card className="transition-all duration-150 group-hover:border-blue-300 dark:group-hover:border-blue-800 group-hover:shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Icon className={`size-4 ${metric.color}`} />
                    {metric.label}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-semibold ${metric.color}`}>
                    {metric.value.toLocaleString("id-ID")}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>

      <LaporanPresensiTabsClient
        records={serializedRecords}
        statusColor={ATTENDANCE_STATUS_COLOR}
        statusLabel={ATTENDANCE_STATUS_LABEL}
        studios={studios}
        isSuperAdmin={isSuperAdmin}
      />
      </div>
    </DashboardShell>
  );
}
