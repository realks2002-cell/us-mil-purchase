import { db } from "@/lib/db";
import { usaspendingAwards } from "@/lib/db/schema";
import { sql, count, gte, isNotNull, and, or, eq } from "drizzle-orm";
import { safeParseFloat } from "@/lib/utils";

const koreaFilter = or(eq(usaspendingAwards.performanceCountry, "KOR"), eq(usaspendingAwards.performanceCountry, "KR"));

export async function getMonthlyOrderingPattern(months = 24) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  return db
    .select({
      month: sql<string>`to_char(${usaspendingAwards.startDate}, 'YYYY-MM')`,
      count: count(),
      amount: sql<string>`coalesce(sum(${usaspendingAwards.totalObligation}), 0)`,
    })
    .from(usaspendingAwards)
    .where(and(gte(usaspendingAwards.startDate, since), koreaFilter))
    .groupBy(sql`to_char(${usaspendingAwards.startDate}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${usaspendingAwards.startDate}, 'YYYY-MM')`)
    .then((rows) =>
      rows.map((r) => ({
        month: r.month,
        count: r.count,
        amount: safeParseFloat(r.amount),
      }))
    );
}

export async function getAgencyOrderingPattern(months = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  return db
    .select({
      agency: usaspendingAwards.fundingAgency,
      count: count(),
      amount: sql<string>`coalesce(sum(${usaspendingAwards.totalObligation}), 0)`,
      avgAmount: sql<string>`coalesce(avg(${usaspendingAwards.totalObligation}), 0)`,
    })
    .from(usaspendingAwards)
    .where(and(gte(usaspendingAwards.startDate, since), isNotNull(usaspendingAwards.fundingAgency), koreaFilter))
    .groupBy(usaspendingAwards.fundingAgency)
    .orderBy(sql`sum(${usaspendingAwards.totalObligation}) desc`)
    .limit(15)
    .then((rows) =>
      rows.map((r) => ({
        agency: r.agency!,
        count: r.count,
        amount: safeParseFloat(r.amount),
        avgAmount: safeParseFloat(r.avgAmount),
      }))
    );
}

export async function getNaicsOrderingPattern(months = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  return db
    .select({
      naicsCode: usaspendingAwards.naicsCode,
      naicsDescription: usaspendingAwards.naicsDescription,
      count: count(),
      amount: sql<string>`coalesce(sum(${usaspendingAwards.totalObligation}), 0)`,
      avgOffers: sql<string>`coalesce(avg(${usaspendingAwards.numberOfOffers}), 0)`,
    })
    .from(usaspendingAwards)
    .where(and(gte(usaspendingAwards.startDate, since), isNotNull(usaspendingAwards.naicsCode), koreaFilter))
    .groupBy(usaspendingAwards.naicsCode, usaspendingAwards.naicsDescription)
    .orderBy(sql`sum(${usaspendingAwards.totalObligation}) desc`)
    .limit(15)
    .then((rows) =>
      rows.map((r) => ({
        naicsCode: r.naicsCode!,
        naicsDescription: r.naicsDescription,
        count: r.count,
        amount: safeParseFloat(r.amount),
        avgOffers: safeParseFloat(r.avgOffers),
      }))
    );
}

export async function getQuarterlyPattern(months = 24) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  return db
    .select({
      quarter: sql<string>`to_char(${usaspendingAwards.startDate}, 'YYYY-"Q"Q')`,
      count: count(),
      amount: sql<string>`coalesce(sum(${usaspendingAwards.totalObligation}), 0)`,
    })
    .from(usaspendingAwards)
    .where(and(gte(usaspendingAwards.startDate, since), koreaFilter))
    .groupBy(sql`to_char(${usaspendingAwards.startDate}, 'YYYY-"Q"Q')`)
    .orderBy(sql`to_char(${usaspendingAwards.startDate}, 'YYYY-"Q"Q')`)
    .then((rows) =>
      rows.map((r) => ({
        quarter: r.quarter,
        count: r.count,
        amount: safeParseFloat(r.amount),
      }))
    );
}
