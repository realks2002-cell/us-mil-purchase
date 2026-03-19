"use server";

import { getAdminSession } from "@/lib/get-session";
import { createUser, updateUserRole, toggleUserActive } from "@/lib/services/admin";
import { revalidatePath } from "next/cache";

export async function createUserAction(formData: FormData) {
  await getAdminSession();

  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;
  const rawRole = formData.get("role") as string;
  const role = rawRole === "admin" ? "admin" : "user";

  if (!email || !name || !password) {
    return { error: "모든 필드를 입력해주세요." };
  }
  if (password.length < 8) {
    return { error: "비밀번호는 8자 이상이어야 합니다." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "올바른 이메일 형식이 아닙니다." };
  }

  try {
    await createUser({ email, name, password, role: role || "user" });
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return { error: "이미 존재하는 이메일입니다." };
    }
    return { error: "사용자 생성에 실패했습니다." };
  }
}

export async function updateRoleAction(userId: string, rawRole: string) {
  await getAdminSession();
  const role = rawRole === "admin" ? "admin" : "user";
  await updateUserRole(userId, role);
  revalidatePath("/admin/users");
}

export async function toggleActiveAction(userId: string) {
  await getAdminSession();
  await toggleUserActive(userId);
  revalidatePath("/admin/users");
}
