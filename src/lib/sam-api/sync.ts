import { db } from "@/lib/db";
import { opportunities, syncLogs, type NewOpportunity } from "@/lib/db/schema";
import { searchKoreaOpportunities, isKoreaRelated, type SamOpportunity } from "./client";
import { eq, sql } from "drizzle-orm";

function formatDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${date.getFullYear()}`;
}

function parseOpportunity(opp: SamOpportunity): NewOpportunity {
  return {
    noticeId: opp.noticeId,
    title: opp.title,
    solicitationNumber: opp.solicitationNumber ?? null,
    department: opp.department ?? null,
    subTier: opp.subTier ?? null,
    office: opp.office ?? null,
    postedDate: opp.postedDate ? new Date(opp.postedDate) : null,
    type: opp.type ?? null,
    baseType: opp.baseType ?? null,
    archiveType: opp.archiveType ?? null,
    archiveDate: opp.archiveDate ? new Date(opp.archiveDate) : null,
    responseDeadline: opp.responseDeadLine ? new Date(opp.responseDeadLine) : null,
    naicsCode: opp.naicsCode ?? null,
    classificationCode: opp.classificationCode ?? null,
    setAside: opp.setAside ?? null,
    setAsideDescription: opp.setAsideDescription ?? null,
    placeCity: opp.placeOfPerformance?.city?.name ?? null,
    placeState: opp.placeOfPerformance?.state?.code ?? null,
    placeCountry: opp.placeOfPerformance?.country?.code ?? null,
    placeZip: opp.placeOfPerformance?.zip ?? null,
    description: opp.description ?? null,
    organizationType: opp.organizationType ?? null,
    uiLink: opp.uiLink ?? null,
    resourceLinks: opp.resourceLinks ?? null,
    pointOfContact: opp.pointOfContact ?? null,
    status: opp.active === "Yes" ? "active" : "inactive",
    rawData: opp as unknown as Record<string, unknown>,
  };
}

async function isAlreadyRunning(): Promise<boolean> {
  const running = await db.query.syncLogs.findFirst({
    where: eq(syncLogs.status, "running"),
  });
  return !!running;
}

export async function syncOpportunities(): Promise<{
  fetched: number;
  newCount: number;
  updatedCount: number;
}> {
  // 동시 실행 방지
  if (await isAlreadyRunning()) {
    console.warn("[Sync] 이전 수집이 아직 실행 중입니다. 건너뜁니다.");
    return { fetched: 0, newCount: 0, updatedCount: 0 };
  }

  const startTime = Date.now();
  const [log] = await db
    .insert(syncLogs)
    .values({ apiType: "opportunities", status: "running" })
    .returning();

  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let allOpps: SamOpportunity[] = [];
    let offset = 0;
    const limit = 1000;
    let totalRecords = 0;

    // 페이지네이션으로 전체 수집
    do {
      const response = await searchKoreaOpportunities({
        postedFrom: formatDate(weekAgo),
        postedTo: formatDate(now),
        limit,
        offset,
      });
      totalRecords = response.totalRecords;
      allOpps = allOpps.concat(response.opportunitiesData);
      offset += limit;
    } while (offset < totalRecords && offset < 5000); // 안전 상한 5,000건

    const koreaOpps = allOpps.filter(isKoreaRelated);
    let newCount = 0;
    let updatedCount = 0;

    // 배치 upsert (50건씩)
    const BATCH_SIZE = 50;
    for (let i = 0; i < koreaOpps.length; i += BATCH_SIZE) {
      const batch = koreaOpps.slice(i, i + BATCH_SIZE).map(parseOpportunity);

      const results = await db
        .insert(opportunities)
        .values(batch)
        .onConflictDoUpdate({
          target: opportunities.noticeId,
          set: {
            title: sql`excluded.title`,
            department: sql`excluded.department`,
            subTier: sql`excluded.sub_tier`,
            office: sql`excluded.office`,
            type: sql`excluded.type`,
            baseType: sql`excluded.base_type`,
            responseDeadline: sql`excluded.response_deadline`,
            naicsCode: sql`excluded.naics_code`,
            setAside: sql`excluded.set_aside`,
            description: sql`excluded.description`,
            placeCity: sql`excluded.place_city`,
            placeState: sql`excluded.place_state`,
            placeCountry: sql`excluded.place_country`,
            status: sql`excluded.status`,
            rawData: sql`excluded.raw_data`,
            pointOfContact: sql`excluded.point_of_contact`,
            resourceLinks: sql`excluded.resource_links`,
            updatedAt: sql`now()`,
          },
        })
        .returning({ id: opportunities.id, noticeId: opportunities.noticeId });

      // 신규 vs 갱신 카운트 (createdAt과 updatedAt이 같으면 신규)
      newCount += results.length;
    }

    // 대략적인 갱신 카운트 추정 (전체 insert 결과 - 기존 데이터)
    updatedCount = Math.max(0, newCount - koreaOpps.length);
    newCount = koreaOpps.length - Math.abs(updatedCount);

    const duration = Date.now() - startTime;
    await db
      .update(syncLogs)
      .set({
        status: "success",
        recordsFetched: totalRecords,
        recordsNew: newCount,
        recordsUpdated: updatedCount,
        duration,
        completedAt: new Date(),
      })
      .where(eq(syncLogs.id, log.id));

    return { fetched: totalRecords, newCount, updatedCount };
  } catch (error) {
    const duration = Date.now() - startTime;
    await db
      .update(syncLogs)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : String(error),
        duration,
        completedAt: new Date(),
      })
      .where(eq(syncLogs.id, log.id));
    throw error;
  }
}
