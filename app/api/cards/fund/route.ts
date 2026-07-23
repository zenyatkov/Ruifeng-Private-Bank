import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, cards, notifications, receipts, transactions } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { generateReference } from "@/lib/utils";

export async function POST(request: Request) {
  const { user, error } = await requireUser(["client", "admin"]);
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const body = await request.json();
  const cardId = Number(body.cardId);
  const fromAccountId = Number(body.fromAccountId);
  const amount = parseFloat(String(body.amount));

  if (!cardId || !fromAccountId || !Number.isFinite(amount) || amount <= 0)
    return NextResponse.json({ error: "Invalid funding details" }, { status: 400 });

  const [card] = await db.select().from(cards).where(eq(cards.id, cardId)).limit(1);
  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });
  if (card.status !== "active") return NextResponse.json({ error: "Card is not active" }, { status: 400 });
  if (user.role !== "admin" && card.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [acct] = await db.select().from(accounts).where(eq(accounts.id, fromAccountId)).limit(1);
  if (!acct) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  if (parseFloat(acct.balance) < amount) return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });

  // Debit source account
  const newBal = (parseFloat(acct.balance) - amount).toFixed(2);
  await db.update(accounts).set({ balance: newBal, availableBalance: newBal, updatedAt: new Date() }).where(eq(accounts.id, acct.id));

  // Credit the card's linked account
  const [cardAccount] = await db.select().from(accounts).where(eq(accounts.id, card.accountId)).limit(1);
  let cardNewBal = "0";
  if (cardAccount) {
    cardNewBal = (parseFloat(cardAccount.balance) + amount).toFixed(2);
    await db.update(accounts).set({ balance: cardNewBal, availableBalance: cardNewBal, updatedAt: new Date() }).where(eq(accounts.id, cardAccount.id));
  }

  // Update card spent counter
  const currentSpent = parseFloat(card.spentThisMonth || "0");
  const newSpent = Math.max(0, currentSpent - amount).toFixed(2);
  await db.update(cards).set({ spentThisMonth: newSpent }).where(eq(cards.id, cardId));

  const ref = generateReference("CFND");
  await db.insert(transactions).values({
    accountId: acct.id, type: "payment", status: "completed",
    amount: amount.toFixed(2), currency: acct.currency, fee: "0",
    description: `Card funding: ${card.type} card (${card.cardNumberMasked})`,
    reference: ref, counterpartyName: "瑞峯 RuiFeng Card Services",
    category: "Card Funding", processedAt: new Date(),
  });

  await db.insert(receipts).values({
    userId: card.userId, type: "card_funding",
    data: { reference: ref, amount: `${acct.currency} ${amount.toFixed(2)}`, card: card.cardNumberMasked, cardType: card.type, sourceAccount: acct.accountNumber, date: new Date().toISOString() },
  });

  await db.insert(notifications).values({
    userId: card.userId, title: "Card funded",
    body: `${acct.currency} ${amount.toFixed(2)} loaded to your ${card.type} card. Card balance: ${acct.currency} ${cardNewBal}`,
    type: "success",
  });

  return NextResponse.json({ ok: true, newBalance: newBal, cardBalance: cardNewBal, newSpent });
}
