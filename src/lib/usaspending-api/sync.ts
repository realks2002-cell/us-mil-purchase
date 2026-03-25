import { db } from "@/lib/db";
import {
  usaspendingAwards, awards, vendors, vendorNaicsStats, syncLogs,
} from "@/lib/db/schema";
import { searchKoreaAwards, getAwardDetail, type UsaspendingAwardResult } from "./client";
import { and, eq, sql, isNotNull, desc } from "drizzle-orm";
import { getLastSuccessfulSyncDate, isAlreadyRunning } from "@/lib/services/sync-utils";

function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

function safeDateStr(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function safeDateSql(value: unknown) {
  const iso = safeDateStr(value);
  return iso ? sql`${iso}::timestamptz` : sql`null::timestamptz`;
}

function dateSql(value: Date | string | null | undefined) {
  if (value == null) return sql`null::timestamptz`;
  const iso = value instanceof Date ? value.toISOString() : safeDateStr(value);
  return iso ? sql`${iso}::timestamptz` : sql`null::timestamptz`;
}

function extractCodeAndDesc(field: string | { code: string; description: string } | null): { code: string | null; description: string | null } {
  if (!field) return { code: null, description: null };
  if (typeof field === "string") return { code: field, description: null };
  return { code: field.code || null, description: field.description || null };
}

function parseUsaspendingAward(item: UsaspendingAwardResult) {
  const naics = extractCodeAndDesc(item.NAICS);
  const psc = extractCodeAndDesc(item.PSC);

  return {
    awardId: item.generated_internal_id || String(item.internal_id),
    piid: item.PIID || null,
    awardeeName: item["Recipient Name"] || null,
    awardeeUei: item["Recipient UEI"] || null,
    totalObligation: item["Award Amount"] ? String(item["Award Amount"]) : null,
    baseAndAllOptions: null,
    competitionType: null,
    numberOfOffers: null,
    naicsCode: naics.code,
    naicsDescription: naics.description,
    psc: psc.code,
    pscDescription: psc.description,
    startDate: safeDateSql(item["Start Date"]),
    endDate: safeDateSql(item["End Date"]),
    fundingAgency: item["Funding Agency"] || null,
    fundingSubAgency: item["Funding Sub Agency"] || null,
    awardingAgency: item["Awarding Agency"] || null,
    performanceCountry: "KOR",
    performanceCity: typeof item["Place of Performance"] === "string" ? item["Place of Performance"] : null,
    setAside: null,
    rawData: item as unknown as Record<string, unknown>,
  };
}

export async function syncUsaspendingAwards(): Promise<{
  fetched: number;
  newCount: number;
  updatedCount: number;
  detailsEnriched: number;
}> {
  if (await isAlreadyRunning("usaspending")) {
    console.warn("[USAspending Sync] 이전 수집이 아직 실행 중입니다.");
    return { fetched: 0, newCount: 0, updatedCount: 0, detailsEnriched: 0 };
  }

  const startTime = Date.now();
  const [log] = await db
    .insert(syncLogs)
    .values({ apiType: "usaspending", status: "running" })
    .returning();

  try {
    const now = new Date();

    const lastSync = await getLastSuccessfulSyncDate("usaspending");
    const isInitialSync = !lastSync;
    const since = isInitialSync
      ? new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000)
      : new Date(lastSync.getTime() - 24 * 60 * 60 * 1000);
    const maxPages = isInitialSync ? 200 : 50;

    console.log(`[USAspending Sync] ${isInitialSync ? '초기(730일)' : `증분(since: ${formatDateISO(since)})`} 수집, 최대 ${maxPages}페이지`);

    let allResults: UsaspendingAwardResult[] = [];
    let page = 1;
    let hasNext = true;

    while (hasNext && page <= maxPages) {
      const response = await searchKoreaAwards({
        dateRange: {
          start_date: formatDateISO(since),
          end_date: formatDateISO(now),
        },
        page,
        limit: 100,
      });

      allResults = allResults.concat(response.results);
      hasNext = response.page_metadata.hasNext;
      page++;
    }

    console.log(`[USAspending Sync] ${allResults.length}건 수집 완료`);

    // 중복 awardId 제거 (USAspending 결과에 동일 award가 중복 반환될 수 있음)
    const seen = new Set<string>();
    const deduped = allResults.filter((item) => {
      const key = item.generated_internal_id || String(item.internal_id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (deduped.length < allResults.length) {
      console.log(`[USAspending Sync] 중복 ${allResults.length - deduped.length}건 제거 → ${deduped.length}건`);
    }

    let newCount = 0;
    let updatedCount = 0;

    const BATCH_SIZE = 50;
    for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
      const batch = deduped.slice(i, i + BATCH_SIZE).map(parseUsaspendingAward);

      if (i === 0 && batch.length > 0) {
        const sample = { ...batch[0], startDate: safeDateStr(deduped[0]["Start Date"]), endDate: safeDateStr(deduped[0]["End Date"]) };
        console.log("[USAspending Sync] 첫 레코드 샘플:", JSON.stringify(sample, null, 2));
      }

      try {
        const results = await db
          .insert(usaspendingAwards)
          .values(batch as any)
          .onConflictDoUpdate({
            target: usaspendingAwards.awardId,
            set: {
              awardeeName: sql`excluded.awardee_name`,
              awardeeUei: sql`excluded.awardee_uei`,
              totalObligation: sql`excluded.total_obligation`,
              naicsCode: sql`excluded.naics_code`,
              psc: sql`excluded.psc`,
              startDate: sql`excluded.start_date`,
              endDate: sql`excluded.end_date`,
              fundingAgency: sql`excluded.funding_agency`,
              fundingSubAgency: sql`excluded.funding_sub_agency`,
              awardingAgency: sql`excluded.awarding_agency`,
              performanceCity: sql`excluded.performance_city`,
              rawData: sql`excluded.raw_data`,
              updatedAt: sql`now()`,
            },
          })
          .returning({ id: usaspendingAwards.id });

        newCount += results.length;
      } catch (batchError) {
        console.error(`[USAspending Sync] 배치 실패 (${batch.length}건), 개별 insert 시도:`, batchError);
        for (const record of batch) {
          try {
            const results = await db
              .insert(usaspendingAwards)
              .values(record as any)
              .onConflictDoUpdate({
                target: usaspendingAwards.awardId,
                set: {
                  awardeeName: sql`excluded.awardee_name`,
                  awardeeUei: sql`excluded.awardee_uei`,
                  totalObligation: sql`excluded.total_obligation`,
                  naicsCode: sql`excluded.naics_code`,
                  psc: sql`excluded.psc`,
                  startDate: sql`excluded.start_date`,
                  endDate: sql`excluded.end_date`,
                  fundingAgency: sql`excluded.funding_agency`,
                  fundingSubAgency: sql`excluded.funding_sub_agency`,
                  awardingAgency: sql`excluded.awarding_agency`,
                  performanceCity: sql`excluded.performance_city`,
                  rawData: sql`excluded.raw_data`,
                  updatedAt: sql`now()`,
                },
              })
              .returning({ id: usaspendingAwards.id });

            newCount += results.length;
          } catch (recordError) {
            console.error(`[USAspending Sync] 레코드 실패: ${record.awardId}`, recordError);
          }
        }
      }
    }

    updatedCount = Math.max(0, newCount - deduped.length);
    newCount = deduped.length;

    // 상세 정보 보강 (경쟁 유형, 입찰 참여 수 등) — 최근 수집 건 중 미보강 건
    const detailsEnriched = await enrichAwardDetails(20);

    // SAM.gov award와 piid 기준 매칭
    await matchWithSamAwards();

    // 벤더 프로필 갱신
    await syncVendorProfilesFromAwards();

    const duration = Date.now() - startTime;
    await db
      .update(syncLogs)
      .set({
        status: "success",
        recordsFetched: deduped.length,
        recordsNew: newCount,
        recordsUpdated: updatedCount,
        duration,
        completedAt: new Date(),
      })
      .where(eq(syncLogs.id, log.id));

    return { fetched: deduped.length, newCount, updatedCount, detailsEnriched };
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error("[USAspending Sync] 에러 전문:", error);
    if (error instanceof Error && error.cause) {
      console.error("[USAspending Sync] cause:", error.cause);
    }

    let errorMsg = error instanceof Error ? error.message : String(error);
    const cause = error instanceof Error ? (error as any).cause : undefined;
    // cause가 없을 경우 error 자체에서 code/detail 확인 (일부 pg 드라이버)
    const pgError = cause || (error as any);
    const details = [
      pgError?.code && `Code: ${pgError.code}`,
      pgError?.detail && `Detail: ${pgError.detail}`,
      pgError?.severity && `Severity: ${pgError.severity}`,
      pgError?.column_name && `Column: ${pgError.column_name}`,
      pgError?.constraint_name && `Constraint: ${pgError.constraint_name}`,
      pgError?.table_name && `Table: ${pgError.table_name}`,
    ].filter(Boolean).join(" | ");
    if (details) errorMsg = `${details} | ${errorMsg.slice(0, 200)}`;

    await db
      .update(syncLogs)
      .set({
        status: "failed",
        errorMessage: errorMsg,
        duration,
        completedAt: new Date(),
      })
      .where(eq(syncLogs.id, log.id));
    throw error;
  }
}

async function enrichAwardDetails(limit: number): Promise<number> {
  const toEnrich = await db
    .select({ id: usaspendingAwards.id, awardId: usaspendingAwards.awardId })
    .from(usaspendingAwards)
    .where(sql`${usaspendingAwards.competitionType} is null`)
    .limit(limit);

  let enriched = 0;
  const BATCH = 5;

  for (let i = 0; i < toEnrich.length; i += BATCH) {
    const batch = toEnrich.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map((a) => getAwardDetail(a.awardId))
    );

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      if (result.status !== "fulfilled") continue;

      const detail = result.value;
      const txData = detail.latest_transaction_contract_data;

      await db
        .update(usaspendingAwards)
        .set({
          competitionType: txData?.extent_competed || detail.extent_competed || null,
          numberOfOffers: txData?.number_of_offers_received
            ? parseInt(txData.number_of_offers_received, 10)
            : detail.number_of_offers_received || null,
          baseAndAllOptions: detail.base_and_all_options_value
            ? String(detail.base_and_all_options_value)
            : null,
          naicsDescription: txData?.naics_description || detail.naics_description || null,
          pscDescription: txData?.product_or_service_co_desc || detail.psc_description || null,
          setAside: txData?.type_of_set_aside_description || detail.type_of_set_aside_description || null,
          rawData: detail as unknown as Record<string, unknown>,
        })
        .where(eq(usaspendingAwards.id, batch[j].id));

      enriched++;
    }
  }

  console.log(`[USAspending Sync] ${enriched}건 상세 정보 보강 완료`);
  return enriched;
}

