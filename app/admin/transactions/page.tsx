import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, transactions, users } from "@/db/schema";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { TransactionActions, TransactionDetailToggle } from "@/components/admin/transaction-actions";

export default async function AdminTransactionsPage() {
  const rows = await db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(200);

  // Get account → user mapping
  const accountIds = [...new Set(rows.map(r => r.accountId))];
  const accountMap: Record<number, { accountNumber: string; nickname: string | null; userId: number; firstName: string; lastName: string; email: string }> = {};
  for (const aid of accountIds) {
    const [acct] = await db.select().from(accounts).where(eq(accounts.id, aid)).limit(1);
    if (acct) {
      const [u] = await db.select().from(users).where(eq(users.id, acct.userId)).limit(1);
      accountMap[aid] = {
        accountNumber: acct.accountNumber, nickname: acct.nickname, userId: acct.userId,
        firstName: u?.firstName || "", lastName: u?.lastName || "", email: u?.email || "",
      };
    }
  }

  return (
    <div>
      <PageHeader title="Transaction Review" subtitle="Full transaction details for compliance review before approval." />
      <Panel>
        <div className="space-y-3">
          {rows.map(tx => {
            const acctInfo = accountMap[tx.accountId];
            const meta = tx.metadata as Record<string, string> | null;
            return (
              <div key={tx.id} className={`rounded-2xl border p-4 ${tx.status === "pending" ? "border-bronze-400/30 bg-bronze-400/5" : "border-ink-900/5 bg-white"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={tx.status} />
                      <span className="text-xs font-mono text-ink-600/60">{tx.reference}</span>
                      <span className="text-xs capitalize text-ink-600/50">{tx.type.replaceAll("_", " ")}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-ink-900">{tx.counterpartyName || tx.description || "—"}</p>
                    <p className="text-xs text-ink-600/60">{tx.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display text-xl font-bold text-ink-900">{formatCurrency(tx.amount, tx.currency)}</p>
                    {tx.fee && parseFloat(tx.fee) > 0 && <p className="text-xs text-ink-600/50">Fee: {formatCurrency(tx.fee, tx.currency)}</p>}
                    <p className="text-xs text-ink-600/40 mt-1">{formatDateTime(tx.createdAt)}</p>
                  </div>
                </div>

                {/* Full transaction details for review */}
                <TransactionDetailToggle>
                  <div className="mt-3 rounded-xl bg-rice-100 p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div><p className="text-ink-600/50">Client</p><p className="font-semibold text-ink-900">{acctInfo?.firstName} {acctInfo?.lastName}</p><p className="text-ink-600/60">{acctInfo?.email}</p></div>
                    <div><p className="text-ink-600/50">Source Account</p><p className="font-semibold font-mono">{acctInfo?.accountNumber}</p><p className="text-ink-600/60">{acctInfo?.nickname}</p></div>
                    <div><p className="text-ink-600/50">Counterparty</p><p className="font-semibold">{tx.counterpartyName || "—"}</p><p className="font-mono text-ink-600/60">{tx.counterpartyAccount || "—"}</p></div>
                    <div><p className="text-ink-600/50">Category</p><p className="font-semibold">{tx.category || tx.type}</p></div>
                    {meta?.beneficiaryBank && <div><p className="text-ink-600/50">Bank</p><p className="font-semibold">{meta.beneficiaryBank}</p></div>}
                    {meta?.beneficiarySwift && <div><p className="text-ink-600/50">SWIFT</p><p className="font-mono font-semibold">{meta.beneficiarySwift}</p></div>}
                    {meta?.beneficiaryCountry && <div><p className="text-ink-600/50">Country</p><p className="font-semibold">{meta.beneficiaryCountry}</p></div>}
                    {meta?.transferType && <div><p className="text-ink-600/50">Transfer Type</p><p className="font-semibold capitalize">{meta.transferType}</p></div>}
                    <div><p className="text-ink-600/50">Processed</p><p className="font-semibold">{tx.processedAt ? formatDateTime(tx.processedAt) : "Not yet"}</p></div>
                    <div><p className="text-ink-600/50">Transaction ID</p><p className="font-mono font-semibold">#{tx.id}</p></div>
                  </div>
                </TransactionDetailToggle>

                {/* Actions */}
                <div className="mt-3 flex items-center justify-between">
                  <TransactionActions id={tx.id} status={tx.status} />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
