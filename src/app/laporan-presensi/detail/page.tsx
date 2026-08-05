import type { Prisma } from "@/generated/prisma/client";
import { requireAnyRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { materializeDailyAlpha } from "@/lib/attendance-alpha";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  formatMonthLabel,
  getMonthRange,
  normalizeReportMonth,
  summarizeAttendanceStatuses,
} from "@/lib/attendance-report";
import { DetailStatisticClient } from "./detail-client";

export const dynamic = "force-dynamic";

export type MetricType =
  | "TOTAL"
  | "ON_TIME"
  | "LATE"
  | "SICK"
  | "ALPHA"
  | "WFH"
  | "LEAVE"
  | "MINUS_WORKDAYS";

function normalizeMetric(val?: string): MetricType {
  const valid: MetricType[] = [
    "TOTAL",
    "ON_TIME",
    "LATE",
    "SICK",
    "ALPHA",
    "WFH",
    "LEAVE",
    "MINUS_WORKDAYS",
  ];
  return valid.includes(val as MetricType) ? (val as MetricType) : "TOTAL";
}

function normalizeMemberStatus(val?: string): "ALL" | "TEAM" | "INTERN" {
  if (val === "TEAM" || val === "INTERN") return val;
  return "ALL";
}

export default async function AttendanceDetailStatPage({
  searchParams,
}: {
  searchParams: Promise<{
    metric?: string;
    month?: string;
    studio?: string;
    memberStatus?: string;
    q?: string;
  }>;
}) {
  const [currentUser, params] = await Promise.all([
    requireAnyRole(["SUPER_ADMIN", "ADMIN"]),
    searchParams,
  ]);

  const metric = normalizeMetric(params.metric);
  const month = normalizeReportMonth(params.month);
  const memberStatus = normalizeMemberStatus(params.memberStatus);
  const searchQuery = (params.q || "").trim();
  const { start, endExclusive } = getMonthRange(month);

  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";

  // Materialize alpha records for current & previous day
  try {
    await materializeDailyAlpha();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await materializeDailyAlpha(yesterday);
  } catch (err) {
    console.error("Auto Alpha materialization failed:", err);
  }

  // Determine selected studio
  let selectedStudioId: string | undefined = undefined;
  if (isSuperAdmin) {
    selectedStudioId =
      params.studio && params.studio !== "all" ? params.studio : undefined;
  } else {
    selectedStudioId = currentUser.defaultStudioId ?? "__unassigned__";
  }

  // Base filter for attendance records
  const baseWhere: Prisma.AttendanceRecordWhereInput = {
    attendanceDate: { gte: start, lt: endExclusive },
    ...(selectedStudioId
      ? {
          OR: [
            { ownerStudioId: selectedStudioId },
            { locationStudioId: selectedStudioId },
          ],
        }
      : {}),
    ...(memberStatus !== "ALL" ? { user: { memberStatus } } : {}),
    ...(searchQuery
      ? {
          user: {
            OR: [
              { name: { contains: searchQuery, mode: "insensitive" } },
              { email: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  };

  // Specific status filter based on metric
  let statusWhere: Prisma.AttendanceRecordWhereInput = {};
  if (metric === "ON_TIME") {
    statusWhere = { status: { in: ["ON_TIME", "PRESENT", "DISPENSATION"] } };
  } else if (metric === "LATE") {
    statusWhere = { status: "LATE" };
  } else if (metric === "SICK") {
    statusWhere = { status: "SICK" };
  } else if (metric === "ALPHA") {
    statusWhere = { status: "ALPHA" };
  } else if (metric === "WFH") {
    statusWhere = { status: "WFH" };
  } else if (metric === "LEAVE") {
    statusWhere = { status: { in: ["LEAVE", "PERMISSION"] } };
  }

  const detailWhere: Prisma.AttendanceRecordWhereInput = {
    ...baseWhere,
    ...statusWhere,
  };

  // Query summaries, records/users, and studios concurrently
  const [
    attendanceGroups,
    minusWorkdaysCount,
    studios,
    attendanceRecords,
    minusWorkdayUsers,
  ] = await Promise.all([
    // Attendance status group counts for quick metric counters
    prisma.attendanceRecord.groupBy({
      by: ["status"],
      where: baseWhere,
      _count: { _all: true },
    }),
    // User count with negative workday balance
    prisma.user.count({
      where: {
        role: { not: "SUPER_ADMIN" },
        accountStatus: "ACTIVE",
        workDayBalance: { lt: 0 },
        ...(selectedStudioId ? { defaultStudioId: selectedStudioId } : {}),
        ...(memberStatus !== "ALL" ? { memberStatus } : {}),
        ...(searchQuery
          ? {
              OR: [
                { name: { contains: searchQuery, mode: "insensitive" } },
                { email: { contains: searchQuery, mode: "insensitive" } },
              ],
            }
          : {}),
      },
    }),
    // Active studios
    prisma.studio.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    // Fetch attendance records if metric != MINUS_WORKDAYS
    metric !== "MINUS_WORKDAYS"
      ? prisma.attendanceRecord.findMany({
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
            isManualCorrection: true,
            mood: true,
            moodNote: true,
            createdAt: true,
            updatedAt: true,
            wfhPlan: true,
            wfhReport: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                memberStatus: true,
                defaultStudio: { select: { name: true } },
              },
            },
            ownerStudio: { select: { name: true } },
            locationStudio: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
    // Fetch user list if metric === MINUS_WORKDAYS
    // Fetch user list if metric === MINUS_WORKDAYS
    metric === "MINUS_WORKDAYS"
      ? prisma.user.findMany({
          where: {
            role: { not: "SUPER_ADMIN" },
            accountStatus: "ACTIVE",
            workDayBalance: { lt: 0 },
            ...(selectedStudioId ? { defaultStudioId: selectedStudioId } : {}),
            ...(memberStatus !== "ALL" ? { memberStatus } : {}),
            ...(searchQuery
              ? {
                  OR: [
                    { name: { contains: searchQuery, mode: "insensitive" } },
                    { email: { contains: searchQuery, mode: "insensitive" } },
                  ],
                }
              : {}),
          },
          orderBy: { workDayBalance: "asc" },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            memberStatus: true,
            workDayBalance: true,
            internProfile: {
              select: {
                startDate: true,
                endDate: true,
              },
            },
            defaultStudio: { select: { name: true } },
            placements: {
              where: { status: "ACTIVE" },
              take: 1,
              select: { studio: { select: { name: true } } },
            },
            attendanceRecords: {
              take: 1,
              orderBy: { attendanceDate: "desc" },
              select: { attendanceDate: true, checkInAt: true, status: true },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const summary = summarizeAttendanceStatuses(attendanceGroups);
  const fullSummary = {
    ...summary,
    minusWorkdays: minusWorkdaysCount,
  };

  const serializedAttendanceRecords = attendanceRecords.map((r) => ({
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
    isManualCorrection: r.isManualCorrection,
    mood: r.mood,
    moodNote: r.moodNote,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    wfhPlan: r.wfhPlan,
    wfhReport: r.wfhReport,
    user: r.user,
    ownerStudio: r.ownerStudio,
    locationStudio: r.locationStudio,
  }));

  const serializedMinusWorkdayUsers = minusWorkdayUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    memberStatus: u.memberStatus,
    workDayBalance: u.workDayBalance,
    internStartDate: u.internProfile?.startDate ? u.internProfile.startDate.toISOString() : null,
    internEndDate: u.internProfile?.endDate ? u.internProfile.endDate.toISOString() : null,
    defaultStudio: u.defaultStudio,
    placementStudio: u.placements[0]?.studio ?? null,
    lastAttendance: u.attendanceRecords[0]
      ? {
          attendanceDate: u.attendanceRecords[0].attendanceDate.toISOString(),
          status: u.attendanceRecords[0].status,
        }
      : null,
  }));

  const currentStudioObj = studios.find((s) => s.id === selectedStudioId);
  const studioLabel =
    !selectedStudioId || selectedStudioId === "all"
      ? "All Studios"
      : currentStudioObj?.name ||
        currentUser.defaultStudio?.name ||
        "Admin Studio";

  const metricTitleMap: Record<MetricType, string> = {
    TOTAL: "Total Attendance",
    ON_TIME: "On Time",
    LATE: "Late",
    SICK: "Sick",
    ALPHA: "Alpha",
    WFH: "WFH",
    LEAVE: "Leave / Permission",
    MINUS_WORKDAYS: "Workday Debt",
  };

  return (
    <DashboardShell
      user={currentUser}
      currentPath="/laporan-presensi"
      badge="Filtered Statistics Details"
      title="Detail & Filtered Statistics"
      description={`Displaying data for ${metricTitleMap[metric] || metric} for ${formatMonthLabel(month)} (${studioLabel}).`}
    >
      <DetailStatisticClient
        currentUser={{
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          defaultStudioId: currentUser.defaultStudioId,
          defaultStudioName: currentUser.defaultStudio?.name ?? null,
        }}
        metric={metric}
        month={month}
        selectedStudio={selectedStudioId || "all"}
        memberStatus={memberStatus}
        searchQuery={searchQuery}
        studios={studios}
        summary={fullSummary}
        attendanceRecords={serializedAttendanceRecords}
        minusWorkdayUsers={serializedMinusWorkdayUsers}
      />
    </DashboardShell>
  );
}
