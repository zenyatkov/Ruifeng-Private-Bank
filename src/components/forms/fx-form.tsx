"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { Alert, Button, Input, Label, Select } from "@/components/ui";
import { TransactionReceipt } from "@/components/receipt";
import { PinEntry } from "@/components/pin-entry";
import { playNotificationSound } from "@/components/notifications-client";

type Acct = { id: number; nickname: string | null; accountNumber: string; currency: string; balance: string };
type Rate = { baseCurrency: string; quoteCurrency: string; rate: string };

export function FxForm({ accounts, rates }: { accounts: Acct[]; rates: Rate[] }) {
  const router = useRouter();
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id?.toString() || "");
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id?.toString() || "");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [receiptLines, setReceiptLines] = useState<{ label: string; value: string }[] | null>(null);

  const from = accounts.find(a => a.id === Number(fromAccountId));
  const to = accounts.find(a => a.id === Number(toAccountId));

  const indicativeRate = useMemo(() => {
    if (!from || !to || from.currency === to.currency) return null;
    const direct = rates.find(r => r.baseCurrency === from.currency && r.quoteCurrency === to.currency);
    if (direct) return parseFloat(direct.rate);
    const inverse = rates.find(r => r.baseCurrency === to.currency && r.quoteCurrency === from.currency);
    if (inverse) return 1 / parseFloat(inverse.rate);
    return null;
  }, [from, to, rates]);

  const sellAmount = parseFloat(amount || "0");
  const buyAmount = indicativeRate ? sellAmount * indicativeRate : 0;

  async function executeFx() {
    setShowPin(false);
    setLoading(true); setError("");
    const res = await fetch("/api/fx", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromAccountId: Number(fromAccountId), toAccountId: Number(toAccountId), amount }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "FX failed"); playNotificationSound("error"); return; }
    playNotificationSound("success");
    const r = data.receipt;
    setReceiptLines([
      { label: "Reference", value: r.reference },
      { label: "Sold", value: `${r.sold.currency} ${r.sold.amount}` },
      { label: "Fee", value: `${r.sold.currency} ${r.sold.fee}` },
      { label: "Bought", value: `${r.bought.currency} ${r.bought.amount}` },
      { label: "Rate", value: r.rate },
      { label: "Date", value: new Date(r.timestamp).toLocaleString() },
    ]);
    setAmount("");
    router.refresh();
  }

  if (accounts.length < 2) return <Alert type="info">Open at least two currency accounts for FX.</Alert>;

  if (receiptLines) {
    return <TransactionReceipt type="debit" lines={receiptLines} status="completed" onClose={() => setReceiptLines(null)} />;
  }

  return (
    <>
      {showPin && <PinEntry onVerified={executeFx} onCancel={() => setShowPin(false)} />}
      <form onSubmit={(e: FormEvent) => { e.preventDefault(); setShowPin(true); }} className="space-y-4">
        {error && <Alert>{error}</Alert>}

        <div className="rounded-2xl border border-vermillion-500/15 bg-vermillion-500/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-vermillion-500 mb-2">Sell · 卖出</p>
          <Select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.currency} — {a.nickname || a.accountNumber} ({a.balance})</option>)}
          </Select>
          <Input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="Amount to sell" className="mt-2" />
        </div>

        <div className="flex justify-center"><div className="rounded-full bg-ink-900 p-2 text-jade-300"><ArrowDownUp className="h-5 w-5" /></div></div>

        <div className="rounded-2xl border border-jade-500/15 bg-jade-500/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-jade-600 mb-2">Buy · 买入</p>
          <Select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.currency} — {a.nickname || a.accountNumber} ({a.balance})</option>)}
          </Select>
          {indicativeRate && buyAmount > 0 && (
            <div className="mt-2 rounded-xl bg-white px-4 py-3 text-center">
              <p className="text-sm text-ink-600">You receive</p>
              <p className="font-display text-2xl font-bold text-jade-600">{to?.currency} {buyAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          )}
        </div>

        {indicativeRate && (
          <div className="rounded-xl bg-rice-100 px-4 py-3 text-center text-sm">
            <span className="text-ink-600">Rate: </span>
            <span className="font-bold text-ink-900">1 {from?.currency} = {indicativeRate.toFixed(6)} {to?.currency}</span>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading || !amount || (from?.currency === to?.currency)}>
          {loading ? "Converting…" : "🔒 Authorize conversion"}
        </Button>
      </form>
    </>
  );
}
