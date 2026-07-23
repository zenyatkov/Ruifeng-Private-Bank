import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, investments, notifications, transactions } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { generateReference } from "@/lib/utils";

export async function POST(request: Request) {
  const { user, error } = await requireUser(["client", "admin"]);
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const body = await request.json();
  const investmentId = Number(body.investmentId);
  const sellQuantity = parseFloat(String(body.quantity));
  const withdrawAccountId = Number(body.accountId);

  const [inv] = await db.select().from(investments).where(eq(investments.id, investmentId)).limit(1);
  if (!inv) return NextResponse.json({ error: "Investment not found" }, { status: 404 });
  if (user.role !== "admin" && inv.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const currentQty = parseFloat(inv.quantity);
  if (sellQuantity <= 0 || sellQuantity > currentQty) {
    return NextResponse.json({ error: `Invalid quantity. You hold ${currentQty}` }, { status: 400 });
  }

  const [acct] = await db.select().from(accounts).where(eq(accounts.id, withdrawAccountId)).limit(1);
  if (!acct) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const currentPrice = parseFloat(inv.currentPrice);
  const proceeds = sellQuantity * currentPrice;
  const avgCost = parseFloat(inv.avgCost);
  const profit = (currentPrice - avgCost) * sellQuantity;

  // Credit proceeds to account
  const newBal = (parseFloat(acct.balance) + proceeds).toFixed(2);
  await db.update(accounts).set({ balance: newBal, availableBalance: newBal, updatedAt: new Date() }).where(eq(accounts.id, acct.id));

  // Record transaction
  await db.insert(transactions).values({
    accountId: acct.id,
    type: "deposit",
    status: "completed",
    amount: proceeds.toFixed(2),
    currency: inv.currency,
    fee: "0",
    description: `Sold ${sellQuantity} × ${inv.name} @ ${currentPrice.toFixed(4)} (P&L: ${profit >= 0 ? "+" : ""}${profit.toFixed(2)})`,
    reference: generateReference("SELL"),
    counterpartyName: "瑞峯 RuiFeng Wealth Management",
    category: "Investment",
    processedAt: new Date(),
  });

  // Update or delete investment
  const remaining = currentQty - sellQuantity;
  if (remaining <= 0.000001) {
    await db.delete(investments).where(eq(investments.id, investmentId));
  } else {
    await db.update(investments).set({ quantity: remaining.toFixed(6), updatedAt: new Date() }).where(eq(investments.id, investmentId));
  }

  await db.insert(notifications).values({
    userId: inv.userId,
    title: "Investment sold",
    body: `Sold ${sellQuantity} units of ${inv.name} for ${inv.currency} ${proceeds.toFixed(2)}. P&L: ${profit >= 0 ? "+" : ""}${profit.toFixed(2)}`,
    type: "success",
  });

  return NextResponse.json({
    proceeds: proceeds.toFixed(2),
    profit: profit.toFixed(2),
    remaining: remaining.toFixed(6),
    newBalance: newBal,
  });
}
