"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Alert, Button, Input, Label, Select, Textarea } from "@/components/ui";
import { ASIAN_CURRENCIES } from "@/lib/utils";

type AccountOption = { id: number; nickname: string | null; accountNumber: string; currency: string; balance: string };

export function LoanForm({ accounts }: { accounts: AccountOption[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    productName: "Secured Wealth Credit Line",
    principal: "",
    termMonths: "36",
    currency: "USD",
    purpose: "",
    accountId: accounts[0]?.id?.toString() || "",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const res = await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        accountId: form.accountId ? Number(form.accountId) : null,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Application failed");
      return;
    }
    setSuccess("Loan application submitted. You will be notified once processed.");
    setForm({ ...form, principal: "", purpose: "" });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <Alert>{error}</Alert> : null}
      {success ? <Alert type="success">{success}</Alert> : null}
      <div>
        <Label>Product · 产品</Label>
        <Select value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })}>
          <option>Secured Wealth Credit Line</option>
          <option>Asia Property Financing</option>
          <option>Margin Lending Facility</option>
          <option>Aircraft & Yacht Financing</option>
          <option>Working Capital Private Note</option>
        </Select>
      </div>
      <div>
        <Label>Disbursement account · 放款账户</Label>
        <Select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} required>
          <option value="">Select account...</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.nickname || a.accountNumber} · {a.currency} {a.balance}</option>
          ))}
        </Select>
        <p className="mt-1 text-xs text-ink-600/60">Loan proceeds will be credited to this account.</p>
      </div>
      <div>
        <Label>Principal amount · 本金</Label>
        <Input type="number" min="1000" step="0.01" value={form.principal} onChange={(e) => setForm({ ...form, principal: e.target.value })} required placeholder="100,000" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Term (months) · 期限</Label>
          <Input type="number" min="6" value={form.termMonths} onChange={(e) => setForm({ ...form, termMonths: e.target.value })} required />
        </div>
        <div>
          <Label>Currency · 货币</Label>
          <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
            {ASIAN_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
          </Select>
        </div>
      </div>
      <div>
        <Label>Purpose · 用途</Label>
        <Textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Describe intended use of funds" />
      </div>
      <Button type="submit" className="w-full" disabled={loading || !form.accountId}>
        {loading ? "Submitting… 提交中" : "Submit application · 提交申请"}
      </Button>
      <p className="text-xs text-ink-600/60">You will be notified once your application is processed.</p>
    </form>
  );
}
