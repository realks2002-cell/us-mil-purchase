import { db } from "@/lib/db";
import { opportunities } from "@/lib/db/schema";
import { eq, desc, asc, ilike, and, or, sql, count, lte, gte } from "drizzle-orm";
import { escapeLikePattern } from "@/lib/utils";

export interface OpportunityFilters {
  search?: string;
  type?: string;
  status?: string;
  naicsCode?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function getOpportunities(filters: OpportunityFilters = {}) {
  const {
    search,
    type,
    status,
    naicsCode,
    page = 1,
    pageSize: rawPageSize = 20,
    sortBy = "postedDate",
    sortOrder = "desc",
  } = filters;

  const pageSize = Math.min(Math.max(1, rawPageSize), 100);
  const conditions = [];

  if (search) {
    const escaped = escapeLikePattern(search);
    conditions.push(
      or(
        ilike(opportunities.title, `%${escaped}%`),
        ilike(opportunities.noticeId, `%${escaped}%`),
        ilike(opportunities.department, `%${escaped}%`),
        ilike(opportunities.office, `%${escaped}%`)
      )
    );
  }

  if (type && type !== "전체") {
    conditions.push(ilike(opportunities.type, `%${type}%`));
  }

  if (status && status !== "전체") {
    if (status === "마감임박") {
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      conditions.push(
        and(
          eq(opportunities.status, "active"),
          lte(opportunities.responseDeadline, sevenDaysLater),
          gte(opportunities.responseDeadline, new Date())
        )
      );
    } else {
      const statusMap: Record<string, "active" | "inactive" | "archived" | "cancelled"> = {
        "진행중": "active",
        "마감": "inactive",
      };
      const mapped = statusMap[status];
      if (mapped) conditions.push(eq(opportunities.status, mapped));
    }
  }

  if (naicsCode && naicsCode !== "전체") {
    conditions.push(eq(opportunities.naicsCode, naicsCode));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (page - 1) * pageSize;

  const sortColumn = {
    postedDate: opportunities.postedDate,
    responseDeadline: opportunities.responseDeadline,
    title: opportunities.title,
  }[sortBy] ?? opportunities.postedDate;

  const orderFn = sortOrder === "asc" ? asc : desc;

  const [data, [{ total }]] = await Promise.all([
    db
      .select({
        id: opportunities.id,
        noticeId: opportunities.noticeId,
        title: opportunities.title,
        department: opportunities.department,
        office: opportunities.office,
        type: opportunities.type,
        naicsCode: opportunities.naicsCode,
        setAside: opportunities.setAside,
        postedDate: opportunities.postedDate,
        responseDeadline: opportunities.responseDeadline,
        placeCity: opportunities.placeCity,
        placeCountry: opportunities.placeCountry,
        status: opportunities.status,
      })
      .from(opportunities)
      .where(where)
      .orderBy(orderFn(sortColumn))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ total: count() })
      .from(opportunities)
      .where(where),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getOpportunityByNoticeId(noticeId: string) {
  return db.query.opportunities.findFirst({
    where: eq(opportunities.noticeId, noticeId),
  });
}

export async function getOpportunityById(id: number) {
  return db.query.opportunities.findFirst({
    where: eq(opportunities.id, id),
  });
}

export async function getDashboardStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    [{ newToday }],
    [{ closingSoon }],
    [{ totalActive }],
  ] = await Promise.all([
    db.select({ newToday: count() }).from(opportunities)
      .where(gte(opportunities.createdAt, todayStart)),
    db.select({ closingSoon: count() }).from(opportunities)
      .where(and(
        eq(opportunities.status, "active"),
        lte(opportunities.responseDeadline, sevenDaysLater),
        gte(opportunities.responseDeadline, now),
      )),
    db.select({ totalActive: count() }).from(opportunities)
      .where(eq(opportunities.status, "active")),
  ]);

  return { newToday, closingSoon, totalActive };
}

export async function getRecentOpportunities(limit = 5) {
  return db
    .select()
    .from(opportunities)
    .where(eq(opportunities.status, "active"))
    .orderBy(desc(opportunities.postedDate))
    .limit(limit);
}

export async function getClosingOpportunities(limit = 5) {
  const now = new Date();
  return db
    .select()
    .from(opportunities)
    .where(
      and(
        eq(opportunities.status, "active"),
        gte(opportunities.responseDeadline, now)
      )
    )
    .orderBy(asc(opportunities.responseDeadline))
    .limit(limit);
}

export async function getNaicsCodes() {
  const result = await db
    .selectDistinct({ naicsCode: opportunities.naicsCode })
    .from(opportunities)
    .where(sql`${opportunities.naicsCode} IS NOT NULL`)
    .orderBy(opportunities.naicsCode);
  return result.map((r) => r.naicsCode).filter(Boolean) as string[];
}
