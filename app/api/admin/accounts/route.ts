import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, notifications, receipts, transactions, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-log";
import { generateAccountNumber, generateReference } from "@/lib/utils";

export async function GET() {
  const { user, error } = await requireUser(["admin"]);
  if (!user) return NextResponse.json({ error }, { status: 401 });
  const rows = await db.select({
    id: accounts.id, userId: accounts.userId, accountNumber: accounts.accountNumber,
    iban: accounts.iban, type: accounts.type, currency: accounts.currency,
    balance: accounts.balance, availableBalance: accounts.availableBalance,
    status: accounts.status, nickname: accounts.nickname, interestRate: accounts.interestRate,
    openedAt: accounts.openedAt, firstName: users.firstName, lastName: users.lastName, email: users.email,
  }).from(accounts).leftJoin(users, eq(accounts.userId, users.id)).orderBy(desc(accounts.openedAt));
  return NextResponse.json({ accounts: rows });
}

export async function POST(request: Request) {
  const { user, error } = await requireUser(["admin"]);
  if (!user) return NextResponse.json({ error }, { status: 401 });
  const body = await request.json();
  const targetUserId = Number(body.userId);
  if (!targetUserId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  const accountNumber = generateAccountNumber();
  const initial = body.balance ? parseFloat(String(body.balance)).toFixed(2) : "0.00";

  const [account] = await db.insert(accounts).values({
    userId: targetUserId, accountNumber, iban: `SG89RFPB${accountNumber}`,
    type: body.type || "checking", currency: String(body.currency || "USD").toUpperCase(),
    balance: initial, availableBalance: initial, status: "active",
    nickname: body.nickname || null, interestRate: body.interestRate || "0.500",
  }).returning();

  if (parseFloat(initial) > 0) {
    const ref = generateReference("ADM");
    await db.insert(transactions).values({
      accountId: account.id, type: "deposit", status: "completed",
      amount: initial, currency: account.currency, fee: "0",
      description: body.description || "Opening balance",
      reference: ref, counterpartyName: "瑞峯 RuiFeng Treasury", category: "Deposit", processedAt: new Date(),
    });
    await db.insert(receipts).values({
      userId: targetUserId, type: "deposit",
      data: { reference: ref, amount: `${account.currency} ${initial}`, description: "Opening balance", date: new Date().toISOString() },
    });
  }

  await logAdminAction({ adminId: user.id, action: "account_create", targetType: "account", targetId: account.id, details: `Created ${accountNumber}` });
  return NextResponse.json({ account }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { user, error } = await requireUser(["admin"]);
  if (!user) return NextResponse.json({ error }, { status: 401 });
  const body = await request.json();
  const id = Number(body.id);
  const [existing] = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  // Credit or debit with transaction details
  if (body.adjustAmount !== undefined) {
    const adjust = parseFloat(String(body.adjustAmount));
    if (!Number.isFinite(adjust) || adjust === 0) return NextResponse.json({ error: "Invalid adjustment" }, { status: 400 });
    const newBal = (parseFloat(existing.balance) + adjust).toFixed(2);
    if (parseFloat(newBal) < 0) return NextResponse.json({ error: "Balance cannot be negative" }, { status: 400 });

    await db.update(accounts).set({ balance: newBal, availableBalance: newBal, updatedAt: new Date() }).where(eq(accounts.id, id));

    const ref = generateReference("ADJ");
    const txType = adjust > 0 ? "deposit" : "withdrawal";
    const description = String(body.description || body.reason || `Administrative ${txType}`);
    const counterparty = String(body.counterpartyName || "瑞峯 RuiFeng Operations");

    await db.insert(transactions).values({
      accountId: id, type: txType, status: "completed",
      amount: Math.abs(adjust).toFixed(2), currency: existing.currency, fee: "0",
      description, reference: ref, counterpartyName: counterparty,
      counterpartyAccount: body.counterpartyAccount || null,
      category: body.category || "Adjustment", processedAt: new Date(),
    });

    // Auto-generate receipt
    await db.insert(receipts).values({
      userId: existing.userId, type: txType,
      data: {
        reference: ref, type: txType, status: "completed",
        amount: `${existing.currency} ${Math.abs(adjust).toFixed(2)}`,
        description, counterparty, date: new Date().toISOString(),
        newBalance: `${existing.currency} ${newBal}`,
      },
    });

    await db.insert(notifications).values({
      userId: existing.userId,
      title: adjust > 0 ? "Funds credited" : "Funds debited",
      body: `${existing.currency} ${Math.abs(adjust).toFixed(2)} ${adjust > 0 ? "credited to" : "debited from"} your account. Ref: ${ref}`,
      type: adjust > 0 ? "success" : "info",
    });

    await logAdminAction({
      adminId: user.id, action: `account_${txType}`, targetType: "account", targetId: id,
      details: `${txType}: ${existing.currency} ${Math.abs(adjust).toFixed(2)} — ${description}`,
    });

    const [updated] = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
    return NextResponse.json({ account: updated });
  }

  // Status/property updates
  const updates: Partial<typeof accounts.$inferInsert> = { updatedAt: new Date() };
  if (body.status) {
    updates.status = body.status;
    // If approving a pending account — assign real account number
    if (existing.status === "pending" && body.status === "active") {
      if (existing.accountNumber.startsWith("PENDING")) {
        const newNum = generateAccountNumber();
        updates.accountNumber = newNum;
        updates.iban = `SG89RFPB${newNum}`;
      }
      await db.insert(notifications).values({
        userId: existing.userId, title: "Account activated",
        body: `Your ${existing.currency} ${existing.type} account is now active. Account number: ${updates.accountNumber || existing.accountNumber}`,
        type: "success",
      });
    }
  }
  if (body.nickname !== undefined) updates.nickname = body.nickname;
  if (body.interestRate !== undefined) updates.interestRate = String(body.interestRate);
  if (body.type) updates.type = body.type;

  const [account] = await db.update(accounts).set(updates).where(eq(accounts.id, id)).returning();
  await logAdminAction({ adminId: user.id, action: "account_update", targetType: "account", targetId: id, details: `Updated ${existing.accountNumber}` });
  return NextResponse.json({ account });
}
