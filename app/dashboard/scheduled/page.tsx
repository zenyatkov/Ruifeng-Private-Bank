"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Trash2 } from "lucide-react";
import { PageHeader, Panel, Button, Input, Label, Select, EmptyState, Alert } from "@/components/ui";

export default function ScheduledPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Array<Record<string, unknown>>>([]);
  const [accounts, setAccounts] = useState<Array<Record<string, unknown>>>([]);
  const [form, setForm] = useState({ accountId: "", amount: "", recipientName: "", recipientAccount: "", recipientBank: "", frequency: "monthly", nextRunDate: "", description: "", currency: "SGD" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/scheduled-payments").then(r => r.json()).then(d => setPayments(d.payments || []));
    fetch("/api/accounts").then(r => r.json()).then(d => { setAccounts(d.accounts || []); if (d.accounts?.[0]) setForm(f => ({ ...f, accountId: String(d.accounts[0].id) })); });
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault(); setLoading(true); setMsg("");
    const res = await fetch("/api/scheduled-payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false);
    if (res.ok) { setMsg("✓ Scheduled payment created"); fetch("/api/scheduled-payments").then(r => r.json()).then(d => setPayments(d.payments || [])); setForm(f => ({ ...f, amount: "", recipientName: "", recipientAccount: "", description: "" })); }
    else { const d = await res.json(); setMsg(d.error || "Failed"); }
  }

  async function cancel(id: number) {
    await fetch(`/api/scheduled-payments?id=${id}`, { method: "DELETE" });
    setPayments(prev => prev.map(p => Number(p.id) === id ? { ...p, isActive: false } : p));
  }

  return (
    <div>
      <PageHeader title="Scheduled Payments" subtitle="Set up recurring transfers." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="New scheduled payment">
          <form onSubmit={create} className="space-y-4">
            <div><Label>From account</Label>
              <Select value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })}>
                {accounts.map((a: Record<string, unknown>) => <option key={String(a.id)} value={String(a.id)}>{String(a.nickname || a.accountNumber)} · {String(a.currency)} {String(a.balance)}</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Recipient</Label><Input value={form.recipientName} onChange={e => setForm({ ...form, recipientName: e.target.value })} required /></div>
              <div><Label>Account</Label><Input value={form.recipientAccount} onChange={e => setForm({ ...form, recipientAccount: e.target.value })} /></div>
            </div>
            <div><Label>Bank</Label><Input value={form.recipientBank} onChange={e => setForm({ ...form, recipientBank: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Amount</Label><Input type="number" min="1" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div>
              <div><Label>Frequency</Label>
                <Select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
                  <option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option>
                </Select>
              </div>
            </div>
            <div><Label>Start date</Label><Input type="date" value={form.nextRunDate} onChange={e => setForm({ ...form, nextRunDate: e.target.value })} required /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            {msg && <Alert type={msg.startsWith("✓") ? "success" : "error"}>{msg}</Alert>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating..." : "Schedule payment"}</Button>
          </form>
        </Panel>
        <Panel title="Active schedules">
          {payments.filter(p => p.isActive).length === 0 ? <EmptyState title="No scheduled payments" /> : (
            <div className="space-y-3">
              {payments.filter(p => p.isActive).map(p => (
                <div key={String(p.id)} className="rounded-2xl border border-ink-900/5 bg-white p-4 hover-lift">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-ink-900">{String(p.recipientName)}</p>
                      <p className="text-xs text-ink-600/60">{String(p.recipientBank || "")} · {String(p.recipientAccount || "")}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-ink-600/50">
                        <Calendar className="h-3 w-3" />
                        <span className="capitalize">{String(p.frequency)}</span>
                        <span>· Next: {new Date(String(p.nextRunDate)).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-ink-900">{String(p.currency)} {String(p.amount)}</p>
                      <button onClick={() => cancel(Number(p.id))} className="mt-2 text-xs text-vermillion-500 hover:text-vermillion-600 flex items-center gap-1"><Trash2 className="h-3 w-3" />Cancel</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
