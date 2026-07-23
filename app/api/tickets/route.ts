import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, supportTickets } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-log";

export async function GET() {
  const { user, error } = await requireUser();
  if (!user) {
    return NextResponse.json({ error }, { status: error === "Forbidden" ? 403 : 401 });
  }

  const rows =
    user.role === "admin" || user.role === "relationship_manager"
      ? await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt))
      : await db
          .select()
          .from(supportTickets)
          .where(eq(supportTickets.userId, user.id))
          .orderBy(desc(supportTickets.createdAt));

  return NextResponse.json({ tickets: rows });
}

export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (!user) {
    return NextResponse.json({ error }, { status: error === "Forbidden" ? 403 : 401 });
  }

  const body = await request.json();
  const subject = String(body.subject || "").trim();
  const message = String(body.message || "").trim();
  if (!subject || !message) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  }

  const [ticket] = await db
    .insert(supportTickets)
    .values({
      userId: user.id,
      subject,
      message,
      category: body.category ? String(body.category) : "General",
      priority: body.priority || "medium",
      status: "open",
    })
    .returning();

  return NextResponse.json({ ticket }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { user, error } = await requireUser();
  if (!user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const body = await request.json();
  const id = Number(body.id);
  const [existing] = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const updates: Partial<typeof supportTickets.$inferInsert> = { updatedAt: new Date() };

  if (user.role === "admin" || user.role === "relationship_manager") {
    if (body.status) updates.status = body.status;
    if (body.priority) updates.priority = body.priority;
    if (body.adminReply !== undefined) updates.adminReply = String(body.adminReply);
    updates.assignedTo = user.id;
  } else {
    // Client can reply to their own tickets
    if (existing.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (body.userReply !== undefined) updates.userReply = String(body.userReply);
    if (existing.status === "resolved" || existing.status === "closed") updates.status = "open";
  }

  const [ticket] = await db
    .update(supportTickets)
    .set(updates)
    .where(eq(supportTickets.id, id))
    .returning();

  if (user.role === "admin") {
    await logAdminAction({
      adminId: user.id,
      action: "ticket_update",
      targetType: "ticket",
      targetId: id,
      details: `Updated ticket #${id} to ${ticket.status}`,
    });
  }

  if (body.adminReply) {
    await db.insert(notifications).values({
      userId: existing.userId,
      title: "Support reply received",
      body: `Your ticket "${existing.subject}" has a new response from 瑞峯 RuiFeng Concierge.`,
      type: "info",
    });
  }

  return NextResponse.json({ ticket });
}
