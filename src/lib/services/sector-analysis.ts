import { db } from "@/lib/db";
import { usaspendingAwards } from "@/lib/db/schema";
import { sql, count, gte, and, isNotNull, lt } from "drizzle-orm";
import { safeParseFloat } from "@/lib/utils";

export async function getGrowingSectors() {
  const now = new Date();
  const thisYear = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  const lastYear = new Date(now.getFullYear() - 2, now.getMonth(), 1);

  const [current, previous] = await Promise.all([
    db
      .select({
        naicsCode: usaspendingAwards.naicsCode,
        naicsDescription: usaspendingAwards.naicsDescription,
        count: count(),
        amount: sql<string>`coalesce(sum(${usaspendingAwards.totalObligation}), 0)`,
      })
      .from(usaspendingAwards)
      .where(and(gte(usaspendingAwards.startDate, thisYear), isNotNull(usaspendingAwards.naicsCode)))
      .groupBy(usaspendingAwards.naicsCode, usaspendingAwards.naicsDescription)
      .orderBy(sql`sum(${usaspendingAwards.totalObligation}) desc nulls last`)
      .limit(50),
    db
      .select({
        naicsCode: usaspendingAwards.naicsCode,
        count: count(),
        amount: sql<string>`coalesce(sum(${usaspendingAwards.totalObligation}), 0)`,
      })
      .from(usaspendingAwards)
      .where(and(
        gte(usaspendingAwards.startDate, lastYear),
        lt(usaspendingAwards.startDate, thisYear),
        isNotNull(usaspendingAwards.naicsCode),
      ))
      .groupBy(usaspendingAwards.naicsCode)
      .orderBy(sql`sum(${usaspendingAwards.totalObligation}) desc nulls last`)
      .limit(50),
  ]);

  const prevMap = new Map(previous.map((p) => [p.naicsCode!, { count: p.count, amount: safeParseFloat(p.amount) }]));

  return current
    .map((c) => {
      const prev = prevMap.get(c.naicsCode!) ?? { count: 0, amount: 0 };
      const curAmount = safeParseFloat(c.amount);
      const growthRate = prev.amount > 0
        ? Math.round(((curAmount - prev.amount) / prev.amount) * 1000) / 10
        : curAmount > 0 ? 100 : 0;

      return {
        naicsCode: c.naicsCode!,
        naicsDescription: c.naicsDescription,
        currentCount: c.count,
        currentAmount: curAmount,
        previousCount: prev.count,
        previousAmount: prev.amount,
        growthRate,
        countGrowth: prev.count > 0
          ? Math.round(((c.count - prev.count) / prev.count) * 1000) / 10
          : c.count > 0 ? 100 : 0,
      };
    })
    .sort((a, b) => b.growthRate - a.growthRate);
}

export async function getNaicsDistribution() {
  return db
    .select({
      naicsCode: usaspendingAwards.naicsCode,
      naicsDescription: usaspendingAwards.naicsDescription,
      count: count(),
      amount: sql<string>`coalesce(sum(${usaspendingAwards.totalObligation}), 0)`,
    })
    .from(usaspendingAwards)
    .where(isNotNull(usaspendingAwards.naicsCode))
    .groupBy(usaspendingAwards.naicsCode, usaspendingAwards.naicsDescription)
    .orderBy(sql`sum(${usaspendingAwards.totalObligation}) desc nulls last`)
    .limit(20)
    .then((rows) =>
      rows.map((r) => ({
        naicsCode: r.naicsCode!,
        naicsDescription: r.naicsDescription,
        count: r.count,
        amount: safeParseFloat(r.amount),
      }))
    );
}

export async function getUsaspendingTotalCount() {
  const result = await db.select({ value: count() }).from(usaspendingAwards);
  return result[0].value;
}

export async function getLowCompetitionSectors(months = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  return db
    .select({
      naicsCode: usaspendingAwards.naicsCode,
      naicsDescription: usaspendingAwards.naicsDescription,
      count: count(),
      amount: sql<string>`coalesce(sum(${usaspendingAwards.totalObligation}), 0)`,
      avgOffers: sql<string>`coalesce(avg(${usaspendingAwards.numberOfOffers}), 0)`,
      uniqueVendors: sql<number>`count(distinct ${usaspendingAwards.awardeeUei})`,
      soleSourceRate: sql<number>`round(count(*) filter (where ${usaspendingAwards.competitionType} in ('SSS', 'SOLE_SOURCE', 'SOLE SOURCE', 'NOT COMPETED', 'NOT AVAILABLE FOR COMPETITION'))::numeric / nullif(count(*), 0) * 100, 1)`,
    })
    .from(usaspendingAwards)
    .where(and(
      gte(usaspendingAwards.startDate, since),
      isNotNull(usaspendingAwards.naicsCode),
    ))
    .groupBy(usaspendingAwards.naicsCode, usaspendingAwards.naicsDescription)
    .having(sql`count(*) >= 1`)
    .orderBy(sql`avg(${usaspendingAwards.numberOfOffers}) asc nulls last`)
    .limit(15)
    .then((rows) =>
      rows.map((r) => ({
        naicsCode: r.naicsCode!,
        naicsDescription: r.naicsDescription,
        count: r.count,
        amount: safeParseFloat(r.amount),
        avgOffers: safeParseFloat(r.avgOffers),
        uniqueVendors: r.uniqueVendors,
        soleSourceRate: r.soleSourceRate,
      }))
    );
}
