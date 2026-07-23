"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Shield } from "lucide-react";
import { Logo } from "@/components/logo";
import { Alert, Button, Input, Label } from "@/components/ui";

export default function LoginPage() {
  const [mode, setMode] = useState<"client" | "staff">("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Unable to sign in"); setLoading(false); return; }

      // Staff mode must be admin/RM
      if (mode === "staff" && data.user?.role === "client") {
        setError("Access denied. This terminal is for bank staff only.");
        setLoading(false); return;
      }

      window.location.assign(data.redirectTo || "/dashboard");
    } catch { setError("Network error."); setLoading(false); }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left panel */}
      <div className="relative hidden bg-mesh digital-grid lg:block">
        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <Logo light />
          <div>
            <div className="flex items-center gap-3">
              <span className="seal-mark text-xl">峯</span>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-jade-300">
                {mode === "staff" ? "Staff Portal" : "Secure Client Portal"}
              </p>
            </div>
            <h1 className="mt-4 max-w-md font-display text-4xl leading-tight text-rice-50">
              {mode === "staff" ? "Bank Staff Terminal" : "Your Asia wealth command centre."}
            </h1>
            <p className="mt-4 max-w-md text-sm text-rice-200/70">
              {mode === "staff"
                ? "Authorized personnel only. All actions are logged and audited."
                : "Securely manage multi-currency accounts, investments, cards, and services across Asia Pacific."}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-rice-200/40">256-bit SSL encrypted · MAS regulated · SOC 2 compliant</p>
            <p className="text-xs text-rice-200/30">© {new Date().getFullYear()} 瑞峯 RuiFeng Private Bank Ltd.</p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center bg-rice-50 px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo /></div>

          {/* Client / Staff toggle */}
          <div className="flex gap-2 rounded-xl bg-rice-200 p-1 mb-8">
            <button type="button" onClick={() => { setMode("client"); setError(""); }}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${mode === "client" ? "bg-white text-ink-900 shadow" : "text-ink-600"}`}>
              Client Portal
            </button>
            <button type="button" onClick={() => { setMode("staff"); setError(""); }}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition flex items-center justify-center gap-2 ${mode === "staff" ? "bg-ink-900 text-rice-50 shadow" : "text-ink-600"}`}>
              <Shield className="h-4 w-4" /> Staff Terminal
            </button>
          </div>

          <h2 className="font-display text-3xl font-semibold text-ink-900">
            {mode === "staff" ? "Staff Sign In" : "Sign In"}
          </h2>
          <p className="mt-2 text-sm text-ink-600/75">
            {mode === "staff"
              ? "Authorized bank employees and relationship managers only."
              : "Access your 瑞峯 RuiFeng private banking portal."}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            {error && <Alert>{error}</Alert>}
            <div>
              <Label>{mode === "staff" ? "Staff email" : "Email address"}</Label>
              <Input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required placeholder={mode === "staff" ? "staff@ruifeng.bank" : "Enter your email"} />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter your password" />
            </div>
            <Button type="submit" className={`w-full ${mode === "staff" ? "!bg-ink-900 hover:!bg-ink-800" : ""}`} disabled={loading}>
              {loading ? "Authenticating…" : mode === "staff" ? "🔒 Access Staff Terminal" : "Sign in securely"}
            </Button>
          </form>

          <p className="mt-4 text-sm"><Link href="/forgot-password" className="text-ink-600/70 hover:text-jade-600">Forgot password?</Link></p>
          {mode === "client" && (
            <p className="mt-3 text-sm text-ink-600/70">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-jade-600 hover:text-jade-500">Open a private account</Link>
            </p>
          )}

          <p className="mt-3 text-sm">
            <Link href="/" className="text-ink-600/70 hover:text-ink-900">← Back to homepage</Link>
          </p>

          <div className="mt-8 rounded-2xl border border-ink-900/8 bg-white p-4 text-xs text-ink-600/60">
            <p className="font-semibold text-ink-700">Security Notice</p>
            <p className="mt-1">Your session is encrypted with 256-bit SSL. Never share your credentials. 瑞峯 RuiFeng Private Bank will never request your password via email or phone.</p>
            {mode === "staff" && <p className="mt-2 text-vermillion-500/70">⚠ Staff access is monitored. All actions are recorded in audit logs.</p>}
            <p className="mt-2 text-ink-600/40">Regulated by the Monetary Authority of Singapore (MAS)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
