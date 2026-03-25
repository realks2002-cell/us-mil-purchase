import { NextResponse } from "next/server";
import { searchOpportunities, isKoreaRelated } from "@/lib/sam-api/client";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => {
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${mm}/${dd}/${d.getFullYear()}`;
    };

    // placeOfPerformance=KOR 으로 직접 필터
    const result = await searchOpportunities({
      postedFrom: fmt(weekAgo),
      postedTo: fmt(now),
      placeOfPerformanceCode: "KOR",
      limit: 10,
    });

    const koreaFiltered = result.opportunitiesData.filter(isKoreaRelated);

    return NextResponse.json({
      ok: true,
      totalRecords: result.totalRecords,
      fetched: result.opportunitiesData.length,
      koreaRelated: koreaFiltered.length,
      sample: koreaFiltered.slice(0, 5).map((o) => ({
        noticeId: o.noticeId,
        title: o.title,
        department: o.department,
        type: o.type,
        naicsCode: o.naicsCode,
        deadline: o.responseDeadLine,
        place: o.placeOfPerformance,
        active: o.active,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
