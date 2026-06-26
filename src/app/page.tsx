import { redirect } from "next/navigation";
import { getDashboardPath, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const currentUser = await requireUser();

  redirect(getDashboardPath(currentUser.role));
}
