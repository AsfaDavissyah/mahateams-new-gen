import { materializeDailyAlpha } from "@/lib/attendance-alpha";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return Response.json({ success: false }, { status: 401 });
  }

  const result = await materializeDailyAlpha();

  return Response.json({ success: true, ...result });
}
