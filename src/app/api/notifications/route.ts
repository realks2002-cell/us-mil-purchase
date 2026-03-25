import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUnreadCount, getRecentNotifications } from "@/lib/services/notifications";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [unreadCount, recent] = await Promise.all([
    getUnreadCount(session.user.id),
    getRecentNotifications(session.user.id, 20),
  ]);

  return NextResponse.json({ unreadCount, notifications: recent });
}
