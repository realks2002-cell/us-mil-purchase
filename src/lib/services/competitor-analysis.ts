import { db } from "@/lib/db";
import { usaspendingAwards, vendors, vendorNaicsStats } from "@/lib/db/schema";
import { desc, eq, sql, count, and, gte, isNotNull, or } from "drizzle-orm";
import { safeParseFloat } from "@/lib/utils";

const koreaFilter = or(eq(usaspendingAwards.performanceCountry, "KOR"), eq(usaspendingAwards.performanceCountry, "KR"));

export async function getVendorProfile(uei: string) {
  const vendor = await db.query.vendors.findFirst({
    where: eq(vendors.uei, uei),
  });

  if (!vendor) return null;

  const naicsStats = await db
    .select()
    .from(vendorNaicsStats)
    .where(eq(vendorNaicsStats.vendorUei, uei))
    .orderBy(desc(vendorNaicsStats.awardCount));

  return { ...vendor, naicsStats };
}

export async function getVendorWinHistory(uei: string, months = 24) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const monthly = await db
    .select({
      month: sql<string>`to_char(${usaspendingAwards.startDate}, 'YYYY-MM')`,
      count: count(),
      amount: sql<string>`coalesce(sum(${usaspendingAwards.totalObligation}), 0)`,
    })
    .from(usaspendingAwards)
    .where(and(
      eq(usaspendingAwards.awardeeUei, uei),
      gte(usaspendingAwards.startDate, since),
      koreaFilter,
    ))
    .groupBy(sql`to_char(${usaspendingAwards.startDate}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${usaspendingAwards.startDate}, 'YYYY-MM')`);

  return monthly.map((r) => ({
    month: r.month,
    count: r.count,
    amount: safeParseFloat(r.amount),
  }));
}

export async function getVendorRecentAwards(uei: string, limit = 20) {
  return db
    .select({
      id: usaspendingAwards.id,
      awardId: usaspendingAwards.awardId,
      piid: usaspendingAwards.piid,
      totalObligation: usaspendingAwards.totalObligation,
      competitionType: usaspendingAwards.competitionType,
      numberOfOffers: usaspendingAwards.numberOfOffers,
      naicsCode: usaspendingAwards.naicsCode,
      naicsDescription: usaspendingAwards.naicsDescription,
      startDate: usaspendingAwards.startDate,
      endDate: usaspendingAwards.endDate,
      fundingAgency: usaspendingAwards.fundingAgency,
      awardingAgency: usaspendingAwards.awardingAgency,
    })
    .from(usaspendingAwards)
    .where(and(eq(usaspendingAwards.awardeeUei, uei), koreaFilter))
    .orderBy(desc(usaspendingAwards.startDate))
    .limit(limit);
}

export async function getCompetitionTypeAnalysis(months = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const result = await db
    .select({
      competitionType: usaspendingAwards.competitionType,
      count: count(),
      totalAmount: sql<string>`coalesce(sum(${usaspendingAwards.totalObligation}), 0)`,
    })
    .from(usaspendingAwards)
    .where(and(
      gte(usaspendingAwards.startDate, since),
      isNotNull(usaspendingAwards.competitionType),
      koreaFilter,
    ))
    .groupBy(usaspendingAwards.competitionType)
    .orderBy(desc(count()));

  const competitionMap: Record<string, string> = {
    A: "경쟁입찰",
    FULL_AND_OPEN: "경쟁입찰",
    "FULL AND OPEN COMPETITION": "경쟁입찰",
    CDO: "경쟁입찰",
    "COMPETED UNDER SAP": "경쟁입찰",
    SSS: "단독수의",
    SOLE_SOURCE: "단독수의",
    "SOLE SOURCE": "단독수의",
    "NOT COMPETED": "비경쟁",
    "NOT AVAILABLE FOR COMPETITION": "비경쟁",
  };

  const grouped: Record<string, { count: number; amount: number }> = {};
  for (const r of result) {
    const label = competitionMap[r.competitionType ?? ""] ?? "기타";
    if (!grouped[label]) grouped[label] = { count: 0, amount: 0 };
    grouped[label].count += r.count;
    grouped[label].amount += safeParseFloat(r.totalAmount);
  }

  return Object.entries(grouped).map(([type, data]) => ({
    type,
    count: data.count,
    amount: data.amount,
  }));
}

