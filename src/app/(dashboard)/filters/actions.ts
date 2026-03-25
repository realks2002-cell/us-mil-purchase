"use server";

import { getRequiredSession } from "@/lib/get-session";
import {
  createFilter,
  updateFilter,
  deleteFilter,
  toggleFilter,
} from "@/lib/services/filters";
import { revalidatePath } from "next/cache";

function parseArray(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseCheckboxArray(formData: FormData, prefix: string): string[] {
  const values: string[] = [];
  for (const [key, val] of formData.entries()) {
    if (key.startsWith(prefix) && val === "on") {
      values.push(key.replace(prefix, ""));
    }
  }
  return values;
}

export async function createFilterAction(formData: FormData) {
  const session = await getRequiredSession();
  const userId = session.user.id;

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "필터 이름을 입력해주세요." };

  try {
    await createFilter(userId, {
      name,
      keywords: parseArray(formData.get("keywords") as string),
      naicsCodes: parseArray(formData.get("naicsCodes") as string),
      noticeTypes: parseCheckboxArray(formData, "noticeType_"),
      setAsides: parseCheckboxArray(formData, "setAside_"),
      isActive: formData.get("isActive") === "on",
      notifyEmail: formData.get("notifyEmail") === "on",
    });
    revalidatePath("/filters");
    return { ok: true };
  } catch {
    return { error: "필터 생성에 실패했습니다." };
  }
}

export async function updateFilterAction(id: number, formData: FormData) {
  const session = await getRequiredSession();
  const userId = session.user.id;

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "필터 이름을 입력해주세요." };

  try {
    const result = await updateFilter(id, userId, {
      name,
      keywords: parseArray(formData.get("keywords") as string),
      naicsCodes: parseArray(formData.get("naicsCodes") as string),
      noticeTypes: parseCheckboxArray(formData, "noticeType_"),
      setAsides: parseCheckboxArray(formData, "setAside_"),
      isActive: formData.get("isActive") === "on",
      notifyEmail: formData.get("notifyEmail") === "on",
    });
    if (!result) return { error: "필터를 찾을 수 없습니다." };
    revalidatePath("/filters");
    return { ok: true };
  } catch {
    return { error: "필터 수정에 실패했습니다." };
  }
}

export async function deleteFilterAction(id: number) {
  const session = await getRequiredSession();
  const userId = session.user.id;

  try {
    const result = await deleteFilter(id, userId);
    if (!result) return { error: "필터를 찾을 수 없습니다." };
    revalidatePath("/filters");
    return { ok: true };
  } catch {
    return { error: "필터 삭제에 실패했습니다." };
  }
}

export async function toggleFilterAction(id: number) {
  const session = await getRequiredSession();
  const userId = session.user.id;

  try {
    const result = await toggleFilter(id, userId);
    if (!result) return { error: "필터를 찾을 수 없습니다." };
    revalidatePath("/filters");
    return { ok: true };
  } catch {
    return { error: "필터 토글에 실패했습니다." };
  }
}
