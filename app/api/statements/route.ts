import { NextResponse } from "next/server";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { accounts, transactions } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const { user, error } = await requireUser();
    if (!user) return NextResponse.json({ error }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const accountId = Number(searchParams.get("accountId"));
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);
    const format = searchParams.get("format") || "json";

    if (!accountId) return NextResponse.json({ error: "accountId required" }, { status: 400 });
    const [acct] = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
    if (!acct) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    if (user.role !== "admin" && acct.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const startDate = new Date(`${month}-01T00:00:00Z`);
    const endDate = new Date(startDate); endDate.setMonth(endDate.getMonth() + 1);

    const txs = await db.select().from(transactions)
      .where(and(eq(transactions.accountId, accountId), gte(transactions.createdAt, startDate), lte(transactions.createdAt, endDate)))
      .orderBy(desc(transactions.createdAt));

    if (format === "csv") {
      const header = "Date,Reference,Type,Description,Counterparty,Amount,Fee,Currency,Status\n";
      const rows = txs.map(t => `"${formatDateTime(t.createdAt)}","${t.reference}","${t.type}","${t.description || ""}","${t.counterpartyName || ""}","${t.amount}","${t.fee || 0}","${t.currency}","${t.status}"`).join("\n");
      return new Response(header + rows, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="statement_${acct.accountNumber}_${month}.csv"` } });
    }

    if (format === "txt") {
      let txt = `瑞峯 RuiFeng Private Bank — Account Statement\n${"=".repeat(60)}\n`;
      txt += `Account: ${acct.accountNumber} (${acct.nickname || acct.type})\nCurrency: ${acct.currency}\nPeriod: ${month}\nBalance: ${acct.currency} ${acct.balance}\nGenerated: ${new Date().toISOString()}\n\n`;
      txt += `${"Date".padEnd(22)}${"Reference".padEnd(22)}${"Type".padEnd(14)}${"Amount".padEnd(16)}${"Status".padEnd(12)}\n`;
      txt += `${"-".repeat(86)}\n`;
      for (const t of txs) {
        txt += `${formatDateTime(t.createdAt).padEnd(22)}${t.reference.padEnd(22)}${t.type.padEnd(14)}${(t.currency + " " + t.amount).padEnd(16)}${t.status.padEnd(12)}\n`;
      }
      txt += `\n${"=".repeat(60)}\nCONFIDENTIAL — 瑞峯 RuiFeng Private Bank Ltd. MAS Regulated.\n`;
      return new Response(txt, { headers: { "Content-Type": "text/plain", "Content-Disposition": `attachment; filename="statement_${acct.accountNumber}_${month}.txt"` } });
    }

    return NextResponse.json({ account: acct, month, transactions: txs, count: txs.length });
  } catch (err) {
    console.error("Statements GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
