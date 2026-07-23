import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, investments, notifications, transactions } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { generateReference } from "@/lib/utils";

export async function GET() {
  try {
    const { user, error } = await requireUser();
    if (!user) return NextResponse.json({ error }, { status: error === "Forbidden" ? 403 : 401 });

    const rows = user.role === "admin"
      ? await db.select().from(investments).orderBy(desc(investments.updatedAt))
      : await db.select().from(investments).where(eq(investments.userId, user.id)).orderBy(desc(investments.updatedAt));

    return NextResponse.json({ investments: rows });
  } catch (err) {
    console.error("Investments GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireUser(["client", "admin"]);
    if (!user) return NextResponse.json({ error }, { status: error === "Forbidden" ? 403 : 401 });

    const body = await request.json();
    const name = String(body.name || "").trim();
    const assetClass = String(body.assetClass || "Equities");
    const quantity = parseFloat(String(body.quantity));
    const price = parseFloat(String(body.price || body.currentPrice || 0));
    const currency = String(body.currency || "USD").toUpperCase();
    const fundingAccountId = body.accountId ? Number(body.accountId) : null;

    if (!name || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Valid investment details required" }, { status: 400 });
    }

    const totalCost = quantity * price;

    // DEDUCT from funding account
    if (fundingAccountId) {
      const [acct] = await db.select().from(accounts).where(eq(accounts.id, fundingAccountId)).limit(1);
      if (!acct) return NextResponse.json({ error: "Funding account not found" }, { status: 404 });
      if (user.role !== "admin" && acct.userId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (acct.status !== "active") return NextResponse.json({ error: "Account is not active" }, { status: 400 });

      const balance = parseFloat(acct.balance);
      if (balance < totalCost) {
        return NextResponse.json({ error: `Insufficient funds. Need ${currency} ${totalCost.toFixed(2)}, available: ${currency} ${balance.toFixed(2)}` }, { status: 400 });
      }

      // Debit account
      const newBal = (balance - totalCost).toFixed(2);
      await db.update(accounts).set({ balance: newBal, availableBalance: newBal, updatedAt: new Date() }).where(eq(accounts.id, acct.id));

      // Record investment purchase transaction
      await db.insert(transactions).values({
        accountId: acct.id,
        type: "investment",
        status: "completed",
        amount: totalCost.toFixed(2),
        currency: acct.currency,
        fee: "0",
        description: `Investment: ${name} — ${quantity} units @ ${price.toFixed(4)}`,
        reference: generateReference("INV"),
        counterpartyName: "瑞峯 RuiFeng Wealth Management",
        category: "Investment",
        processedAt: new Date(),
      });
    }

    const [row] = await db.insert(investments).values({
      userId: user.id,
      accountId: fundingAccountId,
      name,
      assetClass,
      symbol: body.symbol ? String(body.symbol) : null,
      quantity: quantity.toFixed(6),
      avgCost: price.toFixed(4),
      currentPrice: price.toFixed(4),
      currency,
      region: body.region ? String(body.region) : "Asia Pacific",
    }).returning();

    await db.insert(notifications).values({
      userId: user.id,
      title: "Investment executed",
      body: `Purchased ${quantity} units of ${name} for ${currency} ${totalCost.toFixed(2)}.`,
      type: "success",
    });

    return NextResponse.json({ investment: row }, { status: 201 });
  } catch (err) {
    console.error("Investments POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
