"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { Alert, Button, Input, Label, Select } from "@/components/ui";
import { TransactionReceipt } from "@/components/receipt";
import { PinEntry } from "@/components/pin-entry";
import { playNotificationSound } from "@/components/notifications-client";
import { useUserPrefs } from "@/components/user-context";
import { t } from "@/lib/i18n";

type Instrument = { symbol: string; name: string; assetClass: string; price: number; currency: string; region: string; change: number };
type Acct = { id: number; nickname: string | null; accountNumber: string; currency: string; balance: string };

export function InvestmentForm({ accounts }: { accounts: Acct[] }) {
  const router = useRouter();
  const { lang } = useUserPrefs();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id?.toString() || "");
  const [showPin, setShowPin] = useState(false);
  const [receiptLines, setReceiptLines] = useState<{ label: string; value: string }[] | null>(null);

  // Fetch live/simulated market data from /api/market
  useEffect(() => {
    fetch("/api/market").then(r => r.json()).then(d => {
      // Handle successResponse wrapper or plain response
      const instrs = d.data?.instruments || d.instruments || [];
      const live = d.data?.live || d.live || false;
      setInstruments(instrs);
      setIsLive(live);
    }).catch(() => {
      // Fallback: empty instruments list
      setInstruments([]);
    });
  }, []);

  const instrument = useMemo(() => instruments.find(i => i.symbol === selectedSymbol), [selectedSymbol, instruments]);
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
    if (!res.ok) { setError(data.error || data.data?.error || "Failed"); playNotificationSound("error"); return; }
    playNotificationSound("success");
    setReceiptLines([
      { label: t(lang, "receipt") || "Instrument", value: instrument.name },
      { label: "Symbol", value: instrument.symbol },
      { label: t(lang, "quantity"), value: quantity },
      { label: t(lang, "buy") || "Price", value: `${instrument.currency} ${instrument.price}` },
      { label: t(lang, "totalCost") || "Total cost", value: `${instrument.currency} ${totalCost.toFixed(2)}` },
      { label: "Region", value: instrument.region },
      { label: t(lang, "date"), value: new Date().toLocaleString() },
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

      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-jade-600 mb-3">
        📊 {t(lang, "marketBoard") || "Market Board"} · 行情
        {isLive && <span className="ml-2 text-jade-500 text-[10px]">● LIVE</span>}
        {!isLive && instruments.length > 0 && <span className="ml-2 text-bronze-500 text-[10px]">● SIM</span>}
      </p>
      <div className="grid gap-2 max-h-72 overflow-y-auto scrollbar-thin">
        {instruments.map(inst => (
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
        {instruments.length === 0 && (
          <p className="text-sm text-ink-600/50 text-center py-4">{t(lang, "loading")}</p>
        )}
      </div>

      {instrument && (
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); setShowPin(true); }} className="rounded-2xl border border-jade-500/20 bg-jade-500/5 p-4 space-y-3">
          {error && <Alert>{error}</Alert>}
          <p className="text-sm font-semibold text-ink-900">{t(lang, "buy")}: {instrument.name}</p>
          <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm">
            <span className="text-ink-600">{t(lang, "buy") || "Price"}:</span>
            <span className="font-bold text-ink-900">{instrument.currency} {instrument.price.toLocaleString()}</span>
            <span className={`ml-auto text-xs font-semibold ${instrument.change >= 0 ? "text-jade-600" : "text-vermillion-500"}`}>
              {instrument.change >= 0 ? "+" : ""}{instrument.change}%
            </span>
          </div>
          <div><Label>{t(lang, "quantity")}</Label><Input type="number" min="0.000001" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} required /></div>
          <div><Label>{t(lang, "fundFrom") || "Fund from"}</Label>
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.nickname || a.accountNumber} · {a.currency} {a.balance}</option>)}
            </Select>
          </div>
          {totalCost > 0 && (
            <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${insufficient ? "bg-vermillion-500/10 text-vermillion-600" : "bg-white text-ink-900"}`}>
              {t(lang, "totalCost") || "Total"}: {instrument.currency} {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              {insufficient && " · ⚠ " + (t(lang, "insufficientFunds") || "Insufficient")}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading || !quantity || insufficient}>
            <ArrowRight className="h-4 w-4" />{loading ? t(lang, "executing") || "Executing…" : "🔒 " + (t(lang, "authorizePurchase") || "Authorize purchase")}
          </Button>
        </form>
      )}
    </div>
  );
}
