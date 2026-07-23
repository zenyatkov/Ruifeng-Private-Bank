import { NextResponse } from "next/server";
import { count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  accounts,
  adminLogs,
  investments,
  loans,
  supportTickets,
  transactions,
  users,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const { user, error } = await requireUser(["admin", "relationship_manager"]);
  if (!user) {
    return NextResponse.json({ error }, { status: error === "Forbidden" ? 403 : 401 });
  }

  const [userCount] = await db.select({ value: count() }).from(users);
  const [clientCount] = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.role, "client"));
  const [accountCount] = await db.select({ value: count() }).from(accounts);
  const [txCount] = await db.select({ value: count() }).from(transactions);
  const [pendingTx] = await db
    .select({ value: count() })
    .from(transactions)
    .where(eq(transactions.status, "pending"));
  const [openTickets] = await db
    .select({ value: count() })
    .from(supportTickets)
    .where(eq(supportTickets.status, "open"));
  const [pendingLoans] = await db
    .select({ value: count() })
    .from(loans)
    .where(eq(loans.status, "pending"));
  const [pendingKyc] = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.kycStatus, "pending"));

  const [aum] = await db
    .select({
      value: sql<string>`coalesce(sum(${accounts.balance}::numeric), 0)`,
    })
    .from(accounts)
    .where(eq(accounts.status, "active"));

  const [loanBook] = await db
    .select({
      value: sql<string>`coalesce(sum(${loans.outstanding}::numeric), 0)`,
    })
    .from(loans)
    .where(eq(loans.status, "active"));

  const [investAum] = await db
    .select({
      value: sql<string>`coalesce(sum((${investments.quantity}::numeric) * (${investments.currentPrice}::numeric)), 0)`,
    })
    .from(investments);

  const recentLogs = await db.select().from(adminLogs).orderBy(sql`${adminLogs.createdAt} desc`).limit(15);

  const clientsByCountry = await db
    .select({
      country: users.country,
      count: count(),
    })
    .from(users)
    .where(eq(users.role, "client"))
    .groupBy(users.country);

  return NextResponse.json({
    stats: {
      totalUsers: userCount.value,
      totalClients: clientCount.value,
      totalAccounts: accountCount.value,
      totalTransactions: txCount.value,
      pendingTransactions: pendingTx.value,
      openTickets: openTickets.value,
      pendingLoans: pendingLoans.value,
      pendingKyc: pendingKyc.value,
      totalAum: aum.value,
      loanBook: loanBook.value,
      investmentAum: investAum.value,
    },
    recentLogs,
    clientsByCountry,
  });
}
