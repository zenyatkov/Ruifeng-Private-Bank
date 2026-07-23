"use client";

import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { PageHeader, Panel, Button, Label, Select, EmptyState } from "@/components/ui";
import { useUserPrefs } from "@/components/user-context";
import { t } from "@/lib/i18n";

export default function StatementsPage() {
  const { lang } = useUserPrefs();
  const [accounts, setAccounts] = useState<Array<Record<string, unknown>>>([]);
  const [accountId, setAccountId] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [preview, setPreview] = useState<{ transactions: Array<Record<string, unknown>>; count: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/accounts").then(r => r.json()).then(d => {
      // Handle successResponse wrapper: { ok, data: { accounts } } OR plain { accounts }
      const accts = d.data?.accounts || d.accounts || [];
      setAccounts(accts);
      if (accts[0]) setAccountId(String(accts[0].id));
    });
  }, []);

  async function loadStatement() {
    if (!accountId) return;
    setLoading(true);
    const res = await fetch(`/api/statements?accountId=${accountId}&month=${month}`);
    const d = await res.json();
    // Handle successResponse wrapper
    const txData = d.data?.transactions || d.transactions || [];
    const count = d.data?.count || d.count || txData.length;
    setPreview({ transactions: txData, count });
    setLoading(false);
  }

  function downloadCSV() { if (accountId) window.open(`/api/statements?accountId=${accountId}&month=${month}&format=csv`); }
  function downloadTXT() { if (accountId) window.open(`/api/statements?accountId=${accountId}&month=${month}&format=txt`); }

  // Generate last 12 months
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });

  return (
    <div>
      <PageHeader title={t(lang, "statements")} subtitle={t(lang, "downloadStatements") || "Download monthly statements in CSV or TXT format."} />
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel title={t(lang, "generateStatement") || "Generate statement"}>
          <div className="space-y-4">
            <div><Label>{t(lang, "accounts")}</Label>
              <Select value={accountId} onChange={e => setAccountId(e.target.value)}>
                {!accountId && <option value="">{t(lang, "selectAccount") || "Select account…"}</option>}
                {accounts.map((a: Record<string, unknown>) => <option key={String(a.id)} value={String(a.id)}>{String(a.nickname || a.accountNumber)} · {String(a.currency)}</option>)}
              </Select>
            </div>
            <div><Label>{t(lang, "month") || "Month"}</Label>
              <Select value={month} onChange={e => setMonth(e.target.value)}>
                {months.map(m => <option key={m} value={m}>{new Date(m + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}</option>)}
              </Select>
            </div>
            <Button onClick={loadStatement} className="w-full" disabled={loading || !accountId}>{loading ? t(lang, "loading") : t(lang, "previewStatement") || "Preview statement"}</Button>
            {preview && (
              <div className="space-y-2 pt-2 border-t border-ink-900/5">
                <p className="text-sm text-ink-700">{preview.count} {t(lang, "transactions") || "transactions"} found</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" onClick={downloadCSV}><Download className="h-4 w-4" />CSV</Button>
                  <Button variant="secondary" onClick={downloadTXT}><FileText className="h-4 w-4" />TXT</Button>
                </div>
              </div>
            )}
          </div>
        </Panel>
        <Panel title={t(lang, "preview") || "Preview"}>
          {!preview ? <EmptyState title={t(lang, "selectAccountAndMonth") || "Select account and month"} description={t(lang, "thenPreview") || "Then click Preview to see transactions."} /> : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
              {preview.transactions.length === 0 ? <EmptyState title={t(lang, "noTransactionsThisMonth") || "No transactions this month"} /> : (
                preview.transactions.map((tx: Record<string, unknown>, i: number) => {
                  const isCredit = ["deposit", "interest", "loan_disbursement"].includes(String(tx.type));
                  return (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-ink-900/5 bg-white p-3 animate-fade-in" style={{ animationDelay: `${i * 20}ms` }}>
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${isCredit ? "bg-jade-500/10 text-jade-600" : "bg-vermillion-500/8 text-vermillion-500"}`}>
                        {isCredit ? "↓" : "↑"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink-900 truncate">{String(tx.counterpartyName || tx.description || tx.type)}</p>
                        <p className="text-[10px] text-ink-600/50">{String(tx.reference)} · {new Date(String(tx.createdAt)).toLocaleDateString()}</p>
                      </div>
                      <p className={`text-sm font-bold shrink-0 ${isCredit ? "text-jade-600" : "text-ink-900"}`}>
                        {isCredit ? "+" : "−"}{String(tx.currency)} {String(tx.amount)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
