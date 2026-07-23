import { NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { accounts, transactions } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const { user, error } = await requireUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, user.id));
  const ids = userAccounts.map(a => a.id);
  if (ids.length === 0) return NextResponse.json({ recipients: [] });

  const txs = await db.select().from(transactions)
    .where(inArray(transactions.accountId, ids))
    .orderBy(desc(transactions.createdAt))
    .limit(100);

  // Extract unique recipients
  const seen = new Set<string>();
  const recipients: { name: string; account: string; bank?: string; country?: string }[] = [];
  for (const tx of txs) {
    if (!tx.counterpartyName || tx.counterpartyName.includes("RuiFeng") || tx.counterpartyName.includes("瑞峯")) continue;
    const key = `${tx.counterpartyName}|${tx.counterpartyAccount || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const meta = tx.metadata as Record<string, string> | null;
    recipients.push({
      name: tx.counterpartyName,
      account: tx.counterpartyAccount || "",
      bank: meta?.beneficiaryBank || "",
      country: meta?.beneficiaryCountry || "",
    });
    if (recipients.length >= 10) break;
  }

  return NextResponse.json({ recipients });
}
