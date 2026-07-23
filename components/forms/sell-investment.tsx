"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, Input, Label, Select } from "@/components/ui";
import { PinEntry } from "@/components/pin-entry";
import { playNotificationSound } from "@/components/notifications-client";
import { TransactionReceipt } from "@/components/receipt";

type Acct = { id: number; nickname: string | null; accountNumber: string; currency: string; balance: string };

export function SellInvestmentButton({ investment, accounts }: {
  investment: { id: number; name: string; symbol: string | null; quantity: string; avgCost: string; currentPrice: string; currency: string };
  accounts: Acct[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id?.toString() || "");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<{ label: string; value: string }[] | null>(null);

  const sellQty = parseFloat(quantity || "0");
  const price = parseFloat(investment.currentPrice);
  const cost = parseFloat(investment.avgCost);
  const proceeds = sellQty * price;
  const profit = (price - cost) * sellQty;

  async function executeSell() {
    setShowPin(false); setLoading(true); setError("");
    const res = await fetch("/api/investments/sell", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ investmentId: investment.id, quantity: sellQty, accountId: Number(accountId) }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Failed"); playNotificationSound("error"); return; }
    playNotificationSound("success");
    setReceipt([
      { label: "Sold", value: `${sellQty} × ${investment.name}` },
      { label: "Sale price", value: `${investment.currency} ${price.toFixed(4)}` },
      { label: "Proceeds", value: `${investment.currency} ${data.proceeds}` },
      { label: "P&L", value: `${investment.currency} ${data.profit}` },
      { label: "Remaining units", value: data.remaining },
      { label: "New balance", value: `${investment.currency} ${data.newBalance}` },
    ]);
    setQuantity(""); router.refresh();
  }

  if (receipt) return <TransactionReceipt type="credit" lines={receipt} status="completed" onClose={() => { setReceipt(null); setOpen(false); }} />;

  if (!open) return (
    <Button type="button" variant="secondary" className="px-3 py-1 text-xs" onClick={() => setOpen(true)}>Sell</Button>
  );

  return (
    <div className="rounded-xl border border-vermillion-500/20 bg-vermillion-500/5 p-3 mt-2 space-y-2">
      {showPin && <PinEntry onVerified={executeSell} onCancel={() => setShowPin(false)} />}
      {error && <Alert>{error}</Alert>}
      <p className="text-xs font-semibold text-vermillion-600">Sell {investment.name}</p>
      <div className="flex gap-2">
        <Input type="number" min="0.000001" max={investment.quantity} step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder={`Max: ${investment.quantity}`} className="text-xs py-1.5" />
        <Select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="text-xs py-1.5">
          {accounts.map(a => <option key={a.id} value={a.id}>{a.nickname || a.accountNumber} ({a.currency})</option>)}
        </Select>
      </div>
      {sellQty > 0 && (
        <div className="text-xs text-ink-700">
          Proceeds: <strong>{investment.currency} {proceeds.toFixed(2)}</strong>
          <span className={profit >= 0 ? " text-jade-600" : " text-vermillion-500"}> (P&L: {profit >= 0 ? "+" : ""}{profit.toFixed(2)})</span>
        </div>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="secondary" className="text-xs py-1" onClick={() => setOpen(false)}>Cancel</Button>
        <Button type="button" variant="danger" className="text-xs py-1" disabled={loading || sellQty <= 0} onClick={() => setShowPin(true)}>
          {loading ? "Selling…" : "🔒 Sell"}
        </Button>
      </div>
    </div>
  );
}
