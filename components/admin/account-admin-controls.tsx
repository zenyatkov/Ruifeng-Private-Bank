"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Alert, Button, Input, Label, Select, Textarea } from "@/components/ui";
import { ASIAN_CURRENCIES } from "@/lib/utils";

export function CreateAccountAdminForm({ users }: { users: Array<{ id: number; firstName: string; lastName: string; email: string }> }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ userId: users[0]?.id?.toString() || "", type: "private_wealth", currency: "USD", balance: "0", nickname: "" });

  async function onSubmit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    const res = await fetch("/api/admin/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, userId: Number(form.userId) }) });
    setLoading(false);
    if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); return; }
    setOpen(false); router.refresh();
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>Create account</Button>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/50 p-4">
          <div className="card-shadow w-full max-w-md rounded-3xl bg-white p-6">
            <h3 className="font-display text-xl font-semibold">Create account</h3>
            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              {error && <Alert>{error}</Alert>}
              <div><Label>Client</Label><Select value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })}>
                {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} · {u.email}</option>)}
              </Select></div>
              <div><Label>Type</Label><Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="checking">Current</option><option value="savings">Savings</option><option value="private_wealth">Private Wealth</option><option value="multi_currency">Multi-Currency</option><option value="fixed_deposit">Fixed Deposit</option>
              </Select></div>
              <div><Label>Currency</Label><Select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                {ASIAN_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
              </Select></div>
              <div><Label>Opening balance</Label><Input type="number" step="0.01" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} /></div>
              <div><Label>Nickname</Label><Input value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} /></div>
              <div className="flex gap-3"><Button type="button" variant="secondary" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" className="flex-1" disabled={loading}>{loading ? "..." : "Create"}</Button></div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function AccountAdminActions({ account }: { account: { id: number; status: string } }) {
  const router = useRouter();
  const [showAdjust, setShowAdjust] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [category, setCategory] = useState("Adjustment");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    const res = await fetch("/api/admin/accounts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: account.id, ...body }) });
    const d = await res.json();
    setBusy(false);
    if (res.ok) { setMsg("✓"); setAmount(""); setDescription(""); router.refresh(); }
    else setMsg(d.error || "Failed");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        <Select className="py-1 text-xs w-24" disabled={busy} value={account.status} onChange={e => patch({ status: e.target.value })}>
          <option value="active">Active</option><option value="frozen">Frozen</option><option value="pending">Pending</option><option value="closed">Closed</option>
        </Select>
        <Button type="button" variant="secondary" className="px-2 py-1 text-[10px]" onClick={() => setShowAdjust(v => !v)}>
          {showAdjust ? "Close" : "Credit/Debit"}
        </Button>
      </div>
      {showAdjust && (
        <div className="rounded-xl border border-ink-900/8 bg-rice-50 p-3 space-y-2 animate-slide-in">
          <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount (+credit / -debit)" className="text-xs py-1.5" />
          <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Transaction description" className="text-xs py-1.5" />
          <Input value={counterparty} onChange={e => setCounterparty(e.target.value)} placeholder="Counterparty name" className="text-xs py-1.5" />
          <Select className="text-xs py-1.5" value={category} onChange={e => setCategory(e.target.value)}>
            <option>Adjustment</option><option>Deposit</option><option>Withdrawal</option><option>Fee</option><option>Interest</option><option>Refund</option><option>Wire Transfer</option>
          </Select>
          {msg && <p className={`text-xs font-semibold ${msg.startsWith("✓") ? "text-jade-600" : "text-vermillion-500"}`}>{msg}</p>}
          <Button type="button" className="w-full text-xs py-1" disabled={busy || !amount} onClick={() => patch({ adjustAmount: amount, description, counterpartyName: counterparty, category })}>
            {busy ? "..." : "Post transaction"}
          </Button>
        </div>
      )}
    </div>
  );
}
