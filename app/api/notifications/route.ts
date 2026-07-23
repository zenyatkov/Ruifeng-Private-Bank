import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const { user, error } = await requireUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });
  const rows = await db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)).limit(50);
  return NextResponse.json({ notifications: rows });
}

export async function PATCH(request: Request) {
  const { user, error } = await requireUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });
  const body = await request.json();

  if (body.markAll) {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, user.id));
    return NextResponse.json({ ok: true });
  }

  const id = Number(body.id);
  const [row] = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
  if (!row || row.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isRead = body.isRead !== undefined ? Boolean(body.isRead) : true;
  const [updated] = await db.update(notifications).set({ isRead }).where(eq(notifications.id, id)).returning();
  return NextResponse.json({ notification: updated });
}
