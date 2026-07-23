import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { accounts, transactions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ACCOUNT_TYPE_LABELS, formatCurrency, formatDateTime } from "@/lib/utils";
import { EmptyState, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { OpenAccountForm } from "@/components/forms/open-account-form";
import { t } from "@/lib/i18n";

export default async function AccountsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const lang = user.preferredLanguage || "en";

  const rows = await db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, user.id))
    .orderBy(desc(accounts.openedAt));

  const ids = rows.map((r) => r.id);
  const txs =
    ids.length > 0
      ? await db
          .select()
          .from(transactions)
          .where(inArray(transactions.accountId, ids))
          .orderBy(desc(transactions.createdAt))
          .limit(20)
      : [];

  return (
    <div>
      <PageHeader
        title={t(lang, "accounts")}
        subtitle={t(lang, "accountsSubtitle")}
        actions={<OpenAccountForm />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((account) => (
          <div key={account.id} className="premium-card rounded-3xl p-6 text-rice-50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-jade-300">
                  {ACCOUNT_TYPE_LABELS[account.type] || account.type}
                </p>
                <p className="mt-2 font-display text-2xl">{account.nickname || account.currency + " " + t(lang, "account")}</p>
              </div>
              <StatusBadge status={account.status} />
            </div>
            <p className="mt-6 font-display text-3xl text-jade-300">
              {formatCurrency(account.balance, account.currency)}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-rice-200/70">
              <div>
                <p className="text-rice-200/40">{t(lang, "accountNumber")}</p>
                <p className="mt-1 font-medium text-rice-50">{account.accountNumber}</p>
              </div>
              <div>
                <p className="text-rice-200/40">{t(lang, "iban")}</p>
                <p className="mt-1 font-medium text-rice-50">{account.iban}</p>
              </div>
              <div>
                <p className="text-rice-200/40">{t(lang, "available")}</p>
                <p className="mt-1 font-medium text-rice-50">
                  {formatCurrency(account.availableBalance, account.currency)}
                </p>
              </div>
              <div>
                <p className="text-rice-200/40">{t(lang, "interestRate")}</p>
                <p className="mt-1 font-medium text-rice-50">{account.interestRate}% p.a.</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {rows.length === 0 ? <EmptyState title={t(lang, "noAccounts")} description={t(lang, "openFirstAccount")} /> : null}

      <div className="mt-8">
        <Panel title={t(lang, "accountActivity")}>
          {txs.length === 0 ? (
            <EmptyState title={t(lang, "noActivity")} />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t(lang, "date")}</th>
                    <th>{t(lang, "reference")}</th>
                    <th>{t(lang, "description")}</th>
                    <th>{t(lang, "status")}</th>
                    <th>{t(lang, "amount")}</th>
                  </tr>
                </thead>
                <tbody>
                  {txs.map((tx) => (
                    <tr key={tx.id}>
                      <td>{formatDateTime(tx.createdAt)}</td>
                      <td>{tx.reference}</td>
                      <td>{tx.description}</td>
                      <td>
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="font-semibold">{formatCurrency(tx.amount, tx.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
