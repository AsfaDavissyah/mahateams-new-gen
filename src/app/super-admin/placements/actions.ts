"use server";

import { revalidatePath } from "next/cache";
import { requireAnyRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

type PlacementInput = {
  userId: string;
  studioId: string;
  startDate: string; // "YYYY-MM-DD"
  endDate?: string | null; // "YYYY-MM-DD"
  reason?: string | null;
};

type ActionResult = {
  success: boolean;
  error?: string;
  placement?: any;
};

function parseDate(str: string): Date {
  return new Date(`${str}T00:00:00.000Z`);
}

export async function createPlacementAction(input: PlacementInput): Promise<ActionResult> {
  try {
    const actor = await requireAnyRole(["SUPER_ADMIN"]);

    if (!input.userId || !input.studioId || !input.startDate) {
      return { success: false, error: "Please fill in all required fields." };
    }

    const startDate = parseDate(input.startDate);
    const endDate = input.endDate ? parseDate(input.endDate) : null;

    if (endDate && endDate < startDate) {
      return { success: false, error: "End date cannot be earlier than start date." };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { defaultStudioId: true, defaultStudio: { select: { name: true } } },
    });

    if (targetUser?.defaultStudioId && targetUser.defaultStudioId === input.studioId) {
      return {
        success: false,
        error: `Member is already homed at ${targetUser.defaultStudio?.name ?? "this studio"}. Placement target must be a different studio.`,
      };
    }

    // Check if there is an active placement for this user
    const activePlacement = await prisma.placement.findFirst({
      where: {
        userId: input.userId,
        status: "ACTIVE",
      },
    });

    if (activePlacement) {
      return {
        success: false,
        error: "This user already has an active placement. Complete or cancel the existing placement first.",
      };
    }

    const newPlacement = await prisma.$transaction(async (tx) => {
      const placement = await tx.placement.create({
        data: {
          userId: input.userId,
          studioId: input.studioId,
          startDate,
          endDate,
          status: "ACTIVE",
          reason: input.reason?.trim() || null,
          createdById: actor.id,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          studio: { select: { id: true, name: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          entity: "Placement",
          entityId: placement.id,
          action: "CREATE_PLACEMENT",
          metadata: {
            user: placement.user.name,
            studio: placement.studio.name,
            startDate: placement.startDate,
            endDate: placement.endDate,
            reason: placement.reason,
          },
        },
      });

      return placement;
    });

    revalidatePath("/super-admin/placements");
    revalidatePath("/roles");
    revalidatePath("/schedules");
    return { success: true, placement: newPlacement };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to create placement." };
  }
}

export async function updatePlacementAction(id: string, input: PlacementInput): Promise<ActionResult> {
  try {
    const actor = await requireAnyRole(["SUPER_ADMIN"]);

    if (!id || !input.studioId || !input.startDate) {
      return { success: false, error: "Please fill in all required fields." };
    }

    const startDate = parseDate(input.startDate);
    const endDate = input.endDate ? parseDate(input.endDate) : null;

    if (endDate && endDate < startDate) {
      return { success: false, error: "End date cannot be earlier than start date." };
    }

    const existingPlacement = await prisma.placement.findUnique({
      where: { id },
      include: { user: { select: { defaultStudioId: true, defaultStudio: { select: { name: true } } } } },
    });

    if (!existingPlacement) {
      return { success: false, error: "Placement record not found." };
    }

    if (existingPlacement.user?.defaultStudioId && existingPlacement.user.defaultStudioId === input.studioId) {
      return {
        success: false,
        error: `Member is already homed at ${existingPlacement.user.defaultStudio?.name ?? "this studio"}. Placement target must be a different studio.`,
      };
    }

    const updatedPlacement = await prisma.$transaction(async (tx) => {
      const placement = await tx.placement.update({
        where: { id },
        data: {
          studioId: input.studioId,
          startDate,
          endDate,
          reason: input.reason?.trim() || null,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          studio: { select: { id: true, name: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          entity: "Placement",
          entityId: placement.id,
          action: "UPDATE_PLACEMENT",
          metadata: {
            user: placement.user.name,
            studio: placement.studio.name,
            startDate: placement.startDate,
            endDate: placement.endDate,
            reason: placement.reason,
          },
        },
      });

      return placement;
    });

    revalidatePath("/super-admin/placements");
    revalidatePath("/roles");
    revalidatePath("/schedules");
    return { success: true, placement: updatedPlacement };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update placement." };
  }
}

export async function updatePlacementStatusAction(
  id: string,
  status: "COMPLETED" | "CANCELLED"
): Promise<ActionResult> {
  try {
    const actor = await requireAnyRole(["SUPER_ADMIN"]);

    const updatedPlacement = await prisma.$transaction(async (tx) => {
      const dataToUpdate: Prisma.PlacementUpdateInput = { status };
      if (status === "COMPLETED") {
        dataToUpdate.endDate = new Date();
      }

      const placement = await tx.placement.update({
        where: { id },
        data: dataToUpdate,
        include: {
          user: { select: { id: true, name: true, email: true } },
          studio: { select: { id: true, name: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          entity: "Placement",
          entityId: placement.id,
          action: "UPDATE_PLACEMENT_STATUS",
          metadata: {
            user: placement.user.name,
            studio: placement.studio.name,
            status: placement.status,
          },
        },
      });

      return placement;
    });

    revalidatePath("/super-admin/placements");
    revalidatePath("/roles");
    revalidatePath("/schedules");
    return { success: true, placement: updatedPlacement };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update placement status." };
  }
}
