import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { markAsRead, markAllAsRead } from "@/lib/services/notifications";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.all === true) {
    const count = await markAllAsRead(session.user.id);
    return NextResponse.json({ ok: true, count });
  }

  if (typeof body.id === "number") {
    const result = await markAsRead(body.id, session.user.id);
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
