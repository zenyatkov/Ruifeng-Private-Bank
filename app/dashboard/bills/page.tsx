"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import { PageHeader, Panel, Alert, Button, Input, Label, Select, StatusBadge, EmptyState } from "@/components/ui";
import { PinEntry } from "@/components/pin-entry";
import { playNotificationSound } from "@/components/notifications-client";
import { TransactionReceipt } from "@/components/receipt";
import { useUserPrefs } from "@/components/user-context";
import { t } from "@/lib/i18n";

type Biller = { name: string; category: string };

export default function BillsPage() {
  const router = useRouter();
  const { lang } = useUserPrefs();
  const [billers, setBillers] = useState<Biller[]>([]);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [accounts, setAccounts] = useState<Array<Record<string, unknown>>>([]);
  const [biller, setBiller] = useState("");
  const [category, setCategory] = useState("");
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Processing → Completed flow
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<{ label: string; value: string }[] | null>(null);

  useEffect(() => {
    // Fetch billers for user's country by passing it to the API
    fetch("/api/auth/me").then(r => r.json()).then(me => {
      const country = me.user?.country || "Singapore";
      fetch(`/api/bills?country=${encodeURIComponent(country)}`).then(r => r.json()).then(d => {
        // Handle both wrapped successResponse and plain JSON
        const billerData = d.data?.billers || d.billers || [];
        const historyData = d.data?.history || d.history || [];
        setBillers(billerData);
        setHistory(historyData);
      });
    });
    fetch("/api/accounts").then(r => r.json()).then(d => {
      const accts = d.data?.accounts || d.accounts || [];
      setAccounts(accts);
      if (accts[0]) setAccountId(String(accts[0].id));
    });
  }, []);

  async function executePay() {
    setShowPin(false); setLoading(true); setError("");
    const b = billers.find(x => x.name === biller);
    const res = await fetch("/api/bills", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId: Number(accountId), amount, billerName: biller, billerCategory: b?.category || category, referenceNumber: reference }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || data.data?.error || "Failed"); playNotificationSound("error"); return; }

    const bill = data.data?.bill || data.bill;
    const newBalance = data.data?.newBalance || data.newBalance;
    const ref = data.data?.reference || data.reference;

    // Show processing animation then pending confirmation
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      playNotificationSound("info");
      setReceipt([
        { label: t(lang, "status"), value: "Pending" },
        { label: t(lang, "biller") || "Biller", value: biller },
        { label: t(lang, "category") || "Category", value: b?.category || "Utilities" },
        { label: t(lang, "reference"), value: ref },
        { label: "Bill Reference", value: reference || "—" },
        { label: t(lang, "amount"), value: `${bill?.currency || "USD"} ${bill?.amount || amount}` },
        { label: t(lang, "balance") || "New Balance", value: `${bill?.currency || "USD"} ${newBalance}` },
        { label: t(lang, "date"), value: new Date().toLocaleString() },
        { label: "Note", value: t(lang, "pending") + " — " + "Your payment is being processed." },
      ]);
      setAmount(""); setReference("");
      // Refresh history
      fetch("/api/auth/me").then(r => r.json()).then(me => {
        const country = me.user?.country || "Singapore";
        fetch(`/api/bills?country=${encodeURIComponent(country)}`).then(r => r.json()).then(d => {
          setHistory(d.data?.history || d.history || []);
        });
      });
      router.refresh();
    }, 3000);
  }

  // Processing overlay
  if (processing) {
    return (
      <div>
        <PageHeader title={t(lang, "billPayments")} />
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-jade-500" />
            <p className="mt-4 font-display text-xl font-semibold text-ink-900">{t(lang, "loading")}</p>
            <p className="mt-2 text-sm text-ink-600/70">Verifying with {biller}. Please wait.</p>
          </div>
        </div>
      </div>
    );
  }

  // Receipt view
  if (receipt) {
    return (
      <div>
        <PageHeader title={t(lang, "billPayments")} />
        <div className="mx-auto max-w-lg">
          <TransactionReceipt type="debit" lines={receipt} status="completed" onClose={() => setReceipt(null)} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t(lang, "billPayments")} subtitle={t(lang, "payUtilities") || "Pay utilities, telecom, and government bills."} />
      {showPin && <PinEntry onVerified={executePay} onCancel={() => setShowPin(false)} />}
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title={t(lang, "payBill") || "Pay a bill"}>
          {error && <Alert>{error}</Alert>}
          <form onSubmit={(e: FormEvent) => { e.preventDefault(); setShowPin(true); }} className="space-y-4">
            <div><Label>{t(lang, "biller") || "Biller"}</Label>
              <Select value={biller} onChange={e => { setBiller(e.target.value); const b = billers.find(x => x.name === e.target.value); setCategory(b?.category || ""); }}>
                <option value="">{t(lang, "selectBiller") || "Select biller for your country…"}</option>
                {billers.map(b => <option key={b.name} value={b.name}>{b.name} ({b.category})</option>)}
              </Select>
            </div>
            <div><Label>{t(lang, "reference") || "Bill reference number"}</Label><Input value={reference} onChange={e => setReference(e.target.value)} placeholder="Account/reference" /></div>
            <div><Label>{t(lang, "amount")}</Label><Input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required /></div>
            <div><Label>{t(lang, "fromAccount") || "Pay from"}</Label>
              <Select value={accountId} onChange={e => setAccountId(e.target.value)}>
                {accounts.map((a: Record<string, unknown>) => <option key={String(a.id)} value={String(a.id)}>{String(a.nickname || a.accountNumber)} · {String(a.currency)} {String(a.balance)}</option>)}
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !biller || !amount}>
              {loading ? t(lang, "loading") : "🔒 " + (t(lang, "submit") || "Pay bill")}
            </Button>
          </form>
        </Panel>
        <Panel title={t(lang, "paymentHistory") || "Payment history"}>
          {history.length === 0 ? <EmptyState title={t(lang, "noBillPayments") || "No bill payments yet"} /> : (
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className="rounded-xl border border-ink-900/5 bg-rice-50 p-3 flex justify-between items-center">
                  <div><p className="text-sm font-semibold text-ink-900">{String(h.billerName)}</p><p className="text-xs text-ink-600/60">{String(h.billerCategory)} · {String(h.referenceNumber || "—")}</p></div>
                  <div className="text-right"><p className="font-semibold text-sm">{String(h.currency)} {String(h.amount)}</p><StatusBadge status={String(h.status)} /></div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
