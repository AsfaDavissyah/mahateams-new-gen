import { DashboardShell } from "@/components/dashboard-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkdaySettingsClient } from "./workday-settings-client";
import { ProfileSettingsClient } from "./profile-settings-client";
import { HelpDialogsSettingsClient } from "./help-dialogs-settings-client";
import { BackgroundSettingsCard } from "./background-settings-card";
import { getHelpRules } from "@/lib/default-help-rules";
import { SettingsTocLayout } from "./settings-toc-layout";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  const studios = isSuperAdmin
    ? await prisma.studio.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
          radiusMeters: true,
          weekStartDay: true,
          weeklyWorkRules: {
            select: {
              dayOfWeek: true,
              isWorkday: true,
              isOptional: true,
              workStartTime: true,
              workEndTime: true,
            },
            orderBy: { dayOfWeek: "asc" },
          },
          policies: {
            where: { isActive: true },
            select: {
              checkInTime: true,
              checkOutTime: true,
              graceMinutes: true,
              alphaCutoffTime: true,
            },
            take: 1,
          },
        },
      })
    : [];

  const helpRules = isSuperAdmin ? await getHelpRules() : null;

  return (
    <DashboardShell
      user={user}
      currentPath="/settings"
      badge="Settings"
      title="Settings"
      description="Manage your profile, security PIN, studio configuration, and background appearance on one page."
    >
      <SettingsTocLayout isSuperAdmin={isSuperAdmin}>
        <ProfileSettingsClient initialUser={user} />
        {isSuperAdmin && <WorkdaySettingsClient studios={studios} />}
        {isSuperAdmin && helpRules && <HelpDialogsSettingsClient initialRules={helpRules} />}
        <BackgroundSettingsCard />
      </SettingsTocLayout>
    </DashboardShell>
  );
}
