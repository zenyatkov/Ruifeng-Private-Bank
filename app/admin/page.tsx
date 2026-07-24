import { formatCurrency, formatDateTime } from "@/lib/utils";
import { PageHeader, Panel, StatCard } from "@/components/ui";
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
import { count, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { t } from "@/lib/i18n";

export default async function AdminHomePage() {
  const user = await getCurrentUser();
  const lang = user?.preferredLanguage || "en";
  const [userCount] = await db.select({ value: count() }).from(users);
  const [clientCount] = await db.select({ value: count() }).from(users).where(eq(users.role, "client"));
  const [accountCount] = await db.select({ value: count() }).from(accounts);
  const [pendingTx] = await db
    .select({ value: count() })
    .from(transactions)
    .where(eq(transactions.status, "pending"));
  const [openTickets] = await db
    .select({ value: count() })
    .from(supportTickets)
    .where(eq(supportTickets.status, "open"));
  const [pendingLoans] = await db.select({ value: count() }).from(loans).where(eq(loans.status, "pending"));
  const [pendingKyc] = await db.select({ value: count() }).from(users).where(eq(users.kycStatus, "pending"));
  const [aum] = await db
    .select({ value: sql<string>`coalesce(sum(${accounts.balance}::numeric), 0)` })
    .from(accounts)
    .where(eq(accounts.status, "active"));
  const [loanBook] = await db
    .select({ value: sql<string>`coalesce(sum(${loans.outstanding}::numeric), 0)` })
    .from(loans)
    .where(eq(loans.status, "active"));
  const [investAum] = await db
    .select({
      value: sql<string>`coalesce(sum((${investments.quantity}::numeric) * (${investments.currentPrice}::numeric)), 0)`,
    })
    .from(investments);

  const recentLogs = await db.select().from(adminLogs).orderBy(sql`${adminLogs.createdAt} desc`).limit(12);
  const clientsByCountry = await db
    .select({ country: users.country, count: count() })
    .from(users)
    .where(eq(users.role, "client"))
    .groupBy(users.country);

  return (
    <div>
      <PageHeader
        title={t(lang, "adminCommandCenter") || "Command Center"}
        subtitle={t(lang, "adminCommandSub") || "Enterprise control over clients, balances, credit, compliance, and concierge operations."}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Platform AUM" value={formatCurrency(aum.value, "USD")} hint="Active account balances" accent="jade" />
        <StatCard label="Investment book" value={formatCurrency(investAum.value, "USD")} accent="bronze" />
        <StatCard label="Loan book" value={formatCurrency(loanBook.value, "USD")} accent="ink" />
        <StatCard label="Clients" value={String(clientCount.value)} hint={`${userCount.value} total users`} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Accounts" value={String(accountCount.value)} />
        <StatCard label="Pending TX" value={String(pendingTx.value)} hint="Awaiting approval" />
        <StatCard label="Open tickets" value={String(openTickets.value)} />
        <StatCard label="KYC queue" value={String(pendingKyc.value)} hint={`${pendingLoans.value} loans pending`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Clients by market">
          <div className="space-y-3">
            {clientsByCountry.map((row) => (
              <div key={row.country || "Unknown"} className="flex items-center justify-between rounded-xl bg-rice-50 px-4 py-3">
                <span className="font-medium text-ink-900">{row.country || "Unspecified"}</span>
                <span className="font-display text-xl text-jade-600">{row.count}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Recent admin actions">
          <div className="space-y-3">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-ink-600/70">No administrative actions logged yet.</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="rounded-xl border border-ink-900/5 bg-rice-50 px-4 py-3">
                  <p className="text-sm font-semibold text-ink-900">{log.action}</p>
                  <p className="mt-1 text-xs text-ink-600/70">{log.details}</p>
                  <p className="mt-1 text-[11px] text-ink-600/50">{formatDateTime(log.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
