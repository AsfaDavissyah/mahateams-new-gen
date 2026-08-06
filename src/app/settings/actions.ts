"use server";

import { revalidatePath } from "next/cache";
import { requireRole, requireUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSecurityPinError } from "@/lib/security-pin";

// ─── WeeklyWorkRule upsert (bulk 7 hari per studio) ─────────────────────────

type DayRule = {
  dayOfWeek: number; // 0=Sun, 1=Mon, ... 6=Sat
  isWorkday: boolean;
  isOptional: boolean;
  workStartTime: string;
  workEndTime: string;
};

export async function upsertWeeklyWorkRulesAction(studioId: string, rules: DayRule[]) {
  const user = await requireRole("SUPER_ADMIN");

  const isGlobalSuperAdmin = user.role === "SUPER_ADMIN";
  if (!isGlobalSuperAdmin && studioId !== user.defaultStudioId) {
    throw new Error("Anda hanya diperbolehkan mengelola aturan kerja untuk studio Anda sendiri.");
  }

  // Verify studio exists
  const studio = await prisma.studio.findUnique({ where: { id: studioId }, select: { id: true } });
  if (!studio) throw new Error("Studio tidak ditemukan.");

  await prisma.$transaction(
    rules.map((rule) =>
      prisma.weeklyWorkRule.upsert({
        where: { studioId_dayOfWeek: { studioId, dayOfWeek: rule.dayOfWeek } },
        create: {
          studioId,
          dayOfWeek: rule.dayOfWeek,
          isWorkday: rule.isWorkday,
          isOptional: rule.isOptional,
          workStartTime: rule.workStartTime,
          workEndTime: rule.workEndTime,
        },
        update: {
          isWorkday: rule.isWorkday,
          isOptional: rule.isOptional,
          workStartTime: rule.workStartTime,
          workEndTime: rule.workEndTime,
        },
      })
    )
  );

  revalidatePath("/settings");
  revalidatePath("/schedules");
}

// ─── Update Studio weekStartDay ──────────────────────────────────────────────

export async function updateStudioWeekStartAction(studioId: string, weekStartDay: number) {
  const user = await requireRole("SUPER_ADMIN");

  const isGlobalSuperAdmin = user.role === "SUPER_ADMIN";
  if (!isGlobalSuperAdmin && studioId !== user.defaultStudioId) {
    throw new Error("Anda hanya diperbolehkan mengubah hari awal kerja untuk studio Anda sendiri.");
  }

  await prisma.studio.update({ where: { id: studioId }, data: { weekStartDay } });
  revalidatePath("/settings");
}

// ─── Self-Service Profile Update ─────────────────────────────────────────────

export async function updateProfileAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const actor = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase() || null;
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmNewPassword = String(formData.get("confirmNewPassword") ?? "");
  const birthDateStr = formData.get("birthDate") ? String(formData.get("birthDate")) : null;
  const phoneNumber = formData.get("phoneNumber") ? String(formData.get("phoneNumber")).trim() : null;
  const address = formData.get("address") ? String(formData.get("address")).trim() : null;
  if (!name || !email) {
    return { success: false, error: "Nama dan Email wajib diisi." };
  }

  // Validate username format
  if (username && !/^[a-z0-9._-]{3,30}$/.test(username)) {
    return { success: false, error: "Username harus 3-30 karakter and hanya boleh berisi huruf kecil, angka, titik, garis bawah, atau tanda hubung." };
  }

  // Fetch full user including username to compare
  const fullUser = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { email: true, username: true }
  });

  if (!fullUser) {
    return { success: false, error: "User tidak ditemukan." };
  }

  // Validate unique email
  if (email !== fullUser.email) {
    const existingEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingEmail) {
      return { success: false, error: "Email sudah terdaftar." };
    }
  }

  // Validate unique username
  if (username && username !== fullUser.username) {
    const existingUsername = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (existingUsername) {
      return { success: false, error: "Username sudah digunakan." };
    }
  }

  // Validate password update
  let passwordHash: string | undefined = undefined;
  if (newPassword) {
    if (newPassword.length < 6) {
      return { success: false, error: "Password baru minimal 6 karakter." };
    }
    if (newPassword !== confirmNewPassword) {
      return { success: false, error: "New password confirmation does not match." };
    }
    passwordHash = hashPassword(newPassword);
  }

  let birthDate: Date | null = null;
  if (birthDateStr) {
    birthDate = new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) {
      return { success: false, error: "Format tanggal lahir tidak valid." };
    }
  }

  // Update profile
  await prisma.user.update({
    where: { id: actor.id },
    data: {
      name,
      username,
      email,
      birthDate,
      phoneNumber,
      address,
      ...(passwordHash ? { passwordHash } : {}),
    },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function updateMoodAction(formData: FormData) {
  const { submitAttendanceMoodAction } = await import("@/app/member/mood/actions");
  return submitAttendanceMoodAction(formData);
}

// ─── Update Security PIN ─────────────────────────────────────────────────────

export async function updateUserPinAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const actor = await requireUser();
  const { hashPin, verifyPin, verifyPassword } = await import("@/lib/auth");

  const currentVerification = String(formData.get("currentVerification") ?? "").trim();
  const newPin = String(formData.get("newPin") ?? "").trim();
  const confirmNewPin = String(formData.get("confirmNewPin") ?? "").trim();

  const pinError = getSecurityPinError(newPin);
  if (pinError) {
    return { success: false, error: pinError };
  }

  if (newPin !== confirmNewPin) {
    return { success: false, error: "PIN confirmation does not match." };
  }

  const fullUser = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { passwordHash: true, pinHash: true },
  });

  if (!fullUser) {
    return { success: false, error: "User was not found." };
  }

  const isPasswordValid = verifyPassword(currentVerification, fullUser.passwordHash);
  const isPinValid = verifyPin(currentVerification, fullUser.pinHash);

  if (!isPasswordValid && !isPinValid) {
    return { success: false, error: "Your current password or PIN is incorrect." };
  }

  const pinHash = hashPin(newPin);

  await prisma.user.update({
    where: { id: actor.id },
    data: {
      pinHash,
      isPinSet: true,
    },
  });

  revalidatePath("/settings");
  return { success: true };
}

