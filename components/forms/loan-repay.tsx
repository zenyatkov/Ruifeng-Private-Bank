"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, Input, Select } from "@/components/ui";
import { PinEntry } from "@/components/pin-entry";
import { playNotificationSound } from "@/components/notifications-client";

type Acct = { id: number; nickname: string | null; accountNumber: string; currency: string; balance: string };

export function LoanRepayButton({ loan, accounts }: {
  loan: { id: number; loanNumber: string; outstanding: string; currency: string; productName: string };
  accounts: Acct[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id?.toString() || "");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function repay() {
    setShowPin(false); setLoading(true); setMsg("");
    const res = await fetch("/api/loans/repay", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loanId: loan.id, amount: parseFloat(amount), fromAccountId: Number(accountId) }),
    });
    const d = await res.json();
    setLoading(false);
    if (!res.ok) { setMsg(d.error || "Failed"); playNotificationSound("error"); return; }
    playNotificationSound("success");
    setMsg(d.status === "paid_off" ? "✓ Loan fully repaid!" : `✓ Repaid ${loan.currency} ${d.repaid}. Remaining: ${loan.currency} ${d.outstanding}`);
    setAmount(""); setOpen(false); router.refresh();
  }

  if (!open) return <Button type="button" variant="secondary" className="text-xs py-1 px-3" onClick={() => setOpen(true)}>Pay loan</Button>;

  return (
    <div className="mt-2 rounded-2xl border border-jade-500/20 bg-jade-500/5 p-3 w-full space-y-2 animate-slide-in">
      {showPin && <PinEntry onVerified={repay} onCancel={() => setShowPin(false)} />}
      <p className="text-xs font-semibold text-jade-700">Repay: {loan.productName}</p>
      <p className="text-xs text-ink-600/60">Outstanding: {loan.currency} {loan.outstanding}</p>
      <div className="flex gap-2">
        <Input type="number" min="1" max={loan.outstanding} step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="text-xs py-1.5 flex-1" />
        <button type="button" onClick={() => setAmount(loan.outstanding)} className="text-[10px] font-semibold text-jade-600 hover:text-jade-700 whitespace-nowrap">Pay full</button>
      </div>
      <Select className="text-xs py-1.5" value={accountId} onChange={e => setAccountId(e.target.value)}>
        {accounts.map(a => <option key={a.id} value={a.id}>{a.nickname || a.accountNumber} · {a.currency} {a.balance}</option>)}
      </Select>
      {msg && <Alert type={msg.startsWith("✓") ? "success" : "error"}>{msg}</Alert>}
      <div className="flex gap-2">
        <Button type="button" variant="secondary" className="text-xs py-1 flex-1" onClick={() => setOpen(false)}>Cancel</Button>
        <Button type="button" className="text-xs py-1 flex-1" disabled={loading || !amount} onClick={() => setShowPin(true)}>🔒 Repay</Button>
      </div>
    </div>
  );
}
