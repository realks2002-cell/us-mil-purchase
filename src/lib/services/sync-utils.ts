import { db } from "@/lib/db";
import { syncLogs } from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";

export async function getLastSuccessfulSyncDate(apiType: string): Promise<Date | null> {
  const last = await db
    .select({ completedAt: syncLogs.completedAt })
    .from(syncLogs)
    .where(and(eq(syncLogs.apiType, apiType), eq(syncLogs.status, "success")))
    .orderBy(desc(syncLogs.completedAt))
    .limit(1);
  return last[0]?.completedAt ?? null;
}

export async function isAlreadyRunning(apiType: string): Promise<boolean> {
  const running = await db.query.syncLogs.findFirst({
    where: and(eq(syncLogs.status, "running"), eq(syncLogs.apiType, apiType)),
  });
  return !!running;
}