// ─── Update Studio Attendance Policy ─────────────────────────────────────────

export async function updateStudioPolicyAction(
  studioId: string,
  policyData: {
    checkInTime: string;
    checkOutTime: string;
    graceMinutes: number;
    alphaCutoffTime: string;
  }
) {
  const user = await requireRole("SUPER_ADMIN");

  const isGlobalSuperAdmin = user.role === "SUPER_ADMIN";
  if (!isGlobalSuperAdmin && studioId !== user.defaultStudioId) {
    throw new Error("Anda hanya diperbolehkan mengubah kebijakan untuk studio Anda sendiri.");
  }

  // Verify studio exists
  const studio = await prisma.studio.findUnique({
    where: { id: studioId },
    select: { id: true },
  });
  if (!studio) throw new Error("Studio tidak ditemukan.");

  // Deactivate old active policies for this studio
  await prisma.attendancePolicy.updateMany({
    where: { studioId, isActive: true },
    data: { isActive: false },
  });

  // Create new active policy
  await prisma.attendancePolicy.create({
    data: {
      studioId,
      checkInTime: policyData.checkInTime,
      checkOutTime: policyData.checkOutTime,
      graceMinutes: policyData.graceMinutes,
      alphaCutoffTime: policyData.alphaCutoffTime,
      isActive: true,
      createdById: user.id,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/calendar");
  revalidatePath("/schedules");
}

// ─── Update Studio Geofence & Location ───────────────────────────────────────

export async function updateStudioGeofenceAction(
  studioId: string,
  geofenceData: {
    latitude: number | null;
    longitude: number | null;
    radiusMeters: number;
  }
) {
  const user = await requireRole("SUPER_ADMIN");

  const isGlobalSuperAdmin = user.role === "SUPER_ADMIN";
  if (!isGlobalSuperAdmin && studioId !== user.defaultStudioId) {
    throw new Error("Anda hanya diperbolehkan mengubah geofence untuk studio Anda sendiri.");
  }

  // Verify studio exists
  const studio = await prisma.studio.findUnique({
    where: { id: studioId },
    select: { id: true },
  });
  if (!studio) throw new Error("Studio tidak ditemukan.");

  await prisma.studio.update({
    where: { id: studioId },
    data: {
      latitude: geofenceData.latitude,
      longitude: geofenceData.longitude,
      radiusMeters: geofenceData.radiusMeters,
    },
  });

  revalidatePath("/settings");
}

export async function updateHelpRulesAction(rules: {
  rules_wfo: string;
  rules_leave_sick: string;
  rules_correction: string;
  rules_wfh_plan: string;
  rules_wfh_report: string;
  max_correction_days?: number;
}) {
  await requireRole("SUPER_ADMIN");

  const ops: Array<ReturnType<typeof prisma.systemSetting.upsert>> = [
    prisma.systemSetting.upsert({
      where: { key: "rules_wfo" },
      create: { key: "rules_wfo", value: rules.rules_wfo },
      update: { value: rules.rules_wfo },
    }),
    prisma.systemSetting.upsert({
      where: { key: "rules_leave_sick" },
      create: { key: "rules_leave_sick", value: rules.rules_leave_sick },
      update: { value: rules.rules_leave_sick },
    }),
    prisma.systemSetting.upsert({
      where: { key: "rules_correction" },
      create: { key: "rules_correction", value: rules.rules_correction },
      update: { value: rules.rules_correction },
    }),
    prisma.systemSetting.upsert({
      where: { key: "rules_wfh_plan" },
      create: { key: "rules_wfh_plan", value: rules.rules_wfh_plan },
      update: { value: rules.rules_wfh_plan },
    }),
    prisma.systemSetting.upsert({
      where: { key: "rules_wfh_report" },
      create: { key: "rules_wfh_report", value: rules.rules_wfh_report },
      update: { value: rules.rules_wfh_report },
    }),
  ];

  if (typeof rules.max_correction_days === "number" && rules.max_correction_days >= 0) {
    ops.push(
      prisma.systemSetting.upsert({
        where: { key: "max_correction_days" },
        create: { key: "max_correction_days", value: String(rules.max_correction_days) },
        update: { value: String(rules.max_correction_days) },
      })
    );
  }

  await prisma.$transaction(ops);

  revalidatePath("/settings");
  revalidatePath("/member");
  revalidatePath("/member/requests");
  revalidatePath("/member/corrections");
  revalidatePath("/member/presensi/riwayat");
}

export async function updateMaxCorrectionDaysAction(days: number) {
  await requireRole("SUPER_ADMIN");

  const validDays = Math.max(0, Math.min(365, days));

  await prisma.systemSetting.upsert({
    where: { key: "max_correction_days" },
    create: { key: "max_correction_days", value: String(validDays) },
    update: { value: String(validDays) },
  });

  revalidatePath("/settings");
  revalidatePath("/member");
  revalidatePath("/member/requests");
  revalidatePath("/member/corrections");
  revalidatePath("/member/presensi/riwayat");
}
