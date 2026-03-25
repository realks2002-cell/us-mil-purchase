import { NextResponse } from "next/server";
import { syncAwards } from "@/lib/sam-api/sync";

export const maxDuration = 60;

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
    const result = await syncAwards();
    console.log("[Cron] Awards 수집 완료:", result);
    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Awards 수집 실패:", error);
    return NextResponse.json(
      { ok: false, error: "Awards sync failed", timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
