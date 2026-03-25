import { db } from "@/lib/db";
import { usaspendingAwards } from "@/lib/db/schema";
import { sql, count, gte, and, isNotNull, eq } from "drizzle-orm";
import { safeParseFloat } from "@/lib/utils";

export async function getNaicsPriceTrend(naicsCode: string, months = 24) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  return db
    .select({
      month: sql<string>`to_char(${usaspendingAwards.startDate}, 'YYYY-MM')`,
      count: count(),
      avgAmount: sql<string>`coalesce(avg(${usaspendingAwards.totalObligation}), 0)`,
      minAmount: sql<string>`coalesce(min(${usaspendingAwards.totalObligation}), 0)`,
      maxAmount: sql<string>`coalesce(max(${usaspendingAwards.totalObligation}), 0)`,
      totalAmount: sql<string>`coalesce(sum(${usaspendingAwards.totalObligation}), 0)`,
    })
    .from(usaspendingAwards)
    .where(and(
      eq(usaspendingAwards.naicsCode, naicsCode),
      gte(usaspendingAwards.startDate, since),
    ))
    .groupBy(sql`to_char(${usaspendingAwards.startDate}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${usaspendingAwards.startDate}, 'YYYY-MM')`)
    .then((rows) =>
      rows.map((r) => ({
        month: r.month,
        count: r.count,
        avgAmount: safeParseFloat(r.avgAmount),
        minAmount: safeParseFloat(r.minAmount),
        maxAmount: safeParseFloat(r.maxAmount),
        totalAmount: safeParseFloat(r.totalAmount),
      }))
    );
}

export async function getPscPriceSummary(months = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  return db
    .select({
      psc: usaspendingAwards.psc,
      pscDescription: usaspendingAwards.pscDescription,
      count: count(),
      avgAmount: sql<string>`coalesce(avg(${usaspendingAwards.totalObligation}), 0)`,
      minAmount: sql<string>`coalesce(min(${usaspendingAwards.totalObligation}), 0)`,
      maxAmount: sql<string>`coalesce(max(${usaspendingAwards.totalObligation}), 0)`,
      totalAmount: sql<string>`coalesce(sum(${usaspendingAwards.totalObligation}), 0)`,
      medianAmount: sql<string>`coalesce(percentile_cont(0.5) within group (order by ${usaspendingAwards.totalObligation}), 0)`,
    })
    .from(usaspendingAwards)
    .where(and(gte(usaspendingAwards.startDate, since), isNotNull(usaspendingAwards.psc)))
    .groupBy(usaspendingAwards.psc, usaspendingAwards.pscDescription)
    .having(sql`count(*) >= 2`)
    .orderBy(sql`sum(${usaspendingAwards.totalObligation}) desc`)
    .limit(20)
    .then((rows) =>
      rows.map((r) => ({
        psc: r.psc!,
        pscDescription: r.pscDescription,
        count: r.count,
        avgAmount: safeParseFloat(r.avgAmount),
        minAmount: safeParseFloat(r.minAmount),
        maxAmount: safeParseFloat(r.maxAmount),
        totalAmount: safeParseFloat(r.totalAmount),
        medianAmount: safeParseFloat(r.medianAmount),
      }))
    );
}

export async function getNaicsPriceSummary(months = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  return db
    .select({
      naicsCode: usaspendingAwards.naicsCode,
      naicsDescription: usaspendingAwards.naicsDescription,
      count: count(),
      avgAmount: sql<string>`coalesce(avg(${usaspendingAwards.totalObligation}), 0)`,
      minAmount: sql<string>`coalesce(min(${usaspendingAwards.totalObligation}), 0)`,
      maxAmount: sql<string>`coalesce(max(${usaspendingAwards.totalObligation}), 0)`,
      totalAmount: sql<string>`coalesce(sum(${usaspendingAwards.totalObligation}), 0)`,
      medianAmount: sql<string>`coalesce(percentile_cont(0.5) within group (order by ${usaspendingAwards.totalObligation}), 0)`,
    })
    .from(usaspendingAwards)
    .where(and(gte(usaspendingAwards.startDate, since), isNotNull(usaspendingAwards.naicsCode)))
    .groupBy(usaspendingAwards.naicsCode, usaspendingAwards.naicsDescription)
    .having(sql`count(*) >= 2`)
    .orderBy(sql`sum(${usaspendingAwards.totalObligation}) desc`)
    .limit(20)
    .then((rows) =>
      rows.map((r) => ({
        naicsCode: r.naicsCode!,
        naicsDescription: r.naicsDescription,
        count: r.count,
        avgAmount: safeParseFloat(r.avgAmount),
        minAmount: safeParseFloat(r.minAmount),
        maxAmount: safeParseFloat(r.maxAmount),
        totalAmount: safeParseFloat(r.totalAmount),
        medianAmount: safeParseFloat(r.medianAmount),
      }))
    );
}
