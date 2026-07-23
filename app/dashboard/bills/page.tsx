"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import { PageHeader, Panel, Alert, Button, Input, Label, Select, StatusBadge, EmptyState } from "@/components/ui";
import { PinEntry } from "@/components/pin-entry";
import { playNotificationSound } from "@/components/notifications-client";
import { TransactionReceipt } from "@/components/receipt";

type Biller = { name: string; category: string };

export default function BillsPage() {
  const router = useRouter();
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
    fetch("/api/bills").then(r => r.json()).then(d => { setBillers(d.billers || []); setHistory(d.history || []); });
    fetch("/api/accounts").then(r => r.json()).then(d => { setAccounts(d.accounts || []); if (d.accounts?.[0]) setAccountId(String(d.accounts[0].id)); });
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
    if (!res.ok) { setError(data.error || "Failed"); playNotificationSound("error"); return; }

    // Show processing animation then pending confirmation
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      playNotificationSound("info");
      setReceipt([
        { label: "Status", value: "Pending" },
        { label: "Biller", value: biller },
        { label: "Category", value: b?.category || "Utilities" },
        { label: "Reference", value: data.reference },
        { label: "Bill Reference", value: reference || "—" },
        { label: "Amount", value: `${data.bill.currency} ${data.bill.amount}` },
        { label: "New Balance", value: `${data.bill.currency} ${data.newBalance}` },
        { label: "Date", value: new Date().toLocaleString() },
        { label: "Note", value: "Your payment is being processed." },
      ]);
      setAmount(""); setReference("");
      fetch("/api/bills").then(r => r.json()).then(d => setHistory(d.history || []));
      router.refresh();
    }, 3000);
  }

  // Processing overlay
  if (processing) {
    return (
      <div>
        <PageHeader title="Bill Payments" />
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-jade-500" />
            <p className="mt-4 font-display text-xl font-semibold text-ink-900">Processing payment...</p>
            <p className="mt-2 text-sm text-ink-600/70">Verifying with {biller}. Please wait.</p>
            <div className="mt-4 flex gap-1 justify-center">
              <span className="h-2 w-8 rounded-full bg-jade-500" />
              <span className="h-2 w-6 rounded-full bg-jade-400 progress-animate" />
              <span className="h-2 w-6 rounded-full bg-ink-900/10" />
            </div>
            <p className="mt-2 text-xs text-ink-600/40">Processing → Verifying → Complete</p>
          </div>
        </div>
      </div>
    );
  }

  // Receipt view
  if (receipt) {
    return (
      <div>
        <PageHeader title="Bill Payments" />
        <div className="mx-auto max-w-lg">
          <TransactionReceipt type="debit" lines={receipt} status="completed" onClose={() => setReceipt(null)} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Bill Payments" subtitle="Pay utilities, telecom, and government bills." />
      {showPin && <PinEntry onVerified={executePay} onCancel={() => setShowPin(false)} />}
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Pay a bill">
          {error && <Alert>{error}</Alert>}
          <form onSubmit={(e: FormEvent) => { e.preventDefault(); setShowPin(true); }} className="space-y-4">
            <div><Label>Biller</Label>
              <Select value={biller} onChange={e => { setBiller(e.target.value); const b = billers.find(x => x.name === e.target.value); setCategory(b?.category || ""); }}>
                <option value="">Select biller…</option>
                {billers.map(b => <option key={b.name} value={b.name}>{b.name} ({b.category})</option>)}
              </Select>
            </div>
            <div><Label>Bill reference number</Label><Input value={reference} onChange={e => setReference(e.target.value)} placeholder="Account/reference" /></div>
            <div><Label>Amount</Label><Input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required /></div>
            <div><Label>Pay from</Label>
              <Select value={accountId} onChange={e => setAccountId(e.target.value)}>
                {accounts.map((a: Record<string, unknown>) => <option key={String(a.id)} value={String(a.id)}>{String(a.nickname || a.accountNumber)} · {String(a.currency)} {String(a.balance)}</option>)}
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !biller || !amount}>
              {loading ? "Processing…" : "🔒 Pay bill"}
            </Button>
          </form>
        </Panel>
        <Panel title="Payment history">
          {history.length === 0 ? <EmptyState title="No bill payments yet" /> : (
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
