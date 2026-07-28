import "server-only";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

type RequestNotificationParams = {
  userName: string;
  userEmail: string;
  studioId: string;
  type: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  attachmentUrl?: string | null;
};

type CorrectionNotificationParams = {
  userName: string;
  userEmail: string;
  studioId: string;
  previousStatus: string;
  newStatus: string;
  attendanceDate: Date;
  proposedCheckInTime?: string | null;
  proposedCheckOutTime?: string | null;
  reason: string;
  attachmentUrl?: string | null;
};

/**
 * Resolves target email addresses for a studio:
 * 1. Uses studio.notificationEmail if configured.
 * 2. Otherwise falls back to emails of all ACTIVE users with ADMIN role in that studio, plus SUPER_ADMINs.
 */
async function resolveStudioRecipients(studioId: string): Promise<string[]> {
  const studio = await prisma.studio.findUnique({
    where: { id: studioId },
    select: { notificationEmail: true },
  });

  if (studio?.notificationEmail && studio.notificationEmail.trim().length > 0) {
    return [studio.notificationEmail.trim()];
  }

  // Fallback: fetch active ADMINs for this studio and all SUPER_ADMINs
  const admins = await prisma.user.findMany({
    where: {
      accountStatus: "ACTIVE",
      OR: [
        { role: "ADMIN", defaultStudioId: studioId },
        { role: "SUPER_ADMIN" },
      ],
    },
    select: { email: true },
  });

  return [...new Set(admins.map((a) => a.email).filter(Boolean))];
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeZone: "Asia/Jakarta",
  }).format(new Date(date));
}

const TYPE_LABEL_MAP: Record<string, string> = {
  PERMISSION: "Personal Permission",
  SICK: "Sick Leave",
  DISPENSATION: "Official Dispensation",
  LEAVE: "Annual Leave",
  WFH: "Work From Home (WFH)",
};

/**
 * Sends non-blocking email notification to studio for a new Request submission.
 */
export async function sendStudioRequestNotification(params: RequestNotificationParams) {
  try {
    const recipients = await resolveStudioRecipients(params.studioId);
    if (recipients.length === 0) return;

    const typeLabel = TYPE_LABEL_MAP[params.type] || params.type;
    const startStr = formatDate(params.startDate);
    const endStr = formatDate(params.endDate);
    const dateRangeStr = startStr === endStr ? startStr : `${startStr} to ${endStr}`;

    const subject = `[MahaTeams Notification] New ${typeLabel} Request - ${params.userName}`;
    const text = `
Hello Studio Admin,

A new ${typeLabel} request has been submitted and requires your review:

- Applicant Name : ${params.userName} (${params.userEmail})
- Request Type   : ${typeLabel}
- Dates          : ${dateRangeStr}
- Reason         : ${params.reason}
- Attachment     : ${params.attachmentUrl ? "Attached Document" : "None"}

Please sign in to MahaTeams to review and approve or reject this request.
Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/requests
    `.trim();

    const html = `
      <div style="font-family: Arial, sans-serif; color: #18181b; max-width: 560px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 8px; padding: 24px;">
        <h2 style="color: #09090b; font-size: 18px; margin-top: 0;">New ${typeLabel} Request</h2>
        <p style="font-size: 14px; color: #52525b;">A new request has been submitted by a team member and requires your review:</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 16px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f4f4f5; font-weight: bold; width: 140px;">Applicant Name</td>
            <td style="padding: 8px; border-bottom: 1px solid #f4f4f5;">${params.userName} (${params.userEmail})</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f4f4f5; font-weight: bold;">Request Type</td>
            <td style="padding: 8px; border-bottom: 1px solid #f4f4f5;">${typeLabel}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f4f4f5; font-weight: bold;">Dates</td>
            <td style="padding: 8px; border-bottom: 1px solid #f4f4f5;">${dateRangeStr}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f4f4f5; font-weight: bold;">Reason</td>
            <td style="padding: 8px; border-bottom: 1px solid #f4f4f5;">${params.reason}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f4f4f5; font-weight: bold;">Attachment</td>
            <td style="padding: 8px; border-bottom: 1px solid #f4f4f5;">${params.attachmentUrl ? "Attached Document" : "None"}</td>
          </tr>
        </table>
        <div style="margin-top: 24px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/requests" style="display: inline-block; background-color: #18181b; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">Open Approval Dashboard</a>
        </div>
      </div>
    `.trim();

    for (const recipient of recipients) {
      await sendEmail({ to: recipient, subject, text, html });
    }
  } catch (err) {
    console.error("[Email Notification Error] Failed to send request email to studio:", err);
  }
}

/**
 * Sends non-blocking email notification to studio for a new Attendance Correction submission.
 */
export async function sendStudioCorrectionNotification(params: CorrectionNotificationParams) {
  try {
    const recipients = await resolveStudioRecipients(params.studioId);
    if (recipients.length === 0) return;

    const dateStr = formatDate(params.attendanceDate);
    const subject = `[MahaTeams Notification] New Attendance Correction Request - ${params.userName}`;
    const text = `
Hello Studio Admin,

A new Attendance Correction request has been submitted and requires your review:

- Applicant Name   : ${params.userName} (${params.userEmail})
- Attendance Date  : ${dateStr}
- Previous Status  : ${params.previousStatus}
- Proposed Status  : ${params.newStatus}
- Proposed Check-in: ${params.proposedCheckInTime || "-"}
- Proposed Check-out: ${params.proposedCheckOutTime || "-"}
- Reason           : ${params.reason}

Please sign in to MahaTeams to review and approve or reject this request.
Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/corrections
    `.trim();

    const html = `
      <div style="font-family: Arial, sans-serif; color: #18181b; max-width: 560px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 8px; padding: 24px;">
        <h2 style="color: #09090b; font-size: 18px; margin-top: 0;">New Attendance Correction Request</h2>
        <p style="font-size: 14px; color: #52525b;">An attendance correction request has been submitted by a team member and requires your review:</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 16px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f4f4f5; font-weight: bold; width: 140px;">Applicant Name</td>
            <td style="padding: 8px; border-bottom: 1px solid #f4f4f5;">${params.userName} (${params.userEmail})</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f4f4f5; font-weight: bold;">Attendance Date</td>
            <td style="padding: 8px; border-bottom: 1px solid #f4f4f5;">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f4f4f5; font-weight: bold;">Status (Original &rarr; Proposed)</td>
            <td style="padding: 8px; border-bottom: 1px solid #f4f4f5;">${params.previousStatus} &rarr; <strong>${params.newStatus}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f4f4f5; font-weight: bold;">Check-in / Check-out</td>
            <td style="padding: 8px; border-bottom: 1px solid #f4f4f5;">${params.proposedCheckInTime || "-"} / ${params.proposedCheckOutTime || "-"}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f4f4f5; font-weight: bold;">Reason</td>
            <td style="padding: 8px; border-bottom: 1px solid #f4f4f5;">${params.reason}</td>
          </tr>
        </table>
        <div style="margin-top: 24px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/corrections" style="display: inline-block; background-color: #18181b; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">Open Approval Dashboard</a>
        </div>
      </div>
    `.trim();

    for (const recipient of recipients) {
      await sendEmail({ to: recipient, subject, text, html });
    }
  } catch (err) {
    console.error("[Email Notification Error] Failed to send correction email to studio:", err);
  }
}
