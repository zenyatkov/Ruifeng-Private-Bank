import { NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { accounts, transactions } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { user, error } = await requireUser();
    if (!user) {
      return NextResponse.json({ error }, { status: error === "Forbidden" ? 403 : 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const limit = Math.min(Number(searchParams.get("limit") || 50), 200);

    if (user.role === "admin" && !accountId) {
      const rows = await db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(limit);
      return NextResponse.json({ transactions: rows });
    }

    if (accountId) {
      const [account] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.id, Number(accountId)))
        .limit(1);
      if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });
      if (user.role !== "admin" && account.userId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const rows = await db
        .select()
        .from(transactions)
        .where(eq(transactions.accountId, account.id))
        .orderBy(desc(transactions.createdAt))
        .limit(limit);
      return NextResponse.json({ transactions: rows });
    }

    const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, user.id));
    const ids = userAccounts.map((a) => a.id);
    if (ids.length === 0) return NextResponse.json({ transactions: [] });

    const rows = await db
      .select()
      .from(transactions)
      .where(inArray(transactions.accountId, ids))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);

    return NextResponse.json({ transactions: rows });
  } catch (err) {
    console.error("Transactions API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
