"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { Alert, Button, Input, Label, Select } from "@/components/ui";
import { TransactionReceipt } from "@/components/receipt";
import { PinEntry } from "@/components/pin-entry";
import { playNotificationSound } from "@/components/notifications-client";
import { MARKET_INSTRUMENTS } from "@/lib/asian-banks";

type Acct = { id: number; nickname: string | null; accountNumber: string; currency: string; balance: string };

export function InvestmentForm({ accounts }: { accounts: Acct[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id?.toString() || "");
  const [showPin, setShowPin] = useState(false);
  const [receiptLines, setReceiptLines] = useState<{ label: string; value: string }[] | null>(null);

  const instrument = useMemo(() => MARKET_INSTRUMENTS.find(i => i.symbol === selectedSymbol), [selectedSymbol]);
  const totalCost = instrument ? parseFloat(quantity || "0") * instrument.price : 0;
  const selectedAccount = accounts.find(a => a.id === Number(accountId));
  const insufficient = selectedAccount ? totalCost > parseFloat(selectedAccount.balance) : false;

  async function executeBuy() {
    setShowPin(false);
    if (!instrument) return;
    setLoading(true); setError("");
    const res = await fetch("/api/investments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: instrument.name, assetClass: instrument.assetClass, symbol: instrument.symbol,
        quantity: parseFloat(quantity), price: instrument.price, currency: instrument.currency,
        region: instrument.region, accountId: Number(accountId),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Failed"); playNotificationSound("error"); return; }
    playNotificationSound("success");
    setReceiptLines([
      { label: "Instrument", value: instrument.name },
      { label: "Symbol", value: instrument.symbol },
      { label: "Quantity", value: quantity },
      { label: "Price", value: `${instrument.currency} ${instrument.price}` },
      { label: "Total cost", value: `${instrument.currency} ${totalCost.toFixed(2)}` },
      { label: "Region", value: instrument.region },
      { label: "Date", value: new Date().toLocaleString() },
    ]);
    setQuantity(""); setSelectedSymbol("");
    router.refresh();
  }

  if (receiptLines) {
    return <TransactionReceipt type="debit" lines={receiptLines} status="completed" onClose={() => setReceiptLines(null)} />;
  }

  return (
    <div className="space-y-5">
      {showPin && <PinEntry onVerified={executeBuy} onCancel={() => setShowPin(false)} />}

      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-jade-600 mb-3">📊 Market Board · 行情</p>
      <div className="grid gap-2 max-h-72 overflow-y-auto scrollbar-thin">
        {MARKET_INSTRUMENTS.map(inst => (
          <button key={inst.symbol} type="button" onClick={() => setSelectedSymbol(inst.symbol)}
            className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
              selectedSymbol === inst.symbol ? "border-jade-500/40 bg-jade-500/5 ring-1 ring-jade-500/20" : "border-ink-900/8 bg-white hover:border-jade-500/20"
            }`}>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-900 truncate">{inst.name}</p>
              <p className="text-[11px] text-ink-600/60">{inst.symbol} · {inst.assetClass} · {inst.region}</p>
            </div>
            <div className="text-right ml-3 shrink-0">
              <p className="text-sm font-semibold">{inst.currency} {inst.price.toLocaleString()}</p>
              <div className={`flex items-center justify-end gap-1 text-xs font-semibold ${inst.change >= 0 ? "text-jade-600" : "text-vermillion-500"}`}>
                {inst.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {inst.change >= 0 ? "+" : ""}{inst.change}%
              </div>
            </div>
          </button>
        ))}
      </div>

      {instrument && (
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); setShowPin(true); }} className="rounded-2xl border border-jade-500/20 bg-jade-500/5 p-4 space-y-3">
          {error && <Alert>{error}</Alert>}
          <p className="text-sm font-semibold text-ink-900">Buy: {instrument.name}</p>
          <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm">
            <span className="text-ink-600">Price:</span>
            <span className="font-bold text-ink-900">{instrument.currency} {instrument.price.toLocaleString()}</span>
            <span className={`ml-auto text-xs font-semibold ${instrument.change >= 0 ? "text-jade-600" : "text-vermillion-500"}`}>
              {instrument.change >= 0 ? "+" : ""}{instrument.change}%
            </span>
          </div>
          <div><Label>Quantity</Label><Input type="number" min="0.000001" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} required /></div>
          <div><Label>Fund from</Label>
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.nickname || a.accountNumber} · {a.currency} {a.balance}</option>)}
            </Select>
          </div>
          {totalCost > 0 && (
            <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${insufficient ? "bg-vermillion-500/10 text-vermillion-600" : "bg-white text-ink-900"}`}>
              Total: {instrument.currency} {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              {insufficient && " · ⚠ Insufficient"}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading || !quantity || insufficient}>
            <ArrowRight className="h-4 w-4" />{loading ? "Executing…" : "🔒 Authorize purchase"}
          </Button>
        </form>
      )}
    </div>
  );
}
