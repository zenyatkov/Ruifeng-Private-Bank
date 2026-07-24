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
import { EmptyState, PageHeader, Panel, StatusBadge } from "@/components/ui";
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
    const toUsd = rates.find(r => r.baseCurrency === fromCurrency && r.quoteCurrency === "USD");
    const fromUsd = rates.find(r => r.baseCurrency === "USD" && r.quoteCurrency === ccy);
    if (fromCurrency === "USD" && fromUsd) return amount * parseFloat(fromUsd.rate);
    if (ccy === "USD" && toUsd) return amount * parseFloat(toUsd.rate);
    if (toUsd && fromUsd) return amount * parseFloat(toUsd.rate) * parseFloat(fromUsd.rate);
    return amount;
  }

  const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, user.id)).orderBy(desc(accounts.openedAt));
  const accountIds = userAccounts.map((a) => a.id);
  const recentTx = accountIds.length > 0
    ? await db.select().from(transactions).where(inArray(transactions.accountId, accountIds)).orderBy(desc(transactions.createdAt)).limit(8)
    : [];
  const userInvestments = await db.select().from(investments).where(eq(investments.userId, user.id));
  const userLoans = await db.select().from(loans).where(eq(loans.userId, user.id));
  const userCards = await db.select().from(cards).where(eq(cards.userId, user.id));
  const alerts = await db.select().from(notifications).where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false))).orderBy(desc(notifications.createdAt)).limit(5);

  // Convert all balances to display currency using FX rates
  const totalCash = userAccounts.reduce((sum, a) => sum + convertToDisplay(parseFloat(a.balance), a.currency), 0);
  const investValue = userInvestments.reduce((sum, i) => sum + convertToDisplay(parseFloat(i.quantity) * parseFloat(i.currentPrice), i.currency), 0);
  const loanOutstanding = userLoans.filter((l) => l.status === "active").reduce((sum, l) => sum + convertToDisplay(parseFloat(l.outstanding), l.currency), 0);
  const netWorth = totalCash + investValue - loanOutstanding;
  const investPnl = userInvestments.reduce((sum, i) => {
    const qty = parseFloat(i.quantity); const cost = parseFloat(i.avgCost); const price = parseFloat(i.currentPrice);
    return sum + convertToDisplay(qty * price - qty * cost, i.currency);
  }, 0);

  return (
    <div>
      <PageHeader
        title={`${t(lang, "greeting")}, ${user.firstName}`}
        subtitle={t(lang, "privateBanking")}
        actions={<Link href="/dashboard/transfers" className="btn-primary text-sm">New {t(lang, "transfers")}</Link>}
      />

      {/* ── WEALTH SNAPSHOT — Large hero card ── */}
      <div className="premium-card rounded-3xl p-8 text-rice-50 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-jade-300/80 font-semibold">{t(lang, "totalWealth")}</p>
            <p className="mt-3 font-display text-4xl md:text-5xl font-bold text-white leading-tight">
              {formatCurrency(netWorth, ccy)}
            </p>
            <div className="mt-4 flex items-center gap-4 text-sm text-rice-200/70">
              <span>💰 {t(lang, "cashBalances")}: {formatCurrency(totalCash, ccy)}</span>
              <span>📈 {t(lang, "investments")}: {formatCurrency(investValue, ccy)}</span>
              <span>🏦 {t(lang, "activeLoans")}: −{formatCurrency(loanOutstanding, ccy)}</span>
            </div>
            {/* Investment P&L indicator */}
            {userInvestments.length > 0 && (
              <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${investPnl >= 0 ? "bg-jade-500/15 text-jade-300" : "bg-vermillion-500/15 text-vermillion-400"}`}>
                {investPnl >= 0 ? "↑" : "↓"} {t(lang, "totalPL")}: {investPnl >= 0 ? "+" : ""}{formatCurrency(investPnl, ccy)}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {/* Fintech features badges */}
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-jade-500/15 px-3 py-1 text-xs font-semibold text-jade-300">🪙 Crypto Payments</span>
              <span className="rounded-full bg-bronze-400/15 px-3 py-1 text-xs font-semibold text-bronze-300">📊 Live Markets</span>
              <span className="rounded-full bg-rice-200/10 px-3 py-1 text-xs font-semibold text-rice-200/80">🔒 256-bit SSL</span>
            </div>
            <p className="text-xs text-rice-200/50 max-w-xs">
              {t(lang, "fintechTagline") || "Asia-Pacific digital banking. Low taxes, crypto-friendly, institutional-grade security."}
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="text-[10px] text-rice-200/40">SG · HK · JP · KR · CN · IN · TH · MY · ID · VN · PH · TW · AU · AE · US · CA · UK</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards row ── */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="stat-luxury rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-ink-600/50 font-semibold">{t(lang, "cashBalances")}</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900">{formatCurrency(totalCash, ccy)}</p>
          <p className="mt-1 text-xs text-ink-600/60">{userAccounts.length} {t(lang, "accounts")} · {userCards.length} {t(lang, "cards")}</p>
        </div>
        <div className="stat-luxury rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-ink-600/50 font-semibold">{t(lang, "investments")}</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900">{formatCurrency(investValue, ccy)}</p>
          <p className={`mt-1 text-xs font-semibold ${investPnl >= 0 ? "text-jade-600" : "text-vermillion-500"}`}>
            P&L: {investPnl >= 0 ? "+" : ""}{formatCurrency(investPnl, ccy)}
          </p>
        </div>
        <div className="stat-luxury rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-ink-600/50 font-semibold">{t(lang, "activeLoans")}</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900">{formatCurrency(loanOutstanding, ccy)}</p>
          <p className="mt-1 text-xs text-ink-600/60">{userLoans.filter(l => l.status === "active").length} active facilities</p>
        </div>
      </div>

      {/* ── Accounts + Alerts ── */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title={t(lang, "accounts")}>
          {userAccounts.length === 0 ? (
            <EmptyState title={t(lang, "noAccountsYet") || "No accounts yet"} description={t(lang, "multiCurrencyAccount") || "Open a multi-currency account to begin."} />
          ) : (
            <div className="space-y-3">
              {userAccounts.map((account) => (
                <div key={account.id} className="flex flex-col gap-3 rounded-2xl border border-ink-900/5 bg-rice-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between hover-lift transition">
                  <div>
                    <p className="font-semibold text-ink-900">{account.nickname || ACCOUNT_TYPE_LABELS[account.type]}</p>
                    <p className="mt-1 text-xs text-ink-600/70">{account.accountNumber} · {ACCOUNT_TYPE_LABELS[account.type] || account.type}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-display text-xl font-semibold text-ink-900">{formatCurrency(account.balance, account.currency)}</p>
                    <div className="mt-1"><StatusBadge status={account.status} /></div>
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

      {/* ── Recent Activity ── */}
      <div className="mt-6">
        <Panel title={t(lang, "recentActivity") || "Recent activity"} action={<Link href="/dashboard/accounts" className="text-sm font-semibold text-jade-600">{t(lang, "viewAccounts") || "View accounts"}</Link>}>
          {recentTx.length === 0 ? (
            <EmptyState title={t(lang, "noActivityYet") || "No transactions yet"} />
          ) : (
            <div className="space-y-2">
              {recentTx.map((tx, i) => {
                const isCredit = ["deposit", "interest", "loan_disbursement"].includes(tx.type);
                return (
                  <div key={tx.id} className="flex items-center gap-3 rounded-2xl border border-ink-900/5 bg-white p-3 hover-lift animate-fade-in transition" style={{ animationDelay: `${i * 40}ms` }}>
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

      {/* ── Fintech banner ── */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-jade-500/15 bg-jade-500/5 p-5 text-center hover-lift transition">
          <p className="text-2xl mb-2">🪙</p>
          <p className="font-semibold text-ink-900 text-sm">Crypto Payments</p>
          <p className="text-xs text-ink-600/70 mt-1">Fund with BTC, ETH, USDT. Instant settlement, zero FX friction.</p>
        </div>
        <div className="rounded-2xl border border-bronze-400/15 bg-bronze-400/5 p-5 text-center hover-lift transition">
          <p className="text-2xl mb-2">📊</p>
          <p className="font-semibold text-ink-900 text-sm">Low Tax Jurisdictions</p>
          <p className="text-xs text-ink-600/70 mt-1">Optimised for Asia-Pacific. Capital gains at 0% in SG, HK, and AE.</p>
        </div>
        <div className="rounded-2xl border border-ink-900/10 bg-rice-100 p-5 text-center hover-lift transition">
          <p className="text-2xl mb-2">🌍</p>
          <p className="font-semibold text-ink-900 text-sm">Global Banking</p>
          <p className="text-xs text-ink-600/70 mt-1">18 markets: SG, HK, JP, KR, CN, IN, TH, MY, ID, VN, PH, TW, AU, AE, US, CA, UK, NZ.</p>
        </div>
      </div>
    </div>
  );
}
