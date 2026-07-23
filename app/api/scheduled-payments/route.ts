import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { scheduledPayments } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const { user, error } = await requireUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });
  const rows = user.role === "admin"
    ? await db.select().from(scheduledPayments).orderBy(desc(scheduledPayments.createdAt))
    : await db.select().from(scheduledPayments).where(eq(scheduledPayments.userId, user.id)).orderBy(desc(scheduledPayments.createdAt));
  return NextResponse.json({ payments: rows });
}

export async function POST(request: Request) {
  const { user, error } = await requireUser(["client", "admin"]);
  if (!user) return NextResponse.json({ error }, { status: 401 });
  const body = await request.json();
  const [payment] = await db.insert(scheduledPayments).values({
    userId: user.id, accountId: Number(body.accountId),
    amount: String(body.amount), currency: body.currency || "USD",
    recipientName: String(body.recipientName),
    recipientAccount: body.recipientAccount || null,
    recipientBank: body.recipientBank || null,
    frequency: body.frequency || "monthly",
    nextRunDate: new Date(body.nextRunDate || Date.now() + 30 * 24 * 60 * 60 * 1000),
    description: body.description || null,
  }).returning();
  return NextResponse.json({ payment }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { user, error } = await requireUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  await db.update(scheduledPayments).set({ isActive: false }).where(eq(scheduledPayments.id, id));
  return NextResponse.json({ ok: true });
}
