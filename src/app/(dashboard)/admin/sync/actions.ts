"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/get-session";
import { syncOpportunities, syncAwards } from "@/lib/sam-api/sync";
import { syncUsaspendingAwards } from "@/lib/usaspending-api/sync";

export async function triggerSyncOpportunities() {
  await getAdminSession();

  try {
    const result = await syncOpportunities();
    revalidatePath("/admin/sync");
    return { success: true as const, ...result };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function triggerSyncAwards() {
  await getAdminSession();

  try {
    const result = await syncAwards();
    revalidatePath("/admin/sync");
    return { success: true as const, ...result };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function triggerSyncUsaspending() {
  await getAdminSession();

  try {
    const result = await syncUsaspendingAwards();
    revalidatePath("/admin/sync");
    return { success: true as const, ...result };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
