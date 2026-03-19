import { db } from "@/lib/db";
import { awards } from "@/lib/db/schema";
import { desc, sql, count, eq, gte, and, isNotNull, inArray } from "drizzle-orm";
import { safeParseFloat } from "@/lib/utils";

export async function getAwardStats(months = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const [result] = await db
    .select({
      totalCount: count(),
      totalAmount: sql<string>`coalesce(sum(${awards.awardAmount}), 0)`,
      avgAmount: sql<string>`coalesce(avg(${awards.awardAmount}), 0)`,
      uniqueAwardees: sql<number>`count(distinct ${awards.awardeeName})`,
    })
    .from(awards)
    .where(gte(awards.dateSigned, since));

  return {
    totalCount: result.totalCount,
    totalAmount: safeParseFloat(result.totalAmount),
    avgAmount: safeParseFloat(result.avgAmount),
    uniqueAwardees: result.uniqueAwardees,
  };
}

export async function getMonthlyTrend(months = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const result = await db
    .select({
      month: sql<string>`to_char(${awards.dateSigned}, 'YYYY-MM')`,
      count: count(),
      amount: sql<string>`coalesce(sum(${awards.awardAmount}), 0)`,
    })
    .from(awards)
    .where(gte(awards.dateSigned, since))
    .groupBy(sql`to_char(${awards.dateSigned}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${awards.dateSigned}, 'YYYY-MM')`);

  return result.map((r) => ({
    month: r.month,
    count: r.count,
    amount: safeParseFloat(r.amount),
  }));
}

export async function getNaicsBreakdown(months = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  return db
    .select({
      naicsCode: awards.naicsCode,
      count: count(),
      amount: sql<string>`coalesce(sum(${awards.awardAmount}), 0)`,
    })
    .from(awards)
    .where(and(gte(awards.dateSigned, since), isNotNull(awards.naicsCode)))
    .groupBy(awards.naicsCode)
    .orderBy(desc(sql`sum(${awards.awardAmount})`))
    .limit(10)
    .then((rows) =>
      rows.map((r) => ({
        naicsCode: r.naicsCode!,
        count: r.count,
        amount: safeParseFloat(r.amount),
      }))
    );
}

export async function getAmountDistribution(months = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const [result] = await db
    .select({
      r1: sql<number>`count(*) filter (where ${awards.awardAmount} >= 0 and ${awards.awardAmount} < 100000)`,
      r2: sql<number>`count(*) filter (where ${awards.awardAmount} >= 100000 and ${awards.awardAmount} < 1000000)`,
      r3: sql<number>`count(*) filter (where ${awards.awardAmount} >= 1000000 and ${awards.awardAmount} < 5000000)`,
      r4: sql<number>`count(*) filter (where ${awards.awardAmount} >= 5000000 and ${awards.awardAmount} < 25000000)`,
      r5: sql<number>`count(*) filter (where ${awards.awardAmount} >= 25000000 and ${awards.awardAmount} < 100000000)`,
      r6: sql<number>`count(*) filter (where ${awards.awardAmount} >= 100000000)`,
    })
    .from(awards)
    .where(gte(awards.dateSigned, since));

  const ranges = [
    { range: "< $100K", count: result.r1 },
    { range: "$100K - $1M", count: result.r2 },
    { range: "$1M - $5M", count: result.r3 },
    { range: "$5M - $25M", count: result.r4 },
    { range: "$25M - $100M", count: result.r5 },
    { range: "> $100M", count: result.r6 },
  ];

  const total = ranges.reduce((s, r) => s + r.count, 0);
  return ranges.map((r) => ({
    ...r,
    pct: total > 0 ? Math.round((r.count / total) * 1000) / 10 : 0,
  }));
}

export async function getTopAwardees(limit = 10, months = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  return db
    .select({
      awardeeName: awards.awardeeName,
      awardeeUei: awards.awardeeUei,
      count: count(),
      totalAmount: sql<string>`coalesce(sum(${awards.awardAmount}), 0)`,
      avgAmount: sql<string>`coalesce(avg(${awards.awardAmount}), 0)`,
    })
    .from(awards)
    .where(and(gte(awards.dateSigned, since), isNotNull(awards.awardeeName)))
    .groupBy(awards.awardeeName, awards.awardeeUei)
    .orderBy(desc(sql`sum(${awards.awardAmount})`))
    .limit(limit)
    .then((rows) =>
      rows.map((r, i) => ({
        rank: i + 1,
        name: r.awardeeName!,
        uei: r.awardeeUei,
        count: r.count,
        totalAmount: safeParseFloat(r.totalAmount),
        avgAmount: safeParseFloat(r.avgAmount),
      }))
    );
}

export async function getCompetitorDetails(awardeeNames: string[]) {
  if (awardeeNames.length === 0) return {};

  const [recentAwards, naicsBreakdowns] = await Promise.all([
    db
      .select({
        awardeeName: awards.awardeeName,
        title: awards.title,
        amount: awards.awardAmount,
        date: awards.dateSigned,
        naicsCode: awards.naicsCode,
      })
      .from(awards)
      .where(inArray(awards.awardeeName, awardeeNames))
      .orderBy(desc(awards.dateSigned))
      .limit(awardeeNames.length * 5),
    db
      .select({
        awardeeName: awards.awardeeName,
        naicsCode: awards.naicsCode,
        count: count(),
      })
      .from(awards)
      .where(and(inArray(awards.awardeeName, awardeeNames), isNotNull(awards.naicsCode)))
      .groupBy(awards.awardeeName, awards.naicsCode)
      .orderBy(desc(count())),
  ]);

  const result: Record<string, {
    recentAwards: typeof recentAwards;
    naicsBreakdown: typeof naicsBreakdowns;
  }> = {};

  for (const name of awardeeNames) {
    result[name] = {
      recentAwards: recentAwards.filter((a) => a.awardeeName === name).slice(0, 5),
      naicsBreakdown: naicsBreakdowns.filter((n) => n.awardeeName === name).slice(0, 5),
    };
  }

  return result;
}

export async function getRecentAwards(limit = 5) {
  return db
    .select()
    .from(awards)
    .orderBy(desc(awards.dateSigned))
    .limit(limit);
}
