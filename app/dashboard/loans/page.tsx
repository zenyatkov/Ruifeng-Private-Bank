import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, loans } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EmptyState, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { LoanForm } from "@/components/forms/loan-form";
import { LoanCountdown } from "@/components/loan-countdown";
import { LoanRepayButton } from "@/components/forms/loan-repay";
import { t } from "@/lib/i18n";

export default async function LoansPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const lang = user.preferredLanguage || "en";
  const rows = await db.select().from(loans).where(eq(loans.userId, user.id)).orderBy(desc(loans.createdAt));
  const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, user.id));

  return (
    <div>
      <PageHeader title={t(lang, "lending")} subtitle={t(lang, "applyForCredit")} />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title={t(lang, "apply")}><LoanForm accounts={userAccounts} /></Panel>
        <Panel title={t(lang, "yourFacilities")}>
          {rows.length === 0 ? <EmptyState title={t(lang, "noLoans")} /> : (
            <div className="space-y-4">
              {rows.map(loan => (
                <div key={loan.id} className="rounded-2xl border border-ink-900/5 bg-white p-4 hover-lift">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-900">{loan.productName}</p>
                      <p className="text-xs text-ink-600/60">{loan.loanNumber}</p>
                    </div>
                    <StatusBadge status={loan.status} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                    <div><p className="text-xs text-ink-600/50">{t(lang, "principal")}</p><p className="font-semibold">{formatCurrency(loan.principal, loan.currency)}</p></div>
                    <div><p className="text-xs text-ink-600/50">{t(lang, "outstanding")}</p><p className="font-semibold">{formatCurrency(loan.outstanding, loan.currency)}</p></div>
                    <div><p className="text-xs text-ink-600/50">{t(lang, "rate")}</p><p className="font-semibold">{loan.interestRate}%</p></div>
                    <div><p className="text-xs text-ink-600/50">{t(lang, "monthly")}</p><p className="font-semibold">{loan.monthlyPayment ? formatCurrency(loan.monthlyPayment, loan.currency) : "—"}</p></div>
                  </div>
                  {loan.status === "active" && (
                    <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                      {loan.endDate && <LoanCountdown endDate={loan.endDate} />}
                      <LoanRepayButton loan={{ id: loan.id, loanNumber: loan.loanNumber, outstanding: loan.outstanding, currency: loan.currency, productName: loan.productName }} accounts={userAccounts} />
                    </div>
                  )}
                  {loan.status === "paid_off" && <p className="mt-2 text-xs text-jade-600 font-semibold">✓ {t(lang, "fullyRepaid")}</p>}
                  {loan.status === "active" && <p className="mt-1 text-xs text-ink-600/60">{loan.startDate ? `${t(lang, "started")} ${formatDate(loan.startDate)}` : ""}{loan.purpose ? ` · ${t(lang, "purpose")}: ${loan.purpose}` : ""}</p>}
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
