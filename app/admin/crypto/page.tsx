"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Bitcoin, CheckCircle } from "lucide-react";
import { PageHeader, Panel, Button, Input, Label, Select, Alert } from "@/components/ui";

type User = { id: number; firstName: string; lastName: string; email: string; cryptoWalletBtc: string | null; cryptoWalletEth: string | null; cryptoWalletUsdt: string | null };

export default function AdminCryptoPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState("");
  const [btc, setBtc] = useState("");
  const [eth, setEth] = useState("");
  const [usdt, setUsdt] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/users").then(r => r.json()).then(d => {
      const clients = (d.users || []).filter((u: Record<string, unknown>) => u.role === "client");
      setUsers(clients);
      if (clients[0]) setUserId(String(clients[0].id));
    });
  }, []);

  // When user changes, pre-fill their existing wallets
  function selectUser(id: string) {
    setUserId(id);
    const u = users.find(x => x.id === Number(id));
    if (u) {
      setBtc(u.cryptoWalletBtc || "");
      setEth(u.cryptoWalletEth || "");
      setUsdt(u.cryptoWalletUsdt || "");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setMsg(""); setError("");
    try {
      const res = await fetch("/api/admin/crypto", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(userId), btc, eth, usdt }),
      });
      const d = await res.json();
      setLoading(false);
      if (!res.ok) { setError(d.error || "Failed"); return; }
      setMsg(`✓ Wallets assigned successfully (${d.assigned} wallets)`);
      // Refresh user list
      fetch("/api/admin/users").then(r => r.json()).then(d => {
        setUsers((d.users || []).filter((u: Record<string, unknown>) => u.role === "client"));
      });
    } catch (err) {
      setLoading(false); setError("Network error");
    }
  }

  const assignedUsers = users.filter(u => u.cryptoWalletBtc || u.cryptoWalletEth || u.cryptoWalletUsdt);

  return (
    <div>
      <PageHeader title="Crypto Wallet Assignment" subtitle="Assign BTC, ETH, USDT deposit addresses to clients." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Assign Wallets">
          <form onSubmit={onSubmit} className="space-y-4">
            {error && <Alert>{error}</Alert>}
            {msg && <Alert type="success">{msg}</Alert>}
            <div>
              <Label>Select client</Label>
              <Select value={userId} onChange={e => selectUser(e.target.value)}>
                {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} · {u.email}</option>)}
              </Select>
            </div>
            <div>
              <Label>BTC Wallet Address</Label>
              <Input value={btc} onChange={e => setBtc(e.target.value)} placeholder="bc1q... or 1A1zP1..." />
              <p className="mt-1 text-xs text-ink-600/40">Bitcoin Mainnet address</p>
            </div>
            <div>
              <Label>ETH Wallet Address</Label>
              <Input value={eth} onChange={e => setEth(e.target.value)} placeholder="0x..." />
              <p className="mt-1 text-xs text-ink-600/40">Ethereum ERC-20 address</p>
            </div>
            <div>
              <Label>USDT Wallet Address (TRC-20)</Label>
              <Input value={usdt} onChange={e => setUsdt(e.target.value)} placeholder="T..." />
              <p className="mt-1 text-xs text-ink-600/40">Tron TRC-20 address for USDT</p>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !userId}>
              {loading ? "Assigning..." : "Assign wallets to client"}
            </Button>
          </form>
        </Panel>

        <Panel title={`Current Assignments (${assignedUsers.length})`}>
          {assignedUsers.length === 0 ? (
            <div className="text-center py-8 text-ink-600/50">
              <Bitcoin className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No wallets assigned yet.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin">
              {assignedUsers.map(u => (
                <div key={u.id} className="rounded-2xl border border-ink-900/5 bg-rice-50 p-4 hover-lift">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-4 w-4 text-jade-500" />
                    <p className="font-semibold text-ink-900">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-ink-600/60">{u.email}</p>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {u.cryptoWalletBtc && (
                      <div className="flex items-center gap-2"><span className="font-semibold text-orange-600 w-10">BTC</span><span className="font-mono text-ink-700 break-all">{u.cryptoWalletBtc}</span></div>
                    )}
                    {u.cryptoWalletEth && (
                      <div className="flex items-center gap-2"><span className="font-semibold text-indigo-600 w-10">ETH</span><span className="font-mono text-ink-700 break-all">{u.cryptoWalletEth}</span></div>
                    )}
                    {u.cryptoWalletUsdt && (
                      <div className="flex items-center gap-2"><span className="font-semibold text-emerald-600 w-10">USDT</span><span className="font-mono text-ink-700 break-all">{u.cryptoWalletUsdt}</span></div>
                    )}
                  </div>
                  <button type="button" onClick={() => selectUser(String(u.id))} className="mt-2 text-[11px] font-semibold text-jade-600 hover:text-jade-700">
                    Edit wallets →
                  </button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
