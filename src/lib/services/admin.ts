import { db } from "@/lib/db";
import { users, syncLogs, opportunities, awards, type NewUser } from "@/lib/db/schema";
import { eq, desc, count, sql } from "drizzle-orm";
import { hash } from "bcryptjs";

// ─── Users CRUD ──────────────────────────────────────

export async function getUsers() {
  return db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
}

export async function createUser(data: { email: string; name: string; password: string; role: "admin" | "user" }) {
  const passwordHash = await hash(data.password, 12);
  const [user] = await db
    .insert(users)
    .values({
      email: data.email,
      name: data.name,
      passwordHash,
      role: data.role,
      isActive: true,
    })
    .returning({ id: users.id, email: users.email });
  return user;
}

export async function updateUserRole(userId: string, role: "admin" | "user") {
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function toggleUserActive(userId: string) {
  await db
    .update(users)
    .set({ isActive: sql`NOT ${users.isActive}` })
    .where(eq(users.id, userId));
}

// ─── Sync Logs ───────────────────────────────────────

export async function getSyncLogs(limit = 20) {
  return db
    .select()
    .from(syncLogs)
    .orderBy(desc(syncLogs.startedAt))
    .limit(limit);
}

// ─── System Stats ────────────────────────────────────

export async function getSystemStats() {
  const [
    [{ totalOpps }],
    [{ totalAwards }],
    [{ totalUsers }],
    recentSync,
  ] = await Promise.all([
    db.select({ totalOpps: count() }).from(opportunities),
    db.select({ totalAwards: count() }).from(awards),
    db.select({ totalUsers: count() }).from(users),
    db.select().from(syncLogs).orderBy(desc(syncLogs.startedAt)).limit(1),
  ]);

  return {
    totalOpps,
    totalAwards,
    totalUsers,
    lastSync: recentSync[0] ?? null,
  };
}
