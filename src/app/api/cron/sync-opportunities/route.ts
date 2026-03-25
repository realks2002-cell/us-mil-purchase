import { NextResponse } from "next/server";
import { syncOpportunities } from "@/lib/sam-api/sync";
import { checkDeadlineWarnings } from "@/lib/services/notifications";

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
    const result = await syncOpportunities();
    console.log("[Cron] 공고 수집 완료:", result);

    let deadlineWarnings = 0;
    try {
      deadlineWarnings = await checkDeadlineWarnings();
    } catch (e) {
      console.error("[Cron] 마감 임박 알림 생성 실패 (무시):", e);
    }

    return NextResponse.json({
      ok: true,
      ...result,
      deadlineWarnings,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] 공고 수집 실패:", error);
    return NextResponse.json(
      { ok: false, error: "Sync failed", timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
