import { db } from "@/lib/db";
import { opportunities, awards, syncLogs, type NewOpportunity, type NewAward } from "@/lib/db/schema";
import { searchKoreaOpportunities, searchKoreaAwards, getNoticeDescription, type SamOpportunity } from "./client";
import { and, eq, sql, inArray } from "drizzle-orm";
import { matchFiltersAndNotify, checkStatusChanges } from "@/lib/services/notifications";
import { getLastSuccessfulSyncDate, isAlreadyRunning } from "@/lib/services/sync-utils";
import { stripHtml } from "@/lib/utils";

function formatDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${date.getFullYear()}`;
}

const KOREA_LOCATION_MAP: Record<string, { city: string; state: string }> = {
  "Camp Humphreys": { city: "Pyeongtaek", state: "KR-41" },
  "Humphreys": { city: "Pyeongtaek", state: "KR-41" },
  "Osan AB": { city: "Osan", state: "KR-41" },
  "Osan Air Base": { city: "Osan", state: "KR-41" },
  "Kunsan AB": { city: "Gunsan", state: "KR-45" },
  "Kunsan Air Base": { city: "Gunsan", state: "KR-45" },
  "Yongsan": { city: "Seoul", state: "KR-11" },
  "Camp Casey": { city: "Dongducheon", state: "KR-41" },
  "Camp Walker": { city: "Daegu", state: "KR-27" },
  "USAG Daegu": { city: "Daegu", state: "KR-27" },
  "Camp Carroll": { city: "Waegwan", state: "KR-47" },
  "Chinhae": { city: "Jinhae", state: "KR-48" },
  "K-16": { city: "Seongnam", state: "KR-41" },
  "Camp Henry": { city: "Daegu", state: "KR-27" },
  "USAG Yongsan": { city: "Seoul", state: "KR-11" },
  "Camp Red Cloud": { city: "Uijeongbu", state: "KR-41" },
  "Pyeongtaek": { city: "Pyeongtaek", state: "KR-41" },
  "Seoul": { city: "Seoul", state: "KR-11" },
  "Daegu": { city: "Daegu", state: "KR-27" },
};

function inferKoreaLocation(text: string): { city: string; state: string } | null {
  const upper = text.toUpperCase();
  for (const [keyword, loc] of Object.entries(KOREA_LOCATION_MAP)) {
    if (upper.includes(keyword.toUpperCase())) return loc;
  }
  return null;
}

function parseOpportunity(opp: SamOpportunity): NewOpportunity {
  let placeCity = opp.placeOfPerformance?.city?.name ?? null;
  let placeState = opp.placeOfPerformance?.state?.code ?? null;
  let placeCountry = opp.placeOfPerformance?.country?.code ?? null;

  // API에서 장소 데이터가 없으면 제목/설명에서 추론
  if (!placeCountry) {
    const searchText = [opp.title, opp.office, opp.department].filter(Boolean).join(" ");
    const inferred = inferKoreaLocation(searchText);
    if (inferred) {
      placeCity = placeCity || inferred.city;
      placeState = placeState || inferred.state;
      placeCountry = "KOR";
    }
  }

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
    placeCity,
    placeState,
    placeCountry,
    placeZip: opp.placeOfPerformance?.zip ?? null,
    description: opp.description ? stripHtml(opp.description) : null,
    organizationType: opp.organizationType ?? null,
    uiLink: opp.uiLink ?? null,
    resourceLinks: opp.resourceLinks ?? null,
    pointOfContact: opp.pointOfContact ?? null,
    status: opp.active === "Yes" ? "active" : "inactive",
    rawData: opp as unknown as Record<string, unknown>,
  };
}

export async function syncOpportunities(): Promise<{
  fetched: number;
  newCount: number;
  updatedCount: number;
}> {
  // 동시 실행 방지
  if (await isAlreadyRunning("opportunities")) {
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
    const lastSync = await getLastSuccessfulSyncDate("opportunities");
    const since = lastSync
      ? new Date(lastSync.getTime() - 24 * 60 * 60 * 1000)
      : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    console.log(`[Sync] Opportunities ${lastSync ? `증분(since: ${formatDate(since)})` : '초기(7일)'} 수집`);

    let koreaOpps: SamOpportunity[] = [];
    let offset = 0;
    const limit = 1000;
    let totalRecords = 0;
    const seen = new Set<string>();

    // 페이지네이션으로 수집 (searchKoreaOpportunities 내부에서 한국 필터링 완료)
    do {
      const response = await searchKoreaOpportunities({
        postedFrom: formatDate(since),
        postedTo: formatDate(now),
        limit,
        offset,
      });
      totalRecords = response.totalRecords;
      for (const opp of response.opportunitiesData) {
        if (!seen.has(opp.noticeId)) {
          seen.add(opp.noticeId);
          koreaOpps.push(opp);
        }
      }
      offset += limit;
    } while (offset < totalRecords && offset < 5000);

    if (totalRecords > 5000) {
      console.warn(`[Sync] 전체 공고 ${totalRecords}건이 상한(5000)을 초과합니다. 일부 한국 관련 공고가 누락될 수 있습니다.`);
    }
    console.log(`[Sync] 전체 ${totalRecords}건 중 한국 관련 ${koreaOpps.length}건 필터링 완료`);

    // 한국 관련 공고의 상세 설명 가져오기 (5건씩 병렬)
    console.log(`[Sync] 한국 관련 공고 ${koreaOpps.length}건의 상세 설명 수집 시작`);
    const DESC_BATCH = 5;
    for (let i = 0; i < koreaOpps.length; i += DESC_BATCH) {
      const batch = koreaOpps.slice(i, i + DESC_BATCH);
      const descriptions = await Promise.all(
        batch.map((opp) => getNoticeDescription(opp.noticeId))
      );
      descriptions.forEach((desc, idx) => {
        if (desc) {
          console.log(`[Sync] ${batch[idx].noticeId}: 상세 설명 ${desc.length}자 수집 완료`);
          batch[idx].description = desc;
        } else {
          console.warn(`[Sync] ${batch[idx].noticeId}: 상세 설명 없음`);
        }
      });
    }

    let newCount = 0;
    let updatedCount = 0;
    const newOpportunityIds: number[] = [];
    const updatedOpportunityIds: number[] = [];

    // 기존 noticeId 목록 조회 (신규 vs 갱신 구분용)
    const batchNoticeIds = koreaOpps.map((o) => o.noticeId);
    const existingRows = batchNoticeIds.length
      ? await db
          .select({ id: opportunities.id, noticeId: opportunities.noticeId, status: opportunities.status })
          .from(opportunities)
          .where(inArray(opportunities.noticeId, batchNoticeIds))
      : [];
    const existingMap = new Map(existingRows.map((r) => [r.noticeId, r]));

    // 배치 upsert (50건씩)
    const BATCH_SIZE = 50;
    for (let i = 0; i < koreaOpps.length; i += BATCH_SIZE) {
      const batchRaw = koreaOpps.slice(i, i + BATCH_SIZE);
      const batch = batchRaw.map(parseOpportunity);

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

      for (const r of results) {
        const existing = existingMap.get(r.noticeId);
        if (!existing) {
          newCount++;
          newOpportunityIds.push(r.id);
        } else {
          updatedCount++;
          const parsed = batchRaw.find((o) => o.noticeId === r.noticeId);
          const newStatus = parsed?.active === "Yes" ? "active" : "inactive";
          if (existing.status !== newStatus) {
            updatedOpportunityIds.push(r.id);
          }
        }
      }
    }

    // 알림 트리거: 신규 매칭 + 상태 변경
    try {
      await matchFiltersAndNotify(newOpportunityIds);
      await checkStatusChanges(updatedOpportunityIds);
    } catch (e) {
      console.error("[Sync] 알림 생성 중 오류 (무시):", e);
    }

    const duration = Date.now() - startTime;
    await db
      .update(syncLogs)
      .set({
        status: "success",
        recordsFetched: koreaOpps.length,
        recordsNew: newCount,
        recordsUpdated: updatedCount,
        duration,
        completedAt: new Date(),
      })
      .where(eq(syncLogs.id, log.id));

    return { fetched: koreaOpps.length, newCount, updatedCount };
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

function parseAward(opp: SamOpportunity): NewAward {
  return {
    contractNumber: opp.award?.number ?? null,
    noticeId: opp.noticeId,
    title: opp.title ?? null,
    awardeeName: opp.award?.awardee?.name ?? null,
    awardeeUei: opp.award?.awardee?.ueiSAM ?? null,
    awardAmount: opp.award?.amount ?? null,
    dateSigned: opp.award?.date ? new Date(opp.award.date) : null,
    naicsCode: opp.naicsCode ?? null,
    psc: opp.classificationCode ?? null,
    contractType: opp.baseType ?? null,
    fundingAgency: opp.department ?? null,
    fundingOffice: opp.office ?? null,
    performanceCountry: opp.placeOfPerformance?.country?.code ?? null,
    rawData: opp as unknown as Record<string, unknown>,
  };
}

export async function syncAwards(): Promise<{
  fetched: number;
  newCount: number;
}> {
  if (await isAlreadyRunning("awards")) {
    console.warn("[Sync] 이전 Awards 수집이 아직 실행 중입니다. 건너뜁니다.");
    return { fetched: 0, newCount: 0 };
  }

  const startTime = Date.now();
  const [log] = await db
    .insert(syncLogs)
    .values({ apiType: "awards", status: "running" })
    .returning();

  try {
    const now = new Date();
    const lastSync = await getLastSuccessfulSyncDate("awards");
    const since = lastSync
      ? new Date(lastSync.getTime() - 24 * 60 * 60 * 1000)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    console.log(`[Sync] Awards ${lastSync ? `증분(since: ${formatDate(since)})` : '초기(30일)'} 수집`);

    let koreaAwards: SamOpportunity[] = [];
    let offset = 0;
    const limit = 1000;
    let totalRecords = 0;
    const seen = new Set<string>();

    do {
      const response = await searchKoreaAwards({
        postedFrom: formatDate(since),
        postedTo: formatDate(now),
        limit,
        offset,
      });
      totalRecords = response.totalRecords;
      for (const opp of response.opportunitiesData) {
        if (!seen.has(opp.noticeId)) {
          seen.add(opp.noticeId);
          koreaAwards.push(opp);
        }
      }
      offset += limit;
    } while (offset < totalRecords && offset < 5000);

    if (totalRecords > 5000) {
      console.warn(`[Sync] Awards 전체 ${totalRecords}건이 상한(5000)을 초과합니다.`);
    }
    console.log(`[Sync] Awards 전체 ${totalRecords}건 중 한국 관련 ${koreaAwards.length}건 필터링 완료`);

    let newCount = 0;

    const BATCH_SIZE = 50;
    for (let i = 0; i < koreaAwards.length; i += BATCH_SIZE) {
      const batch = koreaAwards.slice(i, i + BATCH_SIZE).map(parseAward);

      const results = await db
        .insert(awards)
        .values(batch)
        .onConflictDoUpdate({
          target: awards.noticeId,
          set: {
            title: sql`excluded.title`,
            awardeeName: sql`excluded.awardee_name`,
            awardeeUei: sql`excluded.awardee_uei`,
            awardAmount: sql`excluded.award_amount`,
            dateSigned: sql`excluded.date_signed`,
            naicsCode: sql`excluded.naics_code`,
            psc: sql`excluded.psc`,
            fundingAgency: sql`excluded.funding_agency`,
            fundingOffice: sql`excluded.funding_office`,
            performanceCountry: sql`excluded.performance_country`,
            rawData: sql`excluded.raw_data`,
          },
        })
        .returning({ id: awards.id });

      newCount += results.length;
    }

    const duration = Date.now() - startTime;
    await db
      .update(syncLogs)
      .set({
        status: "success",
        recordsFetched: koreaAwards.length,
        recordsNew: newCount,
        recordsUpdated: 0,
        duration,
        completedAt: new Date(),
      })
      .where(eq(syncLogs.id, log.id));

    return { fetched: koreaAwards.length, newCount };
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