async function matchWithSamAwards() {
  await db.execute(sql`
    UPDATE us_mil_usaspending_awards usa
    SET sam_award_id = sa.id
    FROM us_mil_awards sa
    WHERE usa.piid IS NOT NULL
      AND sa.contract_number IS NOT NULL
      AND usa.piid = sa.contract_number
      AND usa.sam_award_id IS NULL
  `);
}

async function syncVendorProfilesFromAwards() {
  // 1) 벤더별 집계 (단일 쿼리)
  const vendorData = await db
    .select({
      uei: usaspendingAwards.awardeeUei,
      name: usaspendingAwards.awardeeName,
      totalCount: sql<number>`count(*)`,
      totalAmount: sql<string>`coalesce(sum(${usaspendingAwards.totalObligation}), 0)`,
      avgAmount: sql<string>`coalesce(avg(${usaspendingAwards.totalObligation}), 0)`,
      competitiveWins: sql<number>`count(*) filter (where ${usaspendingAwards.competitionType} in ('A', 'FULL_AND_OPEN', 'FULL AND OPEN COMPETITION', 'CDO', 'COMPETED UNDER SAP'))`,
      soleSource: sql<number>`count(*) filter (where ${usaspendingAwards.competitionType} in ('SSS', 'SOLE SOURCE', 'NOT COMPETED', 'NOT AVAILABLE FOR COMPETITION'))`,
      lastAward: sql<Date>`max(${usaspendingAwards.startDate})`,
    })
    .from(usaspendingAwards)
    .where(isNotNull(usaspendingAwards.awardeeUei))
    .groupBy(usaspendingAwards.awardeeUei, usaspendingAwards.awardeeName);

  // 2) 전체 NAICS 분포를 한 번에 조회 (N+1 → 1 쿼리)
  const allNaicsDistribution = await db
    .select({
      uei: usaspendingAwards.awardeeUei,
      naicsCode: usaspendingAwards.naicsCode,
      count: sql<number>`count(*)`,
      totalAmount: sql<string>`coalesce(sum(${usaspendingAwards.totalObligation}), 0)`,
      avgAmount: sql<string>`coalesce(avg(${usaspendingAwards.totalObligation}), 0)`,
      competitiveWins: sql<number>`count(*) filter (where ${usaspendingAwards.competitionType} in ('A', 'FULL_AND_OPEN', 'FULL AND OPEN COMPETITION', 'CDO', 'COMPETED UNDER SAP'))`,
      soleSource: sql<number>`count(*) filter (where ${usaspendingAwards.competitionType} in ('SSS', 'SOLE SOURCE', 'NOT COMPETED', 'NOT AVAILABLE FOR COMPETITION'))`,
      lastAward: sql<Date>`max(${usaspendingAwards.startDate})`,
    })
    .from(usaspendingAwards)
    .where(and(isNotNull(usaspendingAwards.awardeeUei), isNotNull(usaspendingAwards.naicsCode)))
    .groupBy(usaspendingAwards.awardeeUei, usaspendingAwards.naicsCode);

  // 3) 전체 PSC 분포를 한 번에 조회
  const allPscDistribution = await db
    .select({
      uei: usaspendingAwards.awardeeUei,
      psc: usaspendingAwards.psc,
      count: sql<number>`count(*)`,
    })
    .from(usaspendingAwards)
    .where(and(isNotNull(usaspendingAwards.awardeeUei), isNotNull(usaspendingAwards.psc)))
    .groupBy(usaspendingAwards.awardeeUei, usaspendingAwards.psc);

  // 인메모리 맵 구성
  const naicsMap = new Map<string, typeof allNaicsDistribution>();
  for (const row of allNaicsDistribution) {
    if (!row.uei) continue;
    const list = naicsMap.get(row.uei) ?? [];
    list.push(row);
    naicsMap.set(row.uei, list);
  }

  const pscMap = new Map<string, typeof allPscDistribution>();
  for (const row of allPscDistribution) {
    if (!row.uei) continue;
    const list = pscMap.get(row.uei) ?? [];
    list.push(row);
    pscMap.set(row.uei, list);
  }

  for (const v of vendorData) {
    if (!v.uei || !v.name) continue;

    const naicsDistribution = (naicsMap.get(v.uei) ?? [])
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const pscDistribution = (pscMap.get(v.uei) ?? [])
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    await db
      .insert(vendors)
      .values({
        uei: v.uei,
        name: v.name,
        totalAwardCount: v.totalCount,
        totalAwardAmount: v.totalAmount,
        primaryNaics: naicsDistribution.map((n) => n.naicsCode!),
        primaryPsc: pscDistribution.map((p) => p.psc!),
        competitiveWinCount: v.competitiveWins,
        soleSourceCount: v.soleSource,
        avgContractValue: v.avgAmount,
        lastAwardDate: dateSql(v.lastAward),
      } as any)
      .onConflictDoUpdate({
        target: vendors.uei,
        set: {
          name: sql`excluded.name`,
          totalAwardCount: sql`excluded.total_award_count`,
          totalAwardAmount: sql`excluded.total_award_amount`,
          primaryNaics: sql`excluded.primary_naics`,
          primaryPsc: sql`excluded.primary_psc`,
          competitiveWinCount: sql`excluded.competitive_win_count`,
          soleSourceCount: sql`excluded.sole_source_count`,
          avgContractValue: sql`excluded.avg_contract_value`,
          lastAwardDate: sql`excluded.last_award_date`,
          updatedAt: sql`now()`,
        },
      });

    // NAICS별 세부 통계 (이미 조회된 데이터 사용 — 추가 쿼리 없음)
    for (const n of naicsDistribution) {
      if (!n.naicsCode) continue;

      await db
        .insert(vendorNaicsStats)
        .values({
          vendorUei: v.uei,
          naicsCode: n.naicsCode,
          awardCount: n.count,
          totalAmount: n.totalAmount,
          avgAmount: n.avgAmount,
          competitiveWinCount: n.competitiveWins,
          soleSourceCount: n.soleSource,
          lastAwardDate: dateSql(n.lastAward),
        } as any)
        .onConflictDoUpdate({
          target: [vendorNaicsStats.vendorUei, vendorNaicsStats.naicsCode],
          set: {
            awardCount: sql`excluded.award_count`,
            totalAmount: sql`excluded.total_amount`,
            avgAmount: sql`excluded.avg_amount`,
            competitiveWinCount: sql`excluded.competitive_win_count`,
            soleSourceCount: sql`excluded.sole_source_count`,
            lastAwardDate: sql`excluded.last_award_date`,
            updatedAt: sql`now()`,
          },
        });
    }
  }

  console.log(`[USAspending Sync] ${vendorData.length}개 벤더 프로필 갱신 완료`);
}
