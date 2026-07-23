"use client";

import { useEffect, useState, FormEvent } from "react";
import { Shield, Smartphone, Key, Bell, Globe, Lock, Eye, EyeOff, Sun, Moon, Monitor } from "lucide-react";
import { Alert, Button, Input, Label, PageHeader, Panel, Select } from "@/components/ui";
import { LANGUAGE_LABELS, CURRENCY_LABELS } from "@/lib/i18n";
import { ThemeToggle, useUserPrefs } from "@/components/user-context";

export default function SecurityPage() {
  const [tfaStatus, setTfaStatus] = useState<{ enabled: boolean } | null>(null);
  const [setupData, setSetupData] = useState<{ manualKey: string } | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  // Password change
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  // PIN
  const [newPin, setNewPin] = useState("");
  const [pinMsg, setPinMsg] = useState("");
  // Preferences
  const [lang, setLang] = useState("en");
  const [ccy, setCcy] = useState("SGD");
  const [prefMsg, setPrefMsg] = useState("");

  useEffect(() => {
    fetch("/api/auth/2fa").then(r => r.json()).then(setTfaStatus);
    fetch("/api/auth/me").then(r => r.json()).then(d => { if (d.user) { setLang(d.user.preferredLanguage); setCcy(d.user.preferredCurrency); } });
  }, []);

  async function setup2fa() { setLoading(true); const r = await fetch("/api/auth/2fa", { method: "POST" }); setSetupData(await r.json()); setLoading(false); }
  async function verify2fa(e: FormEvent) {
    e.preventDefault(); setLoading(true); setMsg("");
    const r = await fetch("/api/auth/2fa", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    const d = await r.json(); setLoading(false);
    if (d.ok || d.data?.ok) { setMsg("✓ 2FA enabled"); setSetupData(null); setTfaStatus({ enabled: true }); } else setMsg(d.error || "Invalid");
  }
  async function changePw(e: FormEvent) {
    e.preventDefault(); setPwMsg("");
    const r = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }) });
    const d = await r.json();
    if (r.ok) { setPwMsg("✓ Password updated"); setCurrentPw(""); setNewPw(""); } else setPwMsg(d.error || d.data?.error || "Failed");
  }
  async function changePin(e: FormEvent) {
    e.preventDefault(); setPinMsg("");
    const r = await fetch("/api/pin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: newPin }) });
    const d = await r.json();
    if (r.ok) { setPinMsg("✓ PIN updated"); setNewPin(""); } else setPinMsg(d.error || "Failed");
  }
  async function savePrefs() {
    setPrefMsg("");
    await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ preferredLanguage: lang, preferredCurrency: ccy }) });
    setPrefMsg("✓ Saved"); window.location.reload();
  }

  const themes = [
    { id: "light", icon: <Sun className="h-5 w-5" />, label: "Light", desc: "Clean white backgrounds" },
    { id: "dark", icon: <Moon className="h-5 w-5" />, label: "Dark", desc: "Reduced glare, easy on eyes" },
    { id: "system", icon: <Monitor className="h-5 w-5" />, label: "System", desc: "Follows your OS setting" },
  ];

  return (
    <div>
      <PageHeader title="Settings & Security" subtitle="Manage your security, preferences, and theme." />
      <div className="grid gap-6 xl:grid-cols-2">
        {/* 2FA */}
        <Panel title="Two-Factor Authentication">
          {tfaStatus?.enabled ? (
            <div className="text-center py-4"><Shield className="h-12 w-12 mx-auto text-jade-600 animate-bounce-slow" /><p className="mt-3 font-semibold text-jade-700">2FA Enabled</p></div>
          ) : setupData ? (
            <div className="space-y-3">
              <p className="text-sm text-ink-700">Enter this key in your authenticator app:</p>
              <p className="font-mono text-sm font-bold bg-rice-100 rounded-xl p-3 break-all">{setupData.manualKey}</p>
              <form onSubmit={verify2fa} className="space-y-3">
                <Input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} maxLength={6} placeholder="6-digit code" className="text-center text-xl tracking-[0.4em]" />
                {msg && <Alert type={msg.startsWith("✓") ? "success" : "error"}>{msg}</Alert>}
                <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>{loading ? "..." : "Verify & Enable"}</Button>
              </form>
            </div>
          ) : (
            <div className="text-center py-4">
              <Key className="h-12 w-12 mx-auto text-bronze-500" />
              <p className="mt-3 font-semibold text-ink-900">Not enabled</p>
              <Button onClick={setup2fa} className="mt-3" disabled={loading}>Set up 2FA</Button>
            </div>
          )}
        </Panel>

        {/* Password */}
        <Panel title="Change Password">
          <form onSubmit={changePw} className="space-y-3">
            <div><Label>Current password</Label><Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required /></div>
            <div><Label>New password (8+ chars)</Label><Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={8} /></div>
            {pwMsg && <Alert type={pwMsg.startsWith("✓") ? "success" : "error"}>{pwMsg}</Alert>}
            <Button type="submit" className="w-full">Update password</Button>
          </form>
        </Panel>

        {/* PIN */}
        <Panel title="Transaction PIN">
          <form onSubmit={changePin} className="space-y-3">
            <p className="text-sm text-ink-600/70">Set or change your 4-6 digit transaction PIN.</p>
            <Input type="password" inputMode="numeric" maxLength={6} minLength={4} value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ""))} placeholder="New PIN" className="text-center text-xl tracking-[0.4em]" />
            {pinMsg && <Alert type={pinMsg.startsWith("✓") ? "success" : "error"}>{pinMsg}</Alert>}
            <Button type="submit" className="w-full" disabled={newPin.length < 4}>Set PIN</Button>
          </form>
        </Panel>

        {/* Language & Currency */}
        <Panel title="Language & Currency">
          <div className="space-y-3">
            <div><Label>Display language</Label>
              <Select value={lang} onChange={e => setLang(e.target.value)}>
                {Object.entries(LANGUAGE_LABELS).map(([c, l]) => <option key={c} value={c}>{l}</option>)}
              </Select>
            </div>
            <div><Label>Display currency</Label>
              <Select value={ccy} onChange={e => setCcy(e.target.value)}>
                {Object.entries(CURRENCY_LABELS).map(([c, l]) => <option key={c} value={c}>{c} - {l}</option>)}
              </Select>
            </div>
            {prefMsg && <Alert type="success">{prefMsg}</Alert>}
            <Button onClick={savePrefs} className="w-full">Save & apply</Button>
          </div>
        </Panel>

        {/* Theme Selection */}
        <Panel title="Theme & Appearance">
          <div className="space-y-4">
            <p className="text-sm text-ink-600/70">Choose how the site looks. Dark mode reduces eye strain.</p>
            <div className="grid grid-cols-3 gap-3">
              {themes.map(th => (
                <button key={th.id} onClick={() => {
                  localStorage.setItem("ruiFengTheme", th.id);
                  document.documentElement.classList.toggle("dark", th.id === "dark" || (th.id === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches));
                  fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ themePreference: th.id }) }).catch(() => {});
                }}
                  className={`rounded-2xl border p-4 text-center transition hover-lift ${localStorage.getItem("ruiFengTheme") === th.id ? "border-jade-500/40 bg-jade-500/5 ring-1 ring-jade-500/20" : "border-ink-900/5 bg-white"}`}>
                  <div className="flex justify-center">{th.icon}</div>
                  <p className="mt-2 font-semibold text-sm text-ink-900">{th.label}</p>
                  <p className="mt-1 text-xs text-ink-600/50">{th.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </Panel>

        {/* Security tips */}
        <Panel title="Security Guidelines">
          <div className="space-y-3 text-sm text-ink-600/70">
            {["Use a unique strong password", "Enable 2FA for maximum protection", "Never share PIN, password, or 2FA codes", "瑞峯 will never ask for credentials via email/phone", "Log out on shared devices", "Review transactions regularly", "Report suspicious activity immediately"].map((tip, i) => (
              <div key={i} className="flex gap-2"><span className="text-jade-500">✓</span><p>{tip}</p></div>
            ))}
          </div>
        </Panel>

        {/* Account closure */}
        <Panel title="Account Management">
          <p className="text-sm text-ink-600/70 mb-3">Request account closure or changes through our Concierge service.</p>
          <a href="/dashboard/support" className="btn-secondary text-sm">Contact Concierge</a>
        </Panel>
      </div>
    </div>
  );
}
