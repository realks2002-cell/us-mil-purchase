import { db } from "@/lib/db";
import { notifications, opportunities, userFilters } from "@/lib/db/schema";
import { eq, and, isNull, desc, sql, inArray, lte, gte } from "drizzle-orm";

export async function getUnreadCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return row?.count ?? 0;
}

export async function getRecentNotifications(userId: string, limit = 20) {
  return db
    .select({
      id: notifications.id,
      type: notifications.type,
      subject: notifications.subject,
      body: notifications.body,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
      opportunityId: notifications.opportunityId,
      filterId: notifications.filterId,
      status: notifications.status,
      channel: notifications.channel,
      sentAt: notifications.sentAt,
      opportunityTitle: opportunities.title,
      opportunityNoticeId: opportunities.noticeId,
    })
    .from(notifications)
    .leftJoin(opportunities, eq(notifications.opportunityId, opportunities.id))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markAsRead(notificationId: number, userId: string) {
  const [updated] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId),
        isNull(notifications.readAt),
      ),
    )
    .returning({ id: notifications.id });
  return updated;
}

export async function markAllAsRead(userId: string) {
  const result = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .returning({ id: notifications.id });
  return result.length;
}

export async function createNotification(data: {
  userId: string;
  opportunityId: number | null;
  filterId?: number | null;
  type: "new_match" | "deadline_warning" | "status_change";
  subject: string;
  body?: string;
}) {
  const [notif] = await db
    .insert(notifications)
    .values({
      userId: data.userId,
      opportunityId: data.opportunityId,
      filterId: data.filterId ?? null,
      type: data.type,
      subject: data.subject,
      body: data.body ?? null,
      channel: "email",
      status: "pending",
    })
    .onConflictDoNothing({
      target: [notifications.userId, notifications.opportunityId, notifications.type],
    })
    .returning();
  return notif ?? null;
}

function matchesFilter(
  filter: { keywords: string[] | null; naicsCodes: string[] | null; noticeTypes: string[] | null; setAsides: string[] | null; departments: string[] | null },
  opp: { title: string | null; description: string | null; naicsCode: string | null; type: string | null; setAside: string | null; department: string | null },
): boolean {
  const checks: boolean[] = [];

  if (filter.keywords?.length) {
    const text = `${opp.title ?? ""} ${opp.description ?? ""}`.toLowerCase();
    checks.push(filter.keywords.some((kw) => text.includes(kw.toLowerCase())));
  }
  if (filter.naicsCodes?.length) {
    checks.push(!!opp.naicsCode && filter.naicsCodes.includes(opp.naicsCode));
  }
  if (filter.noticeTypes?.length) {
    checks.push(!!opp.type && filter.noticeTypes.includes(opp.type));
  }
  if (filter.setAsides?.length) {
    checks.push(!!opp.setAside && filter.setAsides.includes(opp.setAside));
  }
  if (filter.departments?.length) {
    checks.push(!!opp.department && filter.departments.includes(opp.department));
  }

  return checks.length > 0 && checks.every(Boolean);
}

export async function matchFiltersAndNotify(newOpportunityIds: number[]) {
  if (!newOpportunityIds.length) return 0;

  const newOpps = await db
    .select()
    .from(opportunities)
    .where(inArray(opportunities.id, newOpportunityIds));

  if (!newOpps.length) return 0;

  const activeFilters = await db
    .select()
    .from(userFilters)
    .where(and(eq(userFilters.isActive, true), eq(userFilters.notifyEmail, true)));

  let created = 0;
  for (const filter of activeFilters) {
    for (const opp of newOpps) {
      if (matchesFilter(filter, opp)) {
        const result = await createNotification({
          userId: filter.userId,
          opportunityId: opp.id,
          filterId: filter.id,
          type: "new_match",
          subject: `[신규 매칭] ${opp.title}`,
          body: `필터 "${filter.name}"에 매칭되는 새 공고가 등록되었습니다.`,
        });
        if (result) created++;
      }
    }
  }

  console.log(`[Notifications] 신규 매칭 알림 ${created}건 생성`);
  return created;
}

export async function checkDeadlineWarnings() {
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const soonOpps = await db
    .select()
    .from(opportunities)
    .where(
      and(
        eq(opportunities.status, "active"),
        gte(opportunities.responseDeadline, now),
        lte(opportunities.responseDeadline, sevenDaysLater),
      ),
    );

  if (!soonOpps.length) return 0;

  const activeFilters = await db
    .select()
    .from(userFilters)
    .where(and(eq(userFilters.isActive, true), eq(userFilters.notifyEmail, true)));

  let created = 0;
  for (const filter of activeFilters) {
    for (const opp of soonOpps) {
      if (matchesFilter(filter, opp)) {
        const daysLeft = Math.ceil(
          (opp.responseDeadline!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
        );
        const result = await createNotification({
          userId: filter.userId,
          opportunityId: opp.id,
          filterId: filter.id,
          type: "deadline_warning",
          subject: `[마감 ${daysLeft}일 전] ${opp.title}`,
          body: `마감일: ${opp.responseDeadline!.toISOString().slice(0, 10)}`,
        });
        if (result) created++;
      }
    }
  }

  console.log(`[Notifications] 마감 임박 알림 ${created}건 생성`);
  return created;
}

export async function checkStatusChanges(changedOpportunityIds: number[]) {
  if (!changedOpportunityIds.length) return 0;

  const changedOpps = await db
    .select()
    .from(opportunities)
    .where(inArray(opportunities.id, changedOpportunityIds));

  const activeFilters = await db
    .select()
    .from(userFilters)
    .where(and(eq(userFilters.isActive, true), eq(userFilters.notifyEmail, true)));

  let created = 0;
  for (const filter of activeFilters) {
    for (const opp of changedOpps) {
      if (matchesFilter(filter, opp)) {
        const result = await createNotification({
          userId: filter.userId,
          opportunityId: opp.id,
          filterId: filter.id,
          type: "status_change",
          subject: `[상태 변경] ${opp.title}`,
          body: `공고 상태가 "${opp.status}"(으)로 변경되었습니다.`,
        });
        if (result) created++;
      }
    }
  }

  console.log(`[Notifications] 상태 변경 알림 ${created}건 생성`);
  return created;
}
