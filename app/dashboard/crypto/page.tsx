"use client";

import { useEffect, useState } from "react";
import { Bitcoin, Copy, CheckCircle, ExternalLink, Shield, Zap } from "lucide-react";
import { PageHeader, Panel, Alert } from "@/components/ui";

const CRYPTOS = [
  { key: "BTC", name: "Bitcoin", symbol: "₿", color: "from-orange-500 to-amber-600", bg: "bg-orange-500/10", text: "text-orange-600", icon: "₿", network: "Bitcoin Mainnet", confirmations: "3 confirmations (~30 min)", minDeposit: "0.0001 BTC" },
  { key: "ETH", name: "Ethereum", symbol: "Ξ", color: "from-indigo-500 to-purple-600", bg: "bg-indigo-500/10", text: "text-indigo-600", icon: "Ξ", network: "Ethereum Mainnet (ERC-20)", confirmations: "12 confirmations (~3 min)", minDeposit: "0.01 ETH" },
  { key: "USDT", name: "Tether USDT", symbol: "$", color: "from-emerald-500 to-teal-600", bg: "bg-emerald-500/10", text: "text-emerald-600", icon: "₮", network: "Tron (TRC-20)", confirmations: "20 confirmations (~1 min)", minDeposit: "10 USDT" },
];

export default function CryptoPage() {
  const [wallets, setWallets] = useState<Record<string, string | null>>({});
  const [copied, setCopied] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState("BTC");

  useEffect(() => { fetch("/api/crypto").then(r => r.json()).then(d => setWallets(d.wallets || {})); }, []);

  function copy(addr: string, key: string) {
    navigator.clipboard.writeText(addr);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  }

  const selected = CRYPTOS.find(c => c.key === selectedCrypto)!;
  const addr = wallets[selectedCrypto];

  return (
    <div>
      <PageHeader title="Crypto Funding" subtitle="Fund your account with cryptocurrency." />

      {/* Crypto selector */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {CRYPTOS.map(c => (
          <button key={c.key} type="button" onClick={() => setSelectedCrypto(c.key)}
            className={`rounded-2xl p-4 text-left transition hover-lift ${selectedCrypto === c.key ? "ring-2 ring-jade-500 shadow-lg" : "ring-1 ring-ink-900/5"} bg-white`}>
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} text-white text-xl font-bold`}>{c.icon}</div>
            <p className="mt-3 font-semibold text-ink-900">{c.name}</p>
            <p className="text-xs text-ink-600/60">{c.key}</p>
          </button>
        ))}
      </div>

      {/* Selected crypto detail */}
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Panel>
          <div className="text-center py-4">
            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${selected.color} text-white text-3xl font-bold shadow-lg animate-bounce-slow`}>
              {selected.icon}
            </div>
            <h3 className="mt-4 font-display text-2xl font-semibold text-ink-900">{selected.name} Deposit</h3>
            <p className="mt-1 text-sm text-ink-600/60">{selected.network}</p>

            {addr ? (
              <div className="mt-6 space-y-4">
                {/* QR placeholder */}
                <div className="mx-auto w-48 h-48 rounded-2xl border-2 border-dashed border-ink-900/10 bg-rice-50 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${selected.text}`}>{selected.icon}</div>
                    <p className="mt-2 text-xs text-ink-600/40">Scan to deposit</p>
                  </div>
                </div>

                {/* Address */}
                <div className="rounded-2xl border border-ink-900/8 bg-rice-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-600/50 mb-2">Deposit Address</p>
                  <p className="break-all font-mono text-sm text-ink-900 bg-white rounded-xl p-3 border border-ink-900/5">{addr}</p>
                  <button onClick={() => copy(addr, selected.key)}
                    className={`mt-3 w-full rounded-xl py-2.5 text-sm font-semibold transition ${copied === selected.key ? "bg-jade-500 text-white" : "bg-ink-900 text-rice-50 hover:bg-ink-800"}`}>
                    {copied === selected.key ? <span className="flex items-center justify-center gap-2"><CheckCircle className="h-4 w-4" /> Copied!</span> : <span className="flex items-center justify-center gap-2"><Copy className="h-4 w-4" /> Copy Address</span>}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-ink-900/15 bg-rice-50 p-8">
                <Shield className="h-10 w-10 mx-auto text-ink-600/30" />
                <p className="mt-3 text-sm font-semibold text-ink-700">Wallet not assigned</p>
                <p className="mt-1 text-xs text-ink-600/50">Contact your Relationship Manager to enable {selected.name} deposits.</p>
              </div>
            )}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Deposit Details">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-ink-600/60">Network</span><span className="font-semibold">{selected.network}</span></div>
              <div className="flex justify-between"><span className="text-ink-600/60">Confirmations</span><span className="font-semibold">{selected.confirmations}</span></div>
              <div className="flex justify-between"><span className="text-ink-600/60">Min. deposit</span><span className="font-semibold">{selected.minDeposit}</span></div>
              <div className="flex justify-between"><span className="text-ink-600/60">Fee</span><span className="font-semibold text-jade-600">Free</span></div>
            </div>
          </Panel>

          <Panel title="Important">
            <div className="space-y-3 text-xs text-ink-600/70">
              <div className="flex gap-2"><Zap className="h-4 w-4 shrink-0 text-bronze-500" /><p>Only send <strong>{selected.key}</strong> to this address. Sending other assets may result in permanent loss.</p></div>
              <div className="flex gap-2"><Shield className="h-4 w-4 shrink-0 text-jade-600" /><p>Deposits are credited after the required network confirmations.</p></div>
              <div className="flex gap-2"><ExternalLink className="h-4 w-4 shrink-0 text-sky-500" /><p>You can verify transactions on the blockchain explorer.</p></div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
