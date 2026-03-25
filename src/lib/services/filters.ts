import { db } from "@/lib/db";
import { userFilters } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface CreateFilterData {
  name: string;
  keywords?: string[];
  naicsCodes?: string[];
  noticeTypes?: string[];
  setAsides?: string[];
  departments?: string[];
  isActive?: boolean;
  notifyEmail?: boolean;
}

export async function getFilters(userId: string) {
  return db
    .select()
    .from(userFilters)
    .where(eq(userFilters.userId, userId))
    .orderBy(desc(userFilters.createdAt));
}

export async function createFilter(userId: string, data: CreateFilterData) {
  const [filter] = await db
    .insert(userFilters)
    .values({
      userId,
      name: data.name,
      keywords: data.keywords ?? [],
      naicsCodes: data.naicsCodes ?? [],
      noticeTypes: data.noticeTypes ?? [],
      setAsides: data.setAsides ?? [],
      departments: data.departments ?? [],
      isActive: data.isActive ?? true,
      notifyEmail: data.notifyEmail ?? true,
    })
    .returning();
  return filter;
}

export async function updateFilter(id: number, userId: string, data: CreateFilterData) {
  const [filter] = await db
    .update(userFilters)
    .set(data)
    .where(and(eq(userFilters.id, id), eq(userFilters.userId, userId)))
    .returning();
  return filter;
}

export async function deleteFilter(id: number, userId: string) {
  const [deleted] = await db
    .delete(userFilters)
    .where(and(eq(userFilters.id, id), eq(userFilters.userId, userId)))
    .returning({ id: userFilters.id });
  return deleted;
}

export async function toggleFilter(id: number, userId: string) {
  const [filter] = await db
    .update(userFilters)
    .set({ isActive: sql`NOT ${userFilters.isActive}` })
    .where(and(eq(userFilters.id, id), eq(userFilters.userId, userId)))
    .returning();
  return filter;
}
