import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function isExtraWorkday(attendanceDate: Date, studioId: string): Promise<boolean> {
  const dateObj = new Date(attendanceDate);
  const jsDay = dateObj.getUTCDay();

  const calendarEvent = await prisma.calendarEvent.findFirst({
    where: {
      startDate: { lte: dateObj },
      endDate: { gte: dateObj },
      OR: [{ studioId: null }, { studioId }],
    },
    orderBy: { createdAt: "desc" },
  });

  if (calendarEvent) {
    if (calendarEvent.type === "REPLACEMENT_WORKDAY") return false;
    if (
      calendarEvent.type === "NATIONAL_HOLIDAY" ||
      calendarEvent.type === "COMPANY_LEAVE" ||
      calendarEvent.type === "REGULAR_OFF_DAY"
    ) {
      return true;
    }
  }

  const weeklyRules = await prisma.weeklyWorkRule.findMany({
    where: { studioId },
  });

  if (weeklyRules.length > 0) {
    const dayRule = weeklyRules.find((r: { dayOfWeek: number; isWorkday: boolean }) => r.dayOfWeek === jsDay);
    if (dayRule) {
      return !dayRule.isWorkday;
    }
  }

  return jsDay === 0 || jsDay === 1; // Sun/Mon off
}

async function main() {
  const isApply = process.argv.includes("--apply");
  console.log("=================================================");
  console.log(`WORKDAY BALANCE RECALCULATION ENGINE (${isApply ? "APPLY MODE" : "DRY-RUN MODE"})`);
  console.log("=================================================\n");

  const users = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "MEMBER"] },
      accountStatus: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      email: true,
      memberStatus: true,
      workDayBalance: true,
      annualLeaveBalance: true,
      defaultStudioId: true,
    },
    orderBy: { name: "asc" },
  });

  console.log(`Found ${users.length} active users to evaluate.\n`);

  for (const user of users) {
    const studioId = user.defaultStudioId;
    if (!studioId) continue;

    const [attendanceRecords, attachmentRequests, attachmentCorrections] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          attendanceDate: true,
          status: true,
          checkOutAt: true,
          ownerStudioId: true,
          extraWorkdayBalanceApplied: true,
          absenceBalanceApplied: true,
        },
        orderBy: { attendanceDate: "asc" },
      }),
      prisma.request.findMany({
        where: {
          userId: user.id,
          type: { in: ["SICK", "PERMISSION"] },
          status: "APPROVED",
          attachmentUrl: { not: null },
        },
        select: {
          type: true,
          startDate: true,
          endDate: true,
        },
      }),
      prisma.attendanceCorrection.findMany({
        where: {
          requestedById: user.id,
          status: "APPROVED",
          newStatus: { in: ["SICK", "PERMISSION"] },
          attachmentUrl: { not: null },
        },
        select: {
          newStatus: true,
          attendanceRecord: { select: { attendanceDate: true } },
        },
      }),
    ]);

    let calculatedWorkdayBalance = 0;
    const eventLogs: string[] = [];
    const extraWorkdayRecordIdsToMark: string[] = [];
    const extraWorkdayRecordIdsToUnmark: string[] = [];
    const absenceRecordIdsToMark: string[] = [];
    const absenceRecordIdsToUnmark: string[] = [];

    for (const record of attendanceRecords) {
      const dateStr = record.attendanceDate.toISOString().split("T")[0];
      const isExtra = await isExtraWorkday(record.attendanceDate, record.ownerStudioId || studioId);

      if (record.status === "ALPHA") {
        calculatedWorkdayBalance -= 1;
        if (!record.absenceBalanceApplied) absenceRecordIdsToMark.push(record.id);
        eventLogs.push(`  - [${dateStr}] ALPHA: -1 debt`);
      } else if (record.status === "PERMISSION" || record.status === "SICK") {
        if (record.absenceBalanceApplied) absenceRecordIdsToUnmark.push(record.id);
        const hasRequestAttachment = attachmentRequests.some(
          (req) =>
            req.type === record.status &&
            req.startDate <= record.attendanceDate &&
            req.endDate >= record.attendanceDate,
        );
        const hasCorrectionAttachment = attachmentCorrections.some(
          (correction) =>
            correction.newStatus === record.status &&
            correction.attendanceRecord.attendanceDate.getTime() === record.attendanceDate.getTime(),
        );
        const hasAttachment = hasRequestAttachment || hasCorrectionAttachment;
        if (hasAttachment) {
          eventLogs.push(`  - [${dateStr}] ${record.status} (with attachment): 0 debt`);
        } else {
          calculatedWorkdayBalance -= 1;
          eventLogs.push(`  - [${dateStr}] ${record.status} (no attachment): -1 debt`);
        }
      } else if (record.status === "LEAVE") {
        if (record.absenceBalanceApplied) absenceRecordIdsToUnmark.push(record.id);
        eventLogs.push(`  - [${dateStr}] LEAVE: -1 annual leave`);
      } else if (["PRESENT", "ON_TIME", "LATE"].includes(record.status)) {
        if (record.absenceBalanceApplied) absenceRecordIdsToUnmark.push(record.id);
        if (isExtra && record.checkOutAt) {
          calculatedWorkdayBalance += 1;
          extraWorkdayRecordIdsToMark.push(record.id);
          eventLogs.push(`  - [${dateStr}] EXTRA WORKDAY (${record.status} + checkout): +1 credit`);
        } else if (!isExtra && record.extraWorkdayBalanceApplied) {
          extraWorkdayRecordIdsToUnmark.push(record.id);
        }
      }

      if (
        !["ALPHA", "PERMISSION", "SICK", "LEAVE", "PRESENT", "ON_TIME", "LATE"].includes(
          record.status,
        ) &&
        record.absenceBalanceApplied
      ) {
        absenceRecordIdsToUnmark.push(record.id);
      }
    }

    console.log(`User: ${user.name} (${user.email})`);
    console.log(`  Current Workday Balance    : ${user.workDayBalance}`);
    console.log(`  Recalculated Workday Balance: ${calculatedWorkdayBalance}`);
    console.log(`  Event Breakdown (${eventLogs.length} events):`);
    eventLogs.forEach((log) => console.log(log));

    if (isApply) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          workDayBalance: calculatedWorkdayBalance,
        },
      });

      if (extraWorkdayRecordIdsToMark.length > 0) {
        await prisma.attendanceRecord.updateMany({
          where: { id: { in: extraWorkdayRecordIdsToMark } },
          data: { extraWorkdayBalanceApplied: true },
        });
      }

      if (extraWorkdayRecordIdsToUnmark.length > 0) {
        await prisma.attendanceRecord.updateMany({
          where: { id: { in: extraWorkdayRecordIdsToUnmark } },
          data: { extraWorkdayBalanceApplied: false },
        });
      }

      if (absenceRecordIdsToMark.length > 0) {
        await prisma.attendanceRecord.updateMany({
          where: { id: { in: absenceRecordIdsToMark } },
          data: { absenceBalanceApplied: true },
        });
      }

      if (absenceRecordIdsToUnmark.length > 0) {
        await prisma.attendanceRecord.updateMany({
          where: { id: { in: absenceRecordIdsToUnmark } },
          data: { absenceBalanceApplied: false },
        });
      }

      console.log(`  ==> APPLIED: Updated ${user.name}'s balance to ${calculatedWorkdayBalance}\n`);
    } else {
      console.log(`  ==> DRY-RUN: No changes written to database.\n`);
    }
  }

  console.log("=================================================");
  console.log(isApply ? "RECALCULATION COMPLETE." : "DRY-RUN COMPLETE. Run with --apply to apply changes.");
  console.log("=================================================");
}

main()
  .catch((e) => {
    console.error("Recalculation error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
