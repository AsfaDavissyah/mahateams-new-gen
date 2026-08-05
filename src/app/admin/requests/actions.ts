"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MemberStatus, RequestType } from "@/generated/prisma/client";
import { requireAnyRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRequestBalanceImpact } from "@/lib/workday-balance";

type Reviewer = {
  id: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MEMBER";
  defaultStudioId: string | null;
};

const ATTENDANCE_STATUS_BY_REQUEST = {
  PERMISSION: "PERMISSION",
  SICK: "SICK",
  DISPENSATION: "DISPENSATION",
  LEAVE: "LEAVE",
} as const;

function inclusiveDates(startDate: Date, endDate: Date) {
  const dates: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

function requestBalanceForRange(
  type: RequestType,
  hasAttachment: boolean,
  memberStatus: MemberStatus,
  dayCount: number,
) {
  const impact = getRequestBalanceImpact(type, hasAttachment, memberStatus);
  return {
    workdayDelta: impact.workdayBalanceDelta * dayCount,
    annualLeaveDelta: impact.annualLeaveBalanceDelta * dayCount,
  };
}

async function reviewRequestCore(requestId: string, approve: boolean, reviewer: Reviewer) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      user: {
        select: {
          id: true,
          role: true,
          memberStatus: true,
          defaultStudioId: true,
          placements: {
            where: { status: "ACTIVE" },
            select: { studioId: true, startDate: true, endDate: true },
            orderBy: { startDate: "desc" },
          },
        },
      },
    },
  });

  if (!request) throw new Error("Request not found.");
  if (request.status !== "PENDING") throw new Error("This request has already been reviewed.");

  const isPlacedAtReviewerStudio = request.user.placements.some(
    (placement) => placement.studioId === reviewer.defaultStudioId,
  );
  const isAuthorized =
    request.user.defaultStudioId === reviewer.defaultStudioId || isPlacedAtReviewerStudio;

  if (reviewer.role === "ADMIN" && !isAuthorized) {
    throw new Error("You do not have access to requests from this studio.");
  }
  if (
    reviewer.role === "ADMIN" &&
    (request.user.role === "ADMIN" || request.user.role === "SUPER_ADMIN")
  ) {
    throw new Error("Admins cannot review another administrator's request.");
  }

  const approvedAt = new Date();
  const dates = inclusiveDates(request.startDate, request.endDate);
  const impact = approve
    ? requestBalanceForRange(
        request.type,
        Boolean(request.attachmentUrl),
        request.user.memberStatus,
        dates.length,
      )
    : { workdayDelta: 0, annualLeaveDelta: 0 };

  await prisma.$transaction(async (tx) => {
    await tx.request.update({
      where: { id: request.id },
      data: {
        status: approve ? "APPROVED" : "REJECTED",
        reviewerId: reviewer.id,
        reviewedAt: approvedAt,
        balanceWorkdayDelta: impact.workdayDelta,
        balanceAnnualLeaveDelta: impact.annualLeaveDelta,
        balanceAppliedAt: approve ? approvedAt : null,
      },
    });

    if (approve) {
      if (impact.workdayDelta !== 0 || impact.annualLeaveDelta !== 0) {
        await tx.user.update({
          where: { id: request.userId },
          data: {
            ...(impact.workdayDelta !== 0 && {
              workDayBalance: { increment: impact.workdayDelta },
            }),
            ...(impact.annualLeaveDelta !== 0 && {
              annualLeaveBalance: { increment: impact.annualLeaveDelta },
            }),
          },
        });
      }

      if (!request.user.defaultStudioId) {
        throw new Error("The member's default studio is not configured.");
      }

      for (const attendanceDate of dates) {
        const placement = request.user.placements.find(
          (item) =>
            item.startDate <= attendanceDate &&
            (!item.endDate || item.endDate >= attendanceDate),
        );
        const locationStudioId = placement?.studioId ?? request.user.defaultStudioId;

        if (request.type === "WFH") {
          await tx.personalWorkSchedule.upsert({
            where: {
              userId_workDate: { userId: request.userId, workDate: attendanceDate },
            },
            update: { workMode: "WFH", updatedAt: approvedAt },
            create: { userId: request.userId, workDate: attendanceDate, workMode: "WFH" },
          });
          continue;
        }

        const attendanceStatus =
          ATTENDANCE_STATUS_BY_REQUEST[
            request.type as keyof typeof ATTENDANCE_STATUS_BY_REQUEST
          ];
        if (!attendanceStatus) continue;

        await tx.attendanceRecord.upsert({
          where: {
            userId_attendanceDate: { userId: request.userId, attendanceDate },
          },
          update: {
            status: attendanceStatus,
            checkInAt: null,
            checkOutAt: null,
            workMode: "WFO",
            ownerStudioId: request.user.defaultStudioId,
            locationStudioId,
            locationValidationStatus: "NOT_REQUIRED",
            lateMinutes: 0,
            updatedAt: approvedAt,
          },
          create: {
            userId: request.userId,
            attendanceDate,
            ownerStudioId: request.user.defaultStudioId,
            locationStudioId,
            workMode: "WFO",
            status: attendanceStatus,
            locationValidationStatus: "NOT_REQUIRED",
            lateMinutes: 0,
            createdById: reviewer.id,
          },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        actorId: reviewer.id,
        entity: "Request",
        entityId: request.id,
        action: approve ? "REQUEST_APPROVED" : "REQUEST_REJECTED",
        metadata: {
          userId: request.userId,
          type: request.type,
          startDate: request.startDate,
          endDate: request.endDate,
          workdayBalanceDelta: impact.workdayDelta,
          annualLeaveBalanceDelta: impact.annualLeaveDelta,
        },
      },
    });
  });
}

function revalidateRequestViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  revalidatePath("/member");
  revalidatePath("/member/requests");
  revalidatePath("/laporan-presensi");
}

export async function reviewRequestAction(formData: FormData) {
  const reviewer = await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);
  const requestId = String(formData.get("requestId") ?? "");
  const action = String(formData.get("action") ?? "");

  if (!requestId || !["APPROVE", "REJECT"].includes(action)) {
    redirect("/admin/requests?error=invalid-action");
  }

  try {
    await reviewRequestCore(requestId, action === "APPROVE", reviewer);
  } catch (error) {
    console.error("Request review failed:", error);
    redirect("/admin/requests?error=review-failed");
  }

  revalidateRequestViews();
  redirect(`/admin/requests?success=${action.toLowerCase()}`);
}

export async function quickReviewRequestAction(requestId: string, approve: boolean) {
  const reviewer = await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);
  await reviewRequestCore(requestId, approve, reviewer);
  revalidateRequestViews();
  return {
    success: true,
    message: `Request ${approve ? "approved" : "rejected"} successfully.`,
  };
}

export async function deleteRequestAction(formData: FormData) {
  const superAdmin = await requireAnyRole(["SUPER_ADMIN"]);
  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId) redirect("/admin/requests?error=invalid-action");

  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { user: { select: { memberStatus: true } } },
  });
  if (!request) redirect("/admin/requests?error=not-found");

  await prisma.$transaction(async (tx) => {
    if (request.status === "APPROVED") {
      const dates = inclusiveDates(request.startDate, request.endDate);
      const storedImpact = request.balanceAppliedAt
        ? {
            workdayDelta: request.balanceWorkdayDelta,
            annualLeaveDelta: request.balanceAnnualLeaveDelta,
          }
        : requestBalanceForRange(
            request.type,
            Boolean(request.attachmentUrl),
            request.user.memberStatus,
            dates.length,
          );

      if (storedImpact.workdayDelta !== 0 || storedImpact.annualLeaveDelta !== 0) {
        await tx.user.update({
          where: { id: request.userId },
          data: {
            ...(storedImpact.workdayDelta !== 0 && {
              workDayBalance: { decrement: storedImpact.workdayDelta },
            }),
            ...(storedImpact.annualLeaveDelta !== 0 && {
              annualLeaveBalance: { decrement: storedImpact.annualLeaveDelta },
            }),
          },
        });
      }

      for (const attendanceDate of dates) {
        if (request.type === "WFH") {
          await tx.personalWorkSchedule.deleteMany({
            where: { userId: request.userId, workDate: attendanceDate, workMode: "WFH" },
          });
          continue;
        }

        const expectedStatus =
          ATTENDANCE_STATUS_BY_REQUEST[
            request.type as keyof typeof ATTENDANCE_STATUS_BY_REQUEST
          ];
        if (!expectedStatus) continue;
        await tx.attendanceRecord.deleteMany({
          where: {
            userId: request.userId,
            attendanceDate,
            status: expectedStatus,
            checkInAt: null,
            checkOutAt: null,
          },
        });
      }
    }

    await tx.request.delete({ where: { id: request.id } });
    await tx.auditLog.create({
      data: {
        actorId: superAdmin.id,
        entity: "Request",
        entityId: request.id,
        action: "REQUEST_DELETED",
        metadata: {
          userId: request.userId,
          type: request.type,
          status: request.status,
          revertedWorkdayBalanceDelta: request.balanceWorkdayDelta,
          revertedAnnualLeaveBalanceDelta: request.balanceAnnualLeaveDelta,
        },
      },
    });
  });

  revalidateRequestViews();
  redirect("/admin/requests?success=deleted");
}
