"use server";

import { redirect } from "next/navigation";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { REGISTRATION_DEFAULT_ROLE } from "@/lib/roles";

export async function registerMemberAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const defaultStudioId = String(formData.get("defaultStudioId") ?? "");

  if (!name || !email || password.length < 6 || !defaultStudioId) {
    redirect("/register?error=invalid");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    redirect("/register?error=email");
  }

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashPassword(password),
      role: REGISTRATION_DEFAULT_ROLE,
      memberStatus: "TEAM",
      accountStatus: "ACTIVE",
      defaultStudioId,
    },
  });

  redirect("/login?registered=1");
}
