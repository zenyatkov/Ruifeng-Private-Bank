import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, investments } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { EmptyState, PageHeader, Panel, StatCard } from "@/components/ui";
import { InvestmentForm } from "@/components/forms/investment-form";
import { SellInvestmentButton } from "@/components/forms/sell-investment";

export default async function InvestmentsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const lang = user.preferredLanguage || "en";
  const rows = await db.select().from(investments).where(eq(investments.userId, user.id));
  const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, user.id));

  const positions = rows.map(r => {
    const qty = parseFloat(r.quantity); const cost = parseFloat(r.avgCost); const price = parseFloat(r.currentPrice);
    const mtm = qty * price; const pnl = mtm - qty * cost; const pnlPct = qty * cost > 0 ? (pnl / (qty * cost)) * 100 : 0;
    return { ...r, mtm, pnl, pnlPct };
  });
  const totalMtm = positions.reduce((s, p) => s + p.mtm, 0);
  const totalPnl = positions.reduce((s, p) => s + p.pnl, 0);

  return (
    <div>
      <PageHeader title={t(lang, "investments")} subtitle="Buy and sell positions. Profits withdraw to your account at market price." />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label={t(lang, "portfolioMTM") || "Portfolio MTM"} value={formatCurrency(totalMtm, "USD")} accent="jade" />
        <StatCard label={t(lang, "totalPL") || "Total P&L"} value={formatCurrency(totalPnl, "USD")} hint={totalPnl >= 0 ? "In profit" : "Loss"} accent={totalPnl >= 0 ? "jade" : "vermillion"} />
        <StatCard label={t(lang, "positions") || "Positions"} value={String(positions.length)} accent="ink" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Panel title={t(lang, "holdings") || "Holdings"}>
          {positions.length === 0 ? <EmptyState title={t(lang, "noPositions") || "No investments"} /> : (
            <div className="space-y-3">
              {positions.map(p => (
                <div key={p.id} className="rounded-2xl border border-ink-900/5 bg-rice-50 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-ink-900">{p.name}</p>
                      <p className="text-xs text-ink-600/60">{p.symbol || "—"} · {p.assetClass} · {p.region}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(p.mtm, p.currency)}</p>
                      <p className={`text-xs font-semibold ${p.pnl >= 0 ? "text-jade-600" : "text-vermillion-500"}`}>
                        {p.pnl >= 0 ? "+" : ""}{formatCurrency(p.pnl, p.currency)} ({p.pnlPct.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-ink-600/60">
                    <span>{parseFloat(p.quantity).toLocaleString()} units @ {p.currency} {parseFloat(p.currentPrice).toLocaleString()}</span>
                    <SellInvestmentButton investment={p} accounts={userAccounts} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel title={t(lang, "buyPositions") || "Buy"}>
          <InvestmentForm accounts={userAccounts} />
        </Panel>
      </div>
    </div>
  );
}
