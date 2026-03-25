import { NextResponse } from "next/server";
import { syncUsaspendingAwards } from "@/lib/usaspending-api/sync";

export const maxDuration = 120;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[Cron] CRON_SECRET 환경변수가 설정되지 않았습니다.");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncUsaspendingAwards();
    console.log("[Cron] USAspending 수집 완료:", result);
    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] USAspending 수집 실패:", error);
    return NextResponse.json(
      { ok: false, error: "USAspending sync failed", timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
