"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button, Input, Label, Select } from "@/components/ui";

export function CryptoAssignForm({ users }: { users: Array<{ id: number; firstName: string; lastName: string; email: string }> }) {
  const router = useRouter();
  const [userId, setUserId] = useState(users[0]?.id?.toString() || "");
  const [btc, setBtc] = useState("");
  const [eth, setEth] = useState("");
  const [usdt, setUsdt] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setMsg("");
    const res = await fetch("/api/admin/crypto", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: Number(userId), btc, eth, usdt }),
    });
    setLoading(false);
    if (res.ok) { setMsg("✓ Wallets assigned"); setBtc(""); setEth(""); setUsdt(""); router.refresh(); }
    else setMsg("Failed to assign");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div><Label>Client</Label>
        <Select value={userId} onChange={(e) => setUserId(e.target.value)}>
          {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} · {u.email}</option>)}
        </Select>
      </div>
      <div><Label>BTC Wallet</Label><Input value={btc} onChange={(e) => setBtc(e.target.value)} placeholder="bc1q..." /></div>
      <div><Label>ETH Wallet</Label><Input value={eth} onChange={(e) => setEth(e.target.value)} placeholder="0x..." /></div>
      <div><Label>USDT Wallet (TRC20)</Label><Input value={usdt} onChange={(e) => setUsdt(e.target.value)} placeholder="T..." /></div>
      {msg && <p className="text-sm text-jade-600 font-semibold">{msg}</p>}
      <Button type="submit" disabled={loading}>{loading ? "Assigning…" : "Assign Wallets"}</Button>
    </form>
  );
}
