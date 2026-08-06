"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AttendanceStatus, Prisma } from "@/generated/prisma/client";
import { requireAnyRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCorrectionBalanceImpact, isExtraWorkday } from "@/lib/workday-balance";

type Reviewer = {
  id: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MEMBER";
  defaultStudioId: string | null;
};

function jakartaTimeOnDate(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(date);
  result.setUTCHours(hours - 7, minutes, 0, 0);
  return result;
}

async function hasAttachmentEvidence(
  tx: Prisma.TransactionClient,
  userId: string,
  attendanceDate: Date,
  status: AttendanceStatus | null,
  excludedCorrectionId?: string,
) {
  if (status !== "SICK" && status !== "PERMISSION") return false;

  const [request, correction] = await Promise.all([
    tx.request.findFirst({
      where: {
        userId,
        type: status,
        status: "APPROVED",
        startDate: { lte: attendanceDate },
        endDate: { gte: attendanceDate },
        attachmentUrl: { not: null },
      },
      select: { id: true },
    }),
    tx.attendanceCorrection.findFirst({
      where: {
        id: excludedCorrectionId ? { not: excludedCorrectionId } : undefined,
        requestedById: userId,
        status: "APPROVED",
        newStatus: status,
        attachmentUrl: { not: null },
        attendanceRecord: { attendanceDate },
      },
      select: { id: true },
    }),
  ]);

  return Boolean(request || correction);
}

