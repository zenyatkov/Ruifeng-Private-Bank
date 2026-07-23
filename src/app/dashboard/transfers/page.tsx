import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { accounts, receipts, transactions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { EmptyState, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { TransferForm } from "@/components/forms/transfer-form";
import { ViewReceiptButton } from "@/components/view-receipt-button";

export default async function TransfersPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, user.id));
  const ids = userAccounts.map(a => a.id);
  const allTx = ids.length > 0
    ? await db.select().from(transactions).where(inArray(transactions.accountId, ids)).orderBy(desc(transactions.createdAt)).limit(50)
    : [];
  const userReceipts = await db.select().from(receipts).where(eq(receipts.userId, user.id));
  const receiptMap = new Map(userReceipts.map(r => [r.transactionId, r]));

  return (
    <div>
      <PageHeader title="Transfers" subtitle="Send money securely across accounts and banks." />
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Panel title="New Transfer">
          <TransferForm accounts={userAccounts} />
        </Panel>

        <Panel title="Recent Activity">
          {allTx.length === 0 ? <EmptyState title="No activity yet" /> : (
            <div className="space-y-2 max-h-[650px] overflow-y-auto scrollbar-thin pr-1">
              {allTx.map((tx, i) => {
                const isCredit = ["deposit", "interest", "loan_disbursement"].includes(tx.type);
                const receipt = receiptMap.get(tx.id);
                return (
                  <div key={tx.id} className="rounded-2xl border border-ink-900/5 bg-white p-4 hover-lift animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${isCredit ? "bg-jade-500/10 text-jade-600" : "bg-vermillion-500/8 text-vermillion-500"}`}>
                        {isCredit ? "↓" : "↑"}
                      </div>
                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-ink-900 truncate">{tx.counterpartyName || tx.description || tx.type}</p>
                            <p className="text-xs text-ink-600/50 mt-0.5">{tx.category || tx.type.replaceAll("_", " ")} · {formatDateTime(tx.createdAt)}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-sm font-bold ${isCredit ? "text-jade-600" : "text-ink-900"}`}>
                              {isCredit ? "+" : "−"}{formatCurrency(tx.amount, tx.currency)}
                            </p>
                            {tx.fee && parseFloat(tx.fee) > 0 && <p className="text-[10px] text-ink-600/40">Fee: {formatCurrency(tx.fee, tx.currency)}</p>}
                          </div>
                        </div>
                        {/* Status + receipt */}
                        <div className="mt-2 flex items-center gap-2">
                          <StatusBadge status={tx.status} />
                          <span className="text-[10px] font-mono text-ink-600/40">{tx.reference}</span>
                          {receipt && <ViewReceiptButton receiptData={receipt.data as Record<string, string>} />}
                        </div>
                      </div>
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
