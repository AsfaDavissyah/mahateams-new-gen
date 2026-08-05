"use server";

import { redirect } from "next/navigation";

export async function registerMemberAction() {
  redirect("/login");
}
