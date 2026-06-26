"use server";

import { redirect } from "next/navigation";
import {
  clearSession,
  getDashboardPath,
  setSession,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      role: true,
      accountStatus: true,
      passwordHash: true,
    },
  });

  if (
    !user ||
    user.accountStatus !== "ACTIVE" ||
    !verifyPassword(password, user.passwordHash)
  ) {
    redirect("/login?error=invalid");
  }

  await setSession(user.id);
  redirect(getDashboardPath(user.role));
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