async function reviewCorrectionCore(
  correctionId: string,
  approve: boolean,
  reviewer: Reviewer,
) {
  const correction = await prisma.attendanceCorrection.findUnique({
    where: { id: correctionId },
    include: {
      attendanceRecord: {
        include: {
          user: {
            select: {
              role: true,
              memberStatus: true,
              placements: {
                where: { status: "ACTIVE" },
                select: { studioId: true },
              },
            },
          },
        },
      },
    },
  });

  if (!correction) throw new Error("Attendance correction not found.");
  if (correction.status !== "PENDING") {
    throw new Error("This correction has already been reviewed.");
  }

  const record = correction.attendanceRecord;
  const activePlacement = record.user.placements[0];
  const activeStudioId = activePlacement?.studioId ?? record.ownerStudioId;
  const isAuthorized = activeStudioId === reviewer.defaultStudioId;

  if (reviewer.role === "ADMIN" && !isAuthorized) {
    throw new Error("Only the admin of the member's current active studio can review this correction.");
  }
  if (
    reviewer.role === "ADMIN" &&
    (record.user.role === "ADMIN" || record.user.role === "SUPER_ADMIN")
  ) {
    throw new Error("Admins cannot review another administrator's correction.");
  }
  if (
    approve &&
    record.user.memberStatus === "INTERN" &&
    (correction.newStatus === "WFH" || correction.newStatus === "LEAVE")
  ) {
    throw new Error("Interns cannot correct attendance to WFH or Annual Leave.");
  }
  if (
    approve &&
    (correction.newStatus === "SICK" || correction.newStatus === "DISPENSATION") &&
    !correction.attachmentUrl
  ) {
    throw new Error("A supporting document is required for this correction.");
  }

  const correctionDateIsExtraWorkday = approve
    ? await isExtraWorkday(record.attendanceDate, record.ownerStudioId)
    : false;

  await prisma.$transaction(async (tx) => {
    let workdayDelta = 0;
    let annualLeaveDelta = 0;
    const reviewedAt = new Date();

    if (approve && correction.newStatus) {
      const previousHasAttachment = await hasAttachmentEvidence(
        tx,
        correction.requestedById,
        record.attendanceDate,
        correction.previousStatus,
        correction.id,
      );
      const newHasAttachment =
        Boolean(correction.attachmentUrl) ||
        (await hasAttachmentEvidence(
          tx,
          correction.requestedById,
          record.attendanceDate,
          correction.newStatus,
          correction.id,
        ));
      const isPhysical = correction.newStatus === "ON_TIME" || correction.newStatus === "LATE";
      let checkInAt: Date | null = null;
      let checkOutAt: Date | null = null;
      let lateMinutes = 0;

      if (isPhysical) {
        if (!correction.proposedCheckInTime) {
          throw new Error("A proposed check-in time is required for physical attendance.");
        }
        checkInAt = jakartaTimeOnDate(record.attendanceDate, correction.proposedCheckInTime);
        checkOutAt = correction.proposedCheckOutTime
          ? jakartaTimeOnDate(record.attendanceDate, correction.proposedCheckOutTime)
          : record.checkOutAt;

        if (correction.newStatus === "LATE") {
          const policy = await tx.attendancePolicy.findFirst({
            where: { studioId: record.ownerStudioId, isActive: true },
            orderBy: { createdAt: "desc" },
            select: { checkInTime: true },
          });
          const [actualHour, actualMinute] = correction.proposedCheckInTime
            .split(":")
            .map(Number);
          const [policyHour, policyMinute] = (policy?.checkInTime ?? "08:00")
            .split(":")
            .map(Number);
          lateMinutes = Math.max(
            0,
            actualHour * 60 + actualMinute - (policyHour * 60 + policyMinute),
          );
        }
      }

      const newExtraWorkdayApplied = Boolean(
        isPhysical && correctionDateIsExtraWorkday && checkOutAt,
      );
      const impact = getCorrectionBalanceImpact(
        correction.previousStatus,
        correction.newStatus,
        {
          previousHasAttachment,
          newHasAttachment,
          previousExtraWorkdayApplied: record.extraWorkdayBalanceApplied,
          newExtraWorkdayApplied,
          previousAbsenceBalanceApplied: record.absenceBalanceApplied,
        },
      );
      workdayDelta = impact.workdayBalanceDelta;
      annualLeaveDelta = impact.annualLeaveBalanceDelta;

      await tx.attendanceRecord.update({
        where: { id: record.id },
        data: {
          status: correction.newStatus,
          workMode: correction.newStatus === "WFH" ? "WFH" : "WFO",
          isManualCorrection: true,
          checkInAt,
          checkOutAt,
          lateMinutes,
          extraWorkdayBalanceApplied: newExtraWorkdayApplied,
          absenceBalanceApplied: correction.newStatus === "ALPHA",
          ...(correction.newStatus === "WFH" && {
            locationValidationStatus: "NOT_REQUIRED",
          }),
          updatedAt: reviewedAt,
        },
      });

      if (workdayDelta !== 0 || annualLeaveDelta !== 0) {
        await tx.user.update({
          where: { id: correction.requestedById },
          data: {
            ...(workdayDelta !== 0 && {
              workDayBalance: { increment: workdayDelta },
            }),
            ...(annualLeaveDelta !== 0 && {
              annualLeaveBalance: { increment: annualLeaveDelta },
            }),
          },
        });
      }
    }

    await tx.attendanceCorrection.update({
      where: { id: correction.id },
      data: {
        status: approve ? "APPROVED" : "REJECTED",
        approvedById: reviewer.id,
        previousWorkMode: correction.previousWorkMode ?? record.workMode,
        previousCheckInAt: correction.previousCheckInAt ?? record.checkInAt,
        previousCheckOutAt: correction.previousCheckOutAt ?? record.checkOutAt,
        previousLateMinutes: correction.previousLateMinutes ?? record.lateMinutes,
        previousExtraWorkdayBalanceApplied:
          correction.previousExtraWorkdayBalanceApplied ?? record.extraWorkdayBalanceApplied,
        previousAbsenceBalanceApplied:
          correction.previousAbsenceBalanceApplied ?? record.absenceBalanceApplied,
        balanceWorkdayDelta: workdayDelta,
        balanceAnnualLeaveDelta: annualLeaveDelta,
        balanceAppliedAt: approve ? reviewedAt : null,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: reviewer.id,
        entity: "AttendanceCorrection",
        entityId: correction.id,
        action: approve ? "CORRECTION_APPROVED" : "CORRECTION_REJECTED",
        metadata: {
          recordId: record.id,
          userId: correction.requestedById,
          previousStatus: correction.previousStatus,
          newStatus: correction.newStatus,
          workdayBalanceDelta: workdayDelta,
          annualLeaveBalanceDelta: annualLeaveDelta,
        },
      },
    });
  });
}

function revalidateCorrectionViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  revalidatePath("/member");
  revalidatePath("/member/corrections");
  revalidatePath("/member/presensi/riwayat");
  revalidatePath("/laporan-presensi");
}

export async function reviewCorrectionAction(formData: FormData) {
  const reviewer = await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);
  const correctionId = String(formData.get("correctionId") ?? "");
  const action = String(formData.get("action") ?? "");
  if (!correctionId || !["APPROVE", "REJECT"].includes(action)) {
    redirect("/admin/requests?error=invalid-action");
  }

  try {
    await reviewCorrectionCore(correctionId, action === "APPROVE", reviewer);
  } catch (error) {
    console.error("Correction review failed:", error);
    redirect("/admin/requests?error=review-failed");
  }

  revalidateCorrectionViews();
  redirect(`/admin/requests?success=${action.toLowerCase()}`);
}