export async function getMarketShareByNaics(naicsCode: string, months = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  return db
    .select({
      name: usaspendingAwards.awardeeName,
      uei: usaspendingAwards.awardeeUei,
      count: count(),
      totalAmount: sql<string>`coalesce(sum(${usaspendingAwards.totalObligation}), 0)`,
      avgAmount: sql<string>`coalesce(avg(${usaspendingAwards.totalObligation}), 0)`,
    })
    .from(usaspendingAwards)
    .where(and(
      eq(usaspendingAwards.naicsCode, naicsCode),
      gte(usaspendingAwards.startDate, since),
      isNotNull(usaspendingAwards.awardeeName),
      koreaFilter,
    ))
    .groupBy(usaspendingAwards.awardeeName, usaspendingAwards.awardeeUei)
    .orderBy(desc(sql`sum(${usaspendingAwards.totalObligation})`))
    .limit(10)
    .then((rows) =>
      rows.map((r) => ({
        name: r.name!,
        uei: r.uei,
        count: r.count,
        totalAmount: safeParseFloat(r.totalAmount),
        avgAmount: safeParseFloat(r.avgAmount),
      }))
    );
}

export async function getHeadToHead(ueiA: string, ueiB: string, months = 24) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  async function getVendorSummary(uei: string) {
    const [stats] = await db
      .select({
        totalCount: count(),
        totalAmount: sql<string>`coalesce(sum(${usaspendingAwards.totalObligation}), 0)`,
        avgAmount: sql<string>`coalesce(avg(${usaspendingAwards.totalObligation}), 0)`,
        competitiveWins: sql<number>`count(*) filter (where ${usaspendingAwards.competitionType} in ('A', 'FULL_AND_OPEN', 'FULL AND OPEN COMPETITION', 'CDO', 'COMPETED UNDER SAP'))`,
        soleSource: sql<number>`count(*) filter (where ${usaspendingAwards.competitionType} in ('SSS', 'SOLE_SOURCE', 'SOLE SOURCE', 'NOT COMPETED', 'NOT AVAILABLE FOR COMPETITION'))`,
        avgOffers: sql<string>`coalesce(avg(${usaspendingAwards.numberOfOffers}), 0)`,
      })
      .from(usaspendingAwards)
      .where(and(eq(usaspendingAwards.awardeeUei, uei), gte(usaspendingAwards.startDate, since), koreaFilter));

    const vendor = await db.query.vendors.findFirst({ where: eq(vendors.uei, uei) });

    const topNaics = await db
      .select({
        naicsCode: usaspendingAwards.naicsCode,
        count: count(),
        amount: sql<string>`coalesce(sum(${usaspendingAwards.totalObligation}), 0)`,
      })
      .from(usaspendingAwards)
      .where(and(
        eq(usaspendingAwards.awardeeUei, uei),
        gte(usaspendingAwards.startDate, since),
        isNotNull(usaspendingAwards.naicsCode),
        koreaFilter,
      ))
      .groupBy(usaspendingAwards.naicsCode)
      .orderBy(desc(sql`sum(${usaspendingAwards.totalObligation})`))
      .limit(5);

    return {
      name: vendor?.name ?? uei,
      uei,
      totalCount: stats.totalCount,
      totalAmount: safeParseFloat(stats.totalAmount),
      avgAmount: safeParseFloat(stats.avgAmount),
      competitiveWins: stats.competitiveWins,
      soleSource: stats.soleSource,
      avgOffers: safeParseFloat(stats.avgOffers),
      topNaics: topNaics.map((n) => ({
        naicsCode: n.naicsCode!,
        count: n.count,
        amount: safeParseFloat(n.amount),
      })),
    };
  }

  const [vendorA, vendorB] = await Promise.all([
    getVendorSummary(ueiA),
    getVendorSummary(ueiB),
  ]);

  // 공통 NAICS 분야
  const naicsA = new Set(vendorA.topNaics.map((n) => n.naicsCode));
  const commonNaics = vendorB.topNaics
    .filter((n) => naicsA.has(n.naicsCode))
    .map((n) => n.naicsCode);

  return { vendorA, vendorB, commonNaics };
}

