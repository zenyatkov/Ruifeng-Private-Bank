import { count, eq, sql, gte } from "drizzle-orm";
import { db } from "@/db";
import { accounts, transactions, users, loans, cards, billPayments } from "@/db/schema";
import { formatCurrency } from "@/lib/utils";
import { PageHeader, Panel, StatCard } from "@/components/ui";
import { AnalyticsCharts } from "@/components/admin/analytics-charts";

export default async function AnalyticsPage() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers] = await db.select({ v: count() }).from(users);
  const [newUsers30d] = await db.select({ v: count() }).from(users).where(gte(users.createdAt, thirtyDaysAgo));
  const [totalTx] = await db.select({ v: count() }).from(transactions);
  const [tx7d] = await db.select({ v: count() }).from(transactions).where(gte(transactions.createdAt, sevenDaysAgo));
  const [pendingTx] = await db.select({ v: count() }).from(transactions).where(eq(transactions.status, "pending"));
  const [totalCards] = await db.select({ v: count() }).from(cards);
  const [pendingCards] = await db.select({ v: count() }).from(cards).where(eq(cards.status, "pending"));
  const [activeLoans] = await db.select({ v: count() }).from(loans).where(eq(loans.status, "active"));
  const [pendingLoans] = await db.select({ v: count() }).from(loans).where(eq(loans.status, "pending"));
  const [totalBills] = await db.select({ v: count() }).from(billPayments);
  const [aum] = await db.select({ v: sql<string>`coalesce(sum(${accounts.balance}::numeric),0)` }).from(accounts).where(eq(accounts.status, "active"));
  const [loanBook] = await db.select({ v: sql<string>`coalesce(sum(${loans.outstanding}::numeric),0)` }).from(loans).where(eq(loans.status, "active"));

  // Tx by type
  const txByType = await db.select({ type: transactions.type, count: count() }).from(transactions).groupBy(transactions.type);
  // Users by country
  const usersByCountry = await db.select({ country: users.country, count: count() }).from(users).where(eq(users.role, "client")).groupBy(users.country);
  // KYC stats
  const kycStats = await db.select({ status: users.kycStatus, count: count() }).from(users).where(eq(users.role, "client")).groupBy(users.kycStatus);

  return (
    <div>
      <PageHeader title="Analytics Dashboard" subtitle="Platform metrics and insights." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total AUM" value={formatCurrency(aum.v, "SGD")} hint="Active accounts" accent="jade" />
        <StatCard label="Loan Book" value={formatCurrency(loanBook.v, "SGD")} accent="bronze" />
        <StatCard label="Total Users" value={String(totalUsers.v)} hint={`+${newUsers30d.v} (30d)`} accent="ink" />
        <StatCard label="Transactions (7d)" value={String(tx7d.v)} hint={`${pendingTx.v} pending`} accent="vermillion" />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Cards" value={String(totalCards.v)} hint={`${pendingCards.v} pending`} />
        <StatCard label="Active Loans" value={String(activeLoans.v)} hint={`${pendingLoans.v} pending`} />
        <StatCard label="Bill Payments" value={String(totalBills.v)} />
        <StatCard label="Total Transactions" value={String(totalTx.v)} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Transactions by Type">
          <AnalyticsCharts data={txByType.map(t => ({ label: t.type.replaceAll("_", " "), value: t.count }))} color="jade" />
        </Panel>
        <Panel title="Clients by Market">
          <AnalyticsCharts data={usersByCountry.map(u => ({ label: u.country || "Unknown", value: u.count }))} color="bronze" />
        </Panel>
        <Panel title="KYC Status">
          <AnalyticsCharts data={kycStats.map(k => ({ label: k.status, value: k.count }))} color="ink" />
        </Panel>
      </div>
    </div>
  );
}
