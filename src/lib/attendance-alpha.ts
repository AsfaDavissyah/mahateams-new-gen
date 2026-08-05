import "server-only";
import {
  dateOnlyFromKey,
  getDayOfWeek,
  getJakartaDateKey,
  getJakartaMinutes,
  timeToMinutes,
} from "@/lib/attendance-time";
import { prisma } from "@/lib/prisma";

const HOLIDAY_TYPES = ["NATIONAL_HOLIDAY", "COMPANY_LEAVE"] as const;

export async function materializeDailyAlpha(now = new Date()) {
  const dateKey = getJakartaDateKey(now);
  const attendanceDate = dateOnlyFromKey(dateKey);
  const currentMinutes = getJakartaMinutes(now);
  const dayOfWeek = getDayOfWeek(dateKey);

  const [studios, globalHoliday] = await Promise.all([
    prisma.studio.findMany({
      where: { isActive: true },
      select: {
        id: true,
        policies: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { alphaCutoffTime: true },
        },
        weeklyWorkRules: {
          where: { dayOfWeek },
          take: 1,
          select: { isWorkday: true },
        },
        calendarEvents: {
          where: {
            type: { in: [...HOLIDAY_TYPES] },
            startDate: { lte: attendanceDate },
            endDate: { gte: attendanceDate },
          },
          take: 1,
          select: { id: true },
        },
      },
    }),
    prisma.calendarEvent.findFirst({
      where: {
        studioId: null,
        type: { in: [...HOLIDAY_TYPES] },
        startDate: { lte: attendanceDate },
        endDate: { gte: attendanceDate },
      },
      select: { id: true },
    }),
  ]);

  let createdCount = 0;
  let processedStudioCount = 0;

  const todayKey = getJakartaDateKey(new Date());
  const isPastDay = dateKey < todayKey;

  for (const studio of studios) {
    const cutoffMinutes = timeToMinutes(
      studio.policies[0]?.alphaCutoffTime,
      "12:00"
    );

    if (
      (!isPastDay && currentMinutes < cutoffMinutes) ||
      globalHoliday ||
      studio.calendarEvents.length > 0
    ) {
      continue;
    }

    const isDefaultWorkday =
      studio.weeklyWorkRules[0]?.isWorkday ?? false;
    const scheduleFilter = isDefaultWorkday
      ? {
          personalSchedules: {
            none: { workDate: attendanceDate, workMode: "WFH" as const },
          },
        }
      : {
          personalSchedules: {
            some: { workDate: attendanceDate, workMode: "WFO" as const },
          },
        };

    const activePlacementWhere = {
      studioId: studio.id,
      status: "ACTIVE" as const,
      startDate: { lte: attendanceDate },
      OR: [{ endDate: null }, { endDate: { gte: attendanceDate } }],
    };
    const candidateUsers = await prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "MEMBER"] },
        accountStatus: "ACTIVE",
        OR: [
          { defaultStudioId: studio.id },
          { placements: { some: activePlacementWhere } },
        ],
        ...scheduleFilter,
        attendanceRecords: { none: { attendanceDate } },
        requests: {
          none: {
            status: "APPROVED",
            type: { in: ["PERMISSION", "SICK", "DISPENSATION", "LEAVE"] },
            startDate: { lte: attendanceDate },
            endDate: { gte: attendanceDate },
          },
        },
      },
      select: {
        id: true,
        defaultStudioId: true,
        placements: {
          where: {
            status: "ACTIVE",
            startDate: { lte: attendanceDate },
            OR: [{ endDate: null }, { endDate: { gte: attendanceDate } }],
          },
          select: { studioId: true },
          orderBy: { startDate: "desc" },
        },
      },
    });
    const absentUsers = candidateUsers.filter(
      (user) => (user.placements[0]?.studioId ?? user.defaultStudioId) === studio.id,
    );

    if (absentUsers.length === 0) {
      processedStudioCount += 1;
      continue;
    }

    let studioCreatedCount = 0;
    for (const user of absentUsers) {
      const created = await prisma.$transaction(async (tx) => {
        const result = await tx.attendanceRecord.createMany({
          data: {
            userId: user.id,
            attendanceDate,
            ownerStudioId: user.defaultStudioId ?? studio.id,
            locationStudioId: studio.id,
            workMode: "WFO",
            status: "ALPHA",
            locationValidationStatus: "NOT_REQUIRED",
            absenceBalanceApplied: true,
          },
          skipDuplicates: true,
        });
        if (result.count === 0) return false;

        await tx.user.update({
          where: { id: user.id },
          data: { workDayBalance: { decrement: 1 } },
        });
        return true;
      });
      if (created) studioCreatedCount += 1;
    }

    createdCount += studioCreatedCount;
    processedStudioCount += 1;
  }

  return { dateKey, createdCount, processedStudioCount };
}
