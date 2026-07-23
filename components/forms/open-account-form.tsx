"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button, Input, Label, Select } from "@/components/ui";
import { ASIAN_CURRENCIES } from "@/lib/utils";

export function OpenAccountForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("checking");
  const [currency, setCurrency] = useState("USD");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, currency, nickname }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed to open account");
      return;
    }
    setOpen(false);
    if (data.account?.status === "pending") {
      alert("Your account application has been submitted and is being processed.");
    }
    router.refresh();
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Open account
      </Button>
      {open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/50 p-4">
          <div className="card-shadow w-full max-w-md rounded-3xl bg-white p-6">
            <h3 className="font-display text-xl font-semibold text-ink-900">Open new account</h3>
            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <div>
                <Label>Account type</Label>
                <Select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="checking">Current Account</option>
                  <option value="savings">Savings Account</option>
                  <option value="private_wealth">Private Wealth</option>
                  <option value="multi_currency">Multi-Currency</option>
                  <option value="fixed_deposit">Fixed Deposit</option>
                </Select>
              </div>
              <div>
                <Label>Currency</Label>
                <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {ASIAN_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Nickname</Label>
                <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="e.g. Tokyo Operating" />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Opening…" : "Confirm"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
