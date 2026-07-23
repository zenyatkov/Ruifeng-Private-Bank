import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, notifications, receipts, transactions } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-log";
import { generateReference } from "@/lib/utils";

export async function GET() {
  try {
    const { user, error } = await requireUser(["admin"]);
    if (!user) return NextResponse.json({ error }, { status: error === "Forbidden" ? 403 : 401 });
    const rows = await db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(200);
    return NextResponse.json({ transactions: rows });
  } catch (err) {
    console.error("Admin transactions GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireUser(["admin"]);
    if (!user) return NextResponse.json({ error }, { status: error === "Forbidden" ? 403 : 401 });

    const body = await request.json();
    const id = Number(body.id);
    const status = body.status as "pending" | "completed" | "failed" | "cancelled" | "flagged";

    const [existing] = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    if (!existing) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

    // If rejecting a pending transfer → refund the held amount
    if (existing.status === "pending" && (status === "failed" || status === "cancelled")) {
      const [account] = await db.select().from(accounts).where(eq(accounts.id, existing.accountId)).limit(1);
      if (account) {
        const refund = parseFloat(existing.amount) + parseFloat(existing.fee || "0");
        const newBal = (parseFloat(account.balance) + refund).toFixed(2);
        await db.update(accounts).set({ balance: newBal, availableBalance: newBal, updatedAt: new Date() }).where(eq(accounts.id, account.id));

        await db.insert(notifications).values({
          userId: account.userId,
          title: "Transfer rejected — funds returned",
          body: `${account.currency} ${refund.toFixed(2)} has been returned to your account. Ref: ${existing.reference}`,
          type: "info",
        });
      }
    }

    // If approving a pending transfer → credit the counterparty for internal transfers
    if (existing.status === "pending" && status === "completed" && existing.counterpartyAccountId) {
      const [toAccount] = await db.select().from(accounts).where(eq(accounts.id, existing.counterpartyAccountId)).limit(1);
      if (toAccount && toAccount.status === "active") {
        const creditAmount = parseFloat(existing.amount);
        const toBal = (parseFloat(toAccount.balance) + creditAmount).toFixed(2);
        await db.update(accounts).set({ balance: toBal, availableBalance: toBal, updatedAt: new Date() }).where(eq(accounts.id, toAccount.id));

        await db.insert(transactions).values({
          accountId: toAccount.id, counterpartyAccountId: existing.accountId,
          type: "deposit", status: "completed", amount: existing.amount, currency: toAccount.currency, fee: "0",
          description: `Approved incoming: ${existing.description || "Transfer"}`,
          reference: generateReference("IN"), counterpartyName: "Approved transfer",
          counterpartyAccount: null, category: "Internal Transfer", processedAt: new Date(),
        });
      }
    }

    const [tx] = await db.update(transactions).set({
      status, processedAt: status === "completed" ? new Date() : existing.processedAt,
    }).where(eq(transactions.id, id)).returning();

    const [account] = await db.select().from(accounts).where(eq(accounts.id, existing.accountId)).limit(1);
    if (account) {
      await db.insert(notifications).values({
        userId: account.userId,
        title: `Transaction ${status}`,
        body: `Your transaction ${existing.reference} has been ${status} by admin.`,
        type: status === "completed" ? "success" : "alert",
      });
    }

    await logAdminAction({
      adminId: user.id, action: `tx_${status}`, targetType: "transaction", targetId: id,
      details: `Set ${existing.reference} to ${status}`,
    });

    // Auto-generate receipt on approval
    if (status === "completed" && account) {
      const meta = existing.metadata as Record<string, string> | null;
      await db.insert(receipts).values({
        userId: account.userId, transactionId: id, type: existing.type,
        data: {
          reference: existing.reference, status: "completed", type: existing.type,
          amount: `${existing.currency} ${existing.amount}`,
          fee: existing.fee ? `${existing.currency} ${existing.fee}` : "0",
          counterparty: existing.counterpartyName || "—",
          account: existing.counterpartyAccount || "—",
          bank: meta?.beneficiaryBank || "—",
          country: meta?.beneficiaryCountry || "—",
          description: existing.description || "—",
          date: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ transaction: tx });
  } catch (err) {
    console.error("Admin transactions PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
