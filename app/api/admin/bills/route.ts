import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, billPayments, notifications, receipts, transactions, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-log";
import { generateReference } from "@/lib/utils";

export async function GET() {
  try {
    const { user, error } = await requireUser(["admin"]);
    if (!user) return NextResponse.json({ error }, { status: 401 });
    const rows = await db.select({
      id: billPayments.id, billerName: billPayments.billerName, billerCategory: billPayments.billerCategory,
      referenceNumber: billPayments.referenceNumber, amount: billPayments.amount, currency: billPayments.currency,
      status: billPayments.status, createdAt: billPayments.createdAt, userId: billPayments.userId,
      accountId: billPayments.accountId,
      firstName: users.firstName, lastName: users.lastName, email: users.email,
    }).from(billPayments).leftJoin(users, eq(billPayments.userId, users.id)).orderBy(desc(billPayments.createdAt));
    return NextResponse.json({ bills: rows });
  } catch (err) {
    console.error("Admin bills GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireUser(["admin"]);
    if (!user) return NextResponse.json({ error }, { status: 401 });
    const body = await request.json();
    const id = Number(body.id);
    const newStatus = String(body.status);
    const [bill] = await db.select().from(billPayments).where(eq(billPayments.id, id)).limit(1);
    if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // If rejecting, refund the held amount
    if (bill.status === "pending" && (newStatus === "failed" || newStatus === "cancelled")) {
      const [acct] = await db.select().from(accounts).where(eq(accounts.id, bill.accountId)).limit(1);
      if (acct) {
        const refund = parseFloat(bill.amount);
        const newBal = (parseFloat(acct.balance) + refund).toFixed(2);
        await db.update(accounts).set({ balance: newBal, availableBalance: newBal, updatedAt: new Date() }).where(eq(accounts.id, acct.id));
      }
      await db.insert(notifications).values({
        userId: bill.userId, title: "Bill payment declined",
        body: `Your payment of ${bill.currency} ${bill.amount} to ${bill.billerName} was declined. Funds returned.`,
        type: "alert",
      });
    }

    // If approving, mark transaction as completed and generate receipt
    if (bill.status === "pending" && newStatus === "completed") {
      // Update the matching transaction to completed
      const txs = await db.select().from(transactions).where(eq(transactions.accountId, bill.accountId));
      const matchingTx = txs.find(t => t.status === "pending" && t.category === "Bill Payment" && t.counterpartyName === bill.billerName);
      if (matchingTx) {
        await db.update(transactions).set({ status: "completed", processedAt: new Date() }).where(eq(transactions.id, matchingTx.id));

        // Auto-generate receipt
        await db.insert(receipts).values({
          userId: bill.userId, transactionId: matchingTx.id, type: "bill_payment",
          data: {
            reference: matchingTx.reference, status: "completed", biller: bill.billerName,
            category: bill.billerCategory, billReference: bill.referenceNumber || "—",
            amount: `${bill.currency} ${bill.amount}`, date: new Date().toISOString(),
          },
        });
      }

      await db.insert(notifications).values({
        userId: bill.userId, title: "Bill payment completed",
        body: `Your payment of ${bill.currency} ${bill.amount} to ${bill.billerName} has been processed.`,
        type: "success",
      });
    }

    const [updated] = await db.update(billPayments).set({ status: newStatus }).where(eq(billPayments.id, id)).returning();
    await logAdminAction({ adminId: user.id, action: `bill_${newStatus}`, targetType: "bill", targetId: id, details: `${bill.billerName}: ${bill.currency} ${bill.amount}` });
    return NextResponse.json({ bill: updated });
  } catch (err) {
    console.error("Admin bills PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
