import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  accounts,
  cards,
  investments,
  loans,
  notifications,
  transactions,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ACCOUNT_TYPE_LABELS, formatCurrency, formatDateTime } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { EmptyState, PageHeader, Panel, StatCard, StatusBadge } from "@/components/ui";
import { fxRates } from "@/db/schema";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const lang = user.preferredLanguage || "en";
  const ccy = user.preferredCurrency || "SGD";

  // Load FX rates for currency conversion
  const rates = await db.select().from(fxRates);
  function convertToDisplay(amount: number, fromCurrency: string): number {
    if (fromCurrency === ccy) return amount;
    const direct = rates.find(r => r.baseCurrency === fromCurrency && r.quoteCurrency === ccy);
    if (direct) return amount * parseFloat(direct.rate);
    const inverse = rates.find(r => r.baseCurrency === ccy && r.quoteCurrency === fromCurrency);
    if (inverse) return amount / parseFloat(inverse.rate);
    // Cross via USD
    const toUsd = rates.find(r => r.baseCurrency === fromCurrency && r.quoteCurrency === "USD");
    const fromUsd = rates.find(r => r.baseCurrency === "USD" && r.quoteCurrency === ccy);
    if (fromCurrency === "USD" && fromUsd) return amount * parseFloat(fromUsd.rate);
    if (ccy === "USD" && toUsd) return amount * parseFloat(toUsd.rate);
    if (toUsd && fromUsd) return amount * parseFloat(toUsd.rate) * parseFloat(fromUsd.rate);
    return amount;
  }

  const userAccounts = await db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, user.id))
    .orderBy(desc(accounts.openedAt));

  const accountIds = userAccounts.map((a) => a.id);

  const recentTx =
    accountIds.length > 0
      ? await db
          .select()
          .from(transactions)
          .where(inArray(transactions.accountId, accountIds))
          .orderBy(desc(transactions.createdAt))
          .limit(8)
      : [];

  const userInvestments = await db.select().from(investments).where(eq(investments.userId, user.id));
  const userLoans = await db.select().from(loans).where(eq(loans.userId, user.id));
  const userCards = await db.select().from(cards).where(eq(cards.userId, user.id));
  const alerts = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)))
    .orderBy(desc(notifications.createdAt))
    .limit(5);

  // Convert all balances to display currency using FX rates
  const totalCash = userAccounts.reduce((sum, a) => sum + convertToDisplay(parseFloat(a.balance), a.currency), 0);
  const investValue = userInvestments.reduce(
    (sum, i) => sum + convertToDisplay(parseFloat(i.quantity) * parseFloat(i.currentPrice), i.currency),
    0
  );
  const loanOutstanding = userLoans
    .filter((l) => l.status === "active")
    .reduce((sum, l) => sum + convertToDisplay(parseFloat(l.outstanding), l.currency), 0);
  const netWorth = totalCash + investValue - loanOutstanding;

  return (
    <div>
      <PageHeader
        title={`${t(lang, "welcome")}, ${user.firstName}`}
        subtitle={t(lang, "privateBanking")}
        actions={
          <Link href="/dashboard/transfers" className="btn-primary text-sm">
            New {t(lang, "transfers")}
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t(lang, "totalWealth")} value={formatCurrency(netWorth, ccy)} hint={`${t(lang, "cashBalances")} + ${t(lang, "investments")} − ${t(lang, "activeLoans")}`} accent="jade" />
        <StatCard label={t(lang, "cashBalances")} value={formatCurrency(totalCash, ccy)} hint={`${userAccounts.length} ${t(lang, "accounts")}`} accent="ink" />
        <StatCard label={t(lang, "investments")} value={formatCurrency(investValue, ccy)} hint={`${userInvestments.length} ${t(lang, "positions")}`} accent="bronze" />
        <StatCard label={t(lang, "activeLoans")} value={formatCurrency(loanOutstanding, ccy)} hint={`${userCards.length} ${t(lang, "cards")}`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title={t(lang, "accounts")}>
          {userAccounts.length === 0 ? (
            <EmptyState title={t(lang, "noAccountsYet") || "No accounts yet"} description={t(lang, "multiCurrencyAccount") || "Open a multi-currency account to begin."} />
          ) : (
            <div className="space-y-3">
              {userAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex flex-col gap-3 rounded-2xl border border-ink-900/5 bg-rice-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-ink-900">{account.nickname || ACCOUNT_TYPE_LABELS[account.type]}</p>
                    <p className="mt-1 text-xs text-ink-600/70">
                      {account.accountNumber} · {ACCOUNT_TYPE_LABELS[account.type] || account.type}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-display text-xl font-semibold text-ink-900">
                      {formatCurrency(account.balance, account.currency)}
                    </p>
                    <div className="mt-1">
                      <StatusBadge status={account.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title={t(lang, "priorityAlerts") || "Priority alerts"}>
          {alerts.length === 0 ? (
            <EmptyState title={t(lang, "youreAllCaughtUp") || "You're all caught up"} description={t(lang, "noUnreadNotifications") || "No unread notifications."} />
          ) : (
            <div className="space-y-3">
              {alerts.map((n) => (
                <div key={n.id} className="rounded-2xl border border-ink-900/5 bg-rice-50 px-4 py-3">
                  <p className="text-sm font-semibold text-ink-900">{n.title}</p>
                  <p className="mt-1 text-xs text-ink-600/75">{n.body}</p>
                  <p className="mt-2 text-[11px] text-ink-600/50">{formatDateTime(n.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          title={t(lang, "recentActivity") || "Recent activity"}
          action={
            <Link href="/dashboard/accounts" className="text-sm font-semibold text-jade-600">
              {t(lang, "viewAccounts") || "View accounts"}
            </Link>
          }
        >
          {recentTx.length === 0 ? (
            <EmptyState title={t(lang, "noActivityYet") || "No transactions yet"} />
          ) : (
            <div className="space-y-2">
              {recentTx.map((tx, i) => {
                const isCredit = ["deposit", "interest", "loan_disbursement"].includes(tx.type);
                return (
                  <div key={tx.id} className="flex items-center gap-3 rounded-2xl border border-ink-900/5 bg-white p-3 hover-lift animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${isCredit ? "bg-jade-500/10 text-jade-600" : "bg-vermillion-500/8 text-vermillion-500"}`}>
                      {isCredit ? "↓" : "↑"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink-900 truncate">{tx.counterpartyName || tx.description || "—"}</p>
                      <p className="text-[11px] text-ink-600/50">{tx.type.replaceAll("_", " ")} · {formatDateTime(tx.createdAt)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${isCredit ? "text-jade-600" : "text-ink-900"}`}>
                        {isCredit ? "+" : "−"}{formatCurrency(tx.amount, tx.currency)}
                      </p>
                      <StatusBadge status={tx.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
