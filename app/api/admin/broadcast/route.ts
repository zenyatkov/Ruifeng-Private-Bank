import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-log";

export async function POST(request: Request) {
  const { user, error } = await requireUser(["admin"]);
  if (!user) return NextResponse.json({ error }, { status: 401 });
  const body = await request.json();
  const title = String(body.title || "").trim();
  const message = String(body.message || "").trim();
  const type = String(body.type || "info");
  if (!title || !message) return NextResponse.json({ error: "Title and message required" }, { status: 400 });

  const clients = await db.select({ id: users.id }).from(users).where(eq(users.isActive, true));
  for (const client of clients) {
    await db.insert(notifications).values({ userId: client.id, title, body: message, type });
  }

  await logAdminAction({ adminId: user.id, action: "broadcast", targetType: "all_users", details: `Broadcast: ${title}` });
  return NextResponse.json({ ok: true, sentTo: clients.length });
}
