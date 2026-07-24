"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle, Power, Shield, Zap, CreditCard, ArrowLeftRight, HandCoins, BadgeJapaneseYen, Wallet } from "lucide-react";
import { Button, PageHeader, Panel, Alert } from "@/components/ui";
import { t } from "@/lib/i18n";
import { useUserPrefs } from "@/components/user-context";


const SERVICES = [
  { key: "transfers_enabled", label: "Transfer Services", desc: "Internal & external transfers", icon: ArrowLeftRight, color: "jade" },
  { key: "withdrawals_enabled", label: "Withdrawals", desc: "Cash and account withdrawals", icon: Wallet, color: "jade" },
  { key: "cards_enabled", label: "Card Services", desc: "Card applications & funding", icon: CreditCard, color: "jade" },
  { key: "fx_enabled", label: "FX Desk", desc: "Currency conversion services", icon: BadgeJapaneseYen, color: "jade" },
  { key: "loans_enabled", label: "Lending Services", desc: "Loan applications", icon: HandCoins, color: "jade" },
  { key: "bills_enabled", label: "Bill Payments", desc: "Utility & bill payment services", icon: Zap, color: "jade" },
];

export default function SystemPage() {
  const { lang } = useUserPrefs();
  const router = useRouter();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => { fetch("/api/admin/settings").then(r => r.json()).then(d => setSettings(d.settings || {})); }, []);

  async function toggle(key: string) {
    const current = settings[key] !== "false";
    const newValue = current ? "false" : "true";
    setLoading(key);
    await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value: newValue }) });
    setSettings(prev => ({ ...prev, [key]: newValue }));
    setLoading(null);
    setMsg(`${key.replace(/_/g, " ")} ${newValue === "true" ? "enabled" : "disabled"}`);
    setTimeout(() => setMsg(""), 3000);
  }

  return (
    <div>
      <PageHeader title={t(lang, "adminSystemControls") || "System Controls"} subtitle={t(lang, "adminSystemSub") || "Manage platform services and system status."} />

      {msg && <div className="mb-6"><Alert type="success">{msg}</Alert></div>}

      {/* Service toggles */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mb-6">
        {SERVICES.map(svc => {
          const enabled = settings[svc.key] !== "false";
          const Icon = svc.icon;
          return (
            <div key={svc.key} className={`rounded-2xl border p-5 transition hover-lift ${enabled ? "border-jade-500/20 bg-white" : "border-vermillion-500/20 bg-vermillion-500/5"}`}>
              <div className="flex items-start gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${enabled ? "bg-jade-500/10 text-jade-600" : "bg-vermillion-500/10 text-vermillion-500"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink-900">{svc.label}</p>
                  <p className="text-xs text-ink-600/60 mt-0.5">{svc.desc}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${enabled ? "text-jade-600" : "text-vermillion-500"}`}>
                  {enabled ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                  {enabled ? "Online" : "Offline"}
                </div>
                <button
                  disabled={loading === svc.key}
                  onClick={() => toggle(svc.key)}
                  className={`relative h-7 w-12 rounded-full transition ${enabled ? "bg-jade-500" : "bg-ink-900/20"}`}
                >
                  <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Client-facing message */}
        <Panel title="Service Down Message (shown to clients)">
          <div className="rounded-2xl border border-vermillion-500/20 bg-vermillion-500/5 p-5">
            <div className="flex items-center gap-3 text-vermillion-600">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-semibold text-sm">Service Temporarily Unavailable</p>
            </div>
            <p className="mt-2 text-sm text-ink-700">
              This service is temporarily unavailable for scheduled maintenance. We apologize for the inconvenience.
            </p>
            <div className="mt-3 rounded-xl bg-white p-3 border border-ink-900/5">
              <p className="text-xs font-semibold text-jade-600 uppercase tracking-wider">Alternative: Crypto Funding</p>
              <p className="mt-1 text-xs text-ink-600/70">Clients are directed to fund via BTC, ETH, or USDT.</p>
            </div>
          </div>
        </Panel>

        {/* Quick actions */}
        <Panel title="Quick Actions">
          <div className="space-y-2">
            {[
              { href: "/admin/broadcast", emoji: "📢", title: "Send Broadcast", desc: "Notify all users" },
              { href: "/admin/kyc", emoji: "🛡️", title: "KYC Queue", desc: "Review verifications" },
              { href: "/admin/transactions", emoji: "📋", title: "Transactions", desc: "Approve transfers" },
              { href: "/admin/cards", emoji: "💳", title: "Card Approvals", desc: "Review card applications" },
              { href: "/admin/analytics", emoji: "📊", title: "Analytics", desc: "Platform metrics" },
              { href: "/admin/logs", emoji: "📜", title: "Audit Trail", desc: "Admin action log" },
            ].map(a => (
              <a key={a.href} href={a.href} className="flex items-center gap-3 rounded-xl border border-ink-900/5 bg-white p-3 hover-lift transition">
                <span className="text-lg">{a.emoji}</span>
                <div><p className="text-sm font-semibold text-ink-900">{a.title}</p><p className="text-xs text-ink-600/60">{a.desc}</p></div>
              </a>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
