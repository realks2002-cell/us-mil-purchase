import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getRequiredSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function getAdminSession() {
  const session = await getRequiredSession();
  if (session.user.role !== "admin") redirect("/");
  return session;
}
