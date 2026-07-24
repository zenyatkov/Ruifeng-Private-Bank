import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, accounts, cards, transactions, loans, investments, notifications, receipts, supportTickets, billPayments, beneficiaries } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-log";

export async function DELETE(request: Request) {
  const { user, error } = await requireUser(["admin"]);
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const body = await request.json();
  const userId = Number(body.userId);
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  // Prevent deleting self
  if (userId === user.id) return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });

  // Check target user exists
  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Delete in order: dependent records first
  const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, userId));
  const accountIds = userAccounts.map(a => a.id);

  // Delete transactions for user's accounts
  for (const aid of accountIds) {
    await db.delete(transactions).where(eq(transactions.accountId, aid));
  }

  // Delete all dependent records
  await db.delete(cards).where(eq(cards.userId, userId));
  await db.delete(loans).where(eq(loans.userId, userId));
  await db.delete(investments).where(eq(investments.userId, userId));
  await db.delete(notifications).where(eq(notifications.userId, userId));
  await db.delete(receipts).where(eq(receipts.userId, userId));
  await db.delete(supportTickets).where(eq(supportTickets.userId, userId));
  await db.delete(billPayments).where(eq(billPayments.userId, userId));
  await db.delete(beneficiaries).where(eq(beneficiaries.userId, userId));

  // Delete accounts
  await db.delete(accounts).where(eq(accounts.userId, userId));

  // Finally delete the user
  await db.delete(users).where(eq(users.id, userId));

  await logAdminAction({ adminId: user.id, action: "delete_user", targetType: "user", details: `Deleted user ${target.email} (ID: ${userId})` });

  return NextResponse.json({ ok: true, message: `User ${target.email} deleted` });
}
