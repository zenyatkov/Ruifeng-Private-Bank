import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, fxRates, notifications, transactions } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { generateReference } from "@/lib/utils";

export async function GET() {
  try {
    const rates = await db.select().from(fxRates);
    return NextResponse.json({ rates });
  } catch (err) {
    console.error("FX GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireUser(["client", "admin"]);
    if (!user) return NextResponse.json({ error }, { status: error === "Forbidden" ? 403 : 401 });

    const body = await request.json();
    const fromAccountId = Number(body.fromAccountId);
    const toAccountId = Number(body.toAccountId);
    const amount = parseFloat(String(body.amount));

    if (!fromAccountId || !toAccountId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Valid accounts and positive amount required" }, { status: 400 });
    }

    const [fromAccount] = await db.select().from(accounts).where(eq(accounts.id, fromAccountId)).limit(1);
    const [toAccount] = await db.select().from(accounts).where(eq(accounts.id, toAccountId)).limit(1);

    if (!fromAccount || !toAccount) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    if (user.role !== "admin" && (fromAccount.userId !== user.id || toAccount.userId !== user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (fromAccount.status !== "active" || toAccount.status !== "active") {
      return NextResponse.json({ error: "Both accounts must be active" }, { status: 400 });
    }
    if (fromAccount.currency === toAccount.currency) {
      return NextResponse.json({ error: "Use Transfers for same-currency movements" }, { status: 400 });
    }

    // Find FX rate
    let rate = 1;
    const [direct] = await db.select().from(fxRates).where(and(eq(fxRates.baseCurrency, fromAccount.currency), eq(fxRates.quoteCurrency, toAccount.currency))).limit(1);

    if (direct) {
      rate = parseFloat(direct.rate);
    } else {
      const [inverse] = await db.select().from(fxRates).where(and(eq(fxRates.baseCurrency, toAccount.currency), eq(fxRates.quoteCurrency, fromAccount.currency))).limit(1);
      if (inverse) {
        rate = 1 / parseFloat(inverse.rate);
      } else {
        // Cross via USD
        const allRates = await db.select().from(fxRates);
        const fromToUsd = allRates.find(r => r.baseCurrency === fromAccount.currency && r.quoteCurrency === "USD");
        const usdToTarget = allRates.find(r => r.baseCurrency === "USD" && r.quoteCurrency === toAccount.currency);
        const usdToFrom = allRates.find(r => r.baseCurrency === "USD" && r.quoteCurrency === fromAccount.currency);
        const targetToUsd = allRates.find(r => r.baseCurrency === toAccount.currency && r.quoteCurrency === "USD");

        if (fromAccount.currency === "USD" && usdToTarget) {
          rate = parseFloat(usdToTarget.rate);
        } else if (toAccount.currency === "USD" && usdToFrom) {
          rate = 1 / parseFloat(usdToFrom.rate);
        } else if (fromToUsd && usdToTarget) {
          rate = parseFloat(fromToUsd.rate) * parseFloat(usdToTarget.rate);
        } else {
          return NextResponse.json({ error: "FX rate unavailable for this pair" }, { status: 400 });
        }
      }
    }

    // Check balance
    const fee = amount * 0.0015; // 15bps spread
    const totalDebit = amount + fee;
    const fromBal = parseFloat(fromAccount.balance);
    if (fromBal < totalDebit) {
      return NextResponse.json({ error: `Insufficient funds. Need ${fromAccount.currency} ${totalDebit.toFixed(2)}, available: ${fromBal.toFixed(2)}` }, { status: 400 });
    }

    const creditAmount = amount * rate;
    const newFrom = (fromBal - totalDebit).toFixed(2);
    const newTo = (parseFloat(toAccount.balance) + creditAmount).toFixed(2);

    // Update balances
    await db.update(accounts).set({ balance: newFrom, availableBalance: newFrom, updatedAt: new Date() }).where(eq(accounts.id, fromAccount.id));
    await db.update(accounts).set({ balance: newTo, availableBalance: newTo, updatedAt: new Date() }).where(eq(accounts.id, toAccount.id));

    const reference = generateReference("FX");

    // Debit transaction
    const [tx] = await db.insert(transactions).values({
      accountId: fromAccount.id,
      counterpartyAccountId: toAccount.id,
      type: "fx",
      status: "completed",
      amount: amount.toFixed(2),
      currency: fromAccount.currency,
      fee: fee.toFixed(2),
      description: `FX Sell ${fromAccount.currency}/${toAccount.currency} @ ${rate.toFixed(6)}`,
      reference,
      counterpartyName: "瑞峯 RuiFeng FX Desk",
      category: "FX",
      metadata: { rate, creditAmount: creditAmount.toFixed(2), toCurrency: toAccount.currency },
      processedAt: new Date(),
    }).returning();

    // Credit transaction
    await db.insert(transactions).values({
      accountId: toAccount.id,
      counterpartyAccountId: fromAccount.id,
      type: "deposit",
      status: "completed",
      amount: creditAmount.toFixed(2),
      currency: toAccount.currency,
      fee: "0",
      description: `FX Buy from ${fromAccount.currency} @ ${rate.toFixed(6)}`,
      reference: generateReference("FXC"),
      counterpartyName: "瑞峯 RuiFeng FX Desk",
      category: "FX",
      processedAt: new Date(),
    });

    await db.insert(notifications).values({
      userId: user.id,
      title: "FX conversion completed",
      body: `Sold ${fromAccount.currency} ${amount.toFixed(2)} → Bought ${toAccount.currency} ${creditAmount.toFixed(2)} @ ${rate.toFixed(6)}. Ref: ${reference}`,
      type: "success",
    });

    return NextResponse.json({
      transaction: tx,
      receipt: {
        reference,
        sold: { currency: fromAccount.currency, amount: amount.toFixed(2), fee: fee.toFixed(2) },
        bought: { currency: toAccount.currency, amount: creditAmount.toFixed(2) },
        rate: rate.toFixed(6),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("FX POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