export async function quickReviewCorrectionAction(correctionId: string, approve: boolean) {
  const reviewer = await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);
  await reviewCorrectionCore(correctionId, approve, reviewer);
  revalidateCorrectionViews();
  return {
    success: true,
    message: `Correction ${approve ? "approved" : "rejected"} successfully.`,
  };
}

export async function deleteCorrectionAction(formData: FormData) {
  const superAdmin = await requireAnyRole(["SUPER_ADMIN"]);
  const correctionId = String(formData.get("correctionId") ?? "");
  if (!correctionId) redirect("/admin/requests?error=invalid-action");

  const correction = await prisma.attendanceCorrection.findUnique({
    where: { id: correctionId },
    include: { attendanceRecord: true },
  });
  if (!correction) redirect("/admin/requests?error=not-found");

  await prisma.$transaction(async (tx) => {
    if (correction.status === "APPROVED" && correction.previousStatus) {
      const hasSnapshot = correction.previousWorkMode !== null;
      await tx.attendanceRecord.update({
        where: { id: correction.attendanceRecordId },
        data: {
          status: correction.previousStatus,
          workMode:
            correction.previousWorkMode ??
            (correction.previousStatus === "WFH" ? "WFH" : "WFO"),
          isManualCorrection: false,
          extraWorkdayBalanceApplied:
            correction.previousExtraWorkdayBalanceApplied ?? false,
          absenceBalanceApplied:
            correction.previousAbsenceBalanceApplied ??
            (correction.previousStatus === "ALPHA"),
          ...(hasSnapshot
            ? {
                checkInAt: correction.previousCheckInAt,
                checkOutAt: correction.previousCheckOutAt,
                lateMinutes: correction.previousLateMinutes ?? 0,
              }
            : correction.previousStatus === "ON_TIME" || correction.previousStatus === "LATE"
              ? {}
              : { checkInAt: null, checkOutAt: null, lateMinutes: 0 }),
          updatedAt: new Date(),
        },
      });

      let workdayDelta = correction.balanceWorkdayDelta;
      let annualLeaveDelta = correction.balanceAnnualLeaveDelta;
      if (!correction.balanceAppliedAt) {
        const previousHasAttachment = await hasAttachmentEvidence(
          tx,
          correction.requestedById,
          correction.attendanceRecord.attendanceDate,
          correction.previousStatus,
          correction.id,
        );
        const newHasAttachment =
          Boolean(correction.attachmentUrl) ||
          (await hasAttachmentEvidence(
            tx,
            correction.requestedById,
            correction.attendanceRecord.attendanceDate,
            correction.newStatus,
            correction.id,
          ));
        const legacyImpact = getCorrectionBalanceImpact(
          correction.previousStatus,
          correction.newStatus,
          { previousHasAttachment, newHasAttachment },
        );
        workdayDelta = legacyImpact.workdayBalanceDelta;
        annualLeaveDelta = legacyImpact.annualLeaveBalanceDelta;
      }

      if (workdayDelta !== 0 || annualLeaveDelta !== 0) {
        await tx.user.update({
          where: { id: correction.requestedById },
          data: {
            ...(workdayDelta !== 0 && {
              workDayBalance: { decrement: workdayDelta },
            }),
            ...(annualLeaveDelta !== 0 && {
              annualLeaveBalance: { decrement: annualLeaveDelta },
            }),
          },
        });
      }
    }

    await tx.attendanceCorrection.delete({ where: { id: correction.id } });
    await tx.auditLog.create({
      data: {
        actorId: superAdmin.id,
        entity: "AttendanceCorrection",
        entityId: correction.id,
        action: "CORRECTION_DELETED",
        metadata: {
          recordId: correction.attendanceRecordId,
          userId: correction.requestedById,
          previousStatus: correction.previousStatus,
          newStatus: correction.newStatus,
          revertedWorkdayBalanceDelta: correction.balanceWorkdayDelta,
          revertedAnnualLeaveBalanceDelta: correction.balanceAnnualLeaveDelta,
        },
      },
    });
  });

  revalidateCorrectionViews();
  redirect("/admin/requests?success=deleted");
}
