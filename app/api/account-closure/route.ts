import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, notifications, supportTickets } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });
  const body = await request.json();
  const accountId = Number(body.accountId);
  const reason = String(body.reason || "User requested closure");

  const [acct] = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
  if (!acct) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  if (acct.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.insert(supportTickets).values({
    userId: user.id, subject: `Account closure request: ${acct.accountNumber}`,
    message: `Requesting closure of account ${acct.accountNumber} (${acct.nickname || acct.type}). Reason: ${reason}. Balance: ${acct.currency} ${acct.balance}`,
    category: "Account Closure", priority: "high", status: "open",
  });

  await db.insert(notifications).values({ userId: user.id, title: "Closure request submitted", body: `Your request to close account ${acct.accountNumber} is being reviewed.`, type: "info" });

  return NextResponse.json({ ok: true });
}