export async function getVendorSpecialties(uei: string) {
  return db
    .select()
    .from(vendorNaicsStats)
    .where(eq(vendorNaicsStats.vendorUei, uei))
    .orderBy(desc(vendorNaicsStats.totalAmount));
}

export async function getMarketOverview(months = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const [stats] = await db
    .select({
      totalContracts: count(),
      totalAmount: sql<string>`coalesce(sum(${usaspendingAwards.totalObligation}), 0)`,
      avgAmount: sql<string>`coalesce(avg(${usaspendingAwards.totalObligation}), 0)`,
      uniqueVendors: sql<number>`count(distinct ${usaspendingAwards.awardeeUei})`,
      avgOffers: sql<string>`coalesce(avg(${usaspendingAwards.numberOfOffers}), 0)`,
      competitiveCount: sql<number>`count(*) filter (where ${usaspendingAwards.competitionType} in ('A', 'FULL_AND_OPEN', 'FULL AND OPEN COMPETITION', 'CDO', 'COMPETED UNDER SAP'))`,
    })
    .from(usaspendingAwards)
    .where(and(gte(usaspendingAwards.startDate, since), koreaFilter));

  return {
    totalContracts: stats.totalContracts,
    totalAmount: safeParseFloat(stats.totalAmount),
    avgAmount: safeParseFloat(stats.avgAmount),
    uniqueVendors: stats.uniqueVendors,
    avgOffers: safeParseFloat(stats.avgOffers),
    competitiveRate: stats.totalContracts > 0
      ? Math.round((stats.competitiveCount / stats.totalContracts) * 1000) / 10
      : 0,
  };
}

export async function getTopVendors(limit = 10, months = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  return db
    .select({
      name: usaspendingAwards.awardeeName,
      uei: usaspendingAwards.awardeeUei,
      count: count(),
      totalAmount: sql<string>`coalesce(sum(${usaspendingAwards.totalObligation}), 0)`,
      avgAmount: sql<string>`coalesce(avg(${usaspendingAwards.totalObligation}), 0)`,
      competitiveWins: sql<number>`count(*) filter (where ${usaspendingAwards.competitionType} in ('A', 'FULL_AND_OPEN', 'FULL AND OPEN COMPETITION', 'CDO', 'COMPETED UNDER SAP'))`,
      soleSource: sql<number>`count(*) filter (where ${usaspendingAwards.competitionType} in ('SSS', 'SOLE_SOURCE', 'SOLE SOURCE', 'NOT COMPETED', 'NOT AVAILABLE FOR COMPETITION'))`,
    })
    .from(usaspendingAwards)
    .where(and(gte(usaspendingAwards.startDate, since), isNotNull(usaspendingAwards.awardeeName), koreaFilter))
    .groupBy(usaspendingAwards.awardeeName, usaspendingAwards.awardeeUei)
    .orderBy(desc(sql`sum(${usaspendingAwards.totalObligation})`))
    .limit(limit)
    .then((rows) =>
      rows.map((r, i) => ({
        rank: i + 1,
        name: r.name!,
        uei: r.uei,
        count: r.count,
        totalAmount: safeParseFloat(r.totalAmount),
        avgAmount: safeParseFloat(r.avgAmount),
        competitiveWins: r.competitiveWins,
        soleSource: r.soleSource,
        competitiveRate: r.count > 0
          ? Math.round((r.competitiveWins / r.count) * 1000) / 10
          : 0,
      }))
    );
}
