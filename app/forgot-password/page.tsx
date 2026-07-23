"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Logo } from "@/components/logo";
import { Alert, Button, Input, Label } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function requestReset(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    const res = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const d = await res.json();
    setLoading(false);
    
    setStep("reset");
  }

  async function doReset(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    const res = await fetch("/api/auth/reset-password", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, newPassword }) });
    const d = await res.json();
    setLoading(false);
    if (!res.ok) { setError(d.error); return; }
    setStep("done");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-rice-50 px-6">
      <div className="w-full max-w-md">
        <div className="mb-8"><Logo /></div>
        {step === "email" && (
          <>
            <h2 className="font-display text-2xl font-semibold text-ink-900">Reset password</h2>
            <p className="mt-2 text-sm text-ink-600/70">Enter your email to receive a reset link.</p>
            <form onSubmit={requestReset} className="mt-6 space-y-4">
              {error && <Alert>{error}</Alert>}
              <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending..." : "Send reset link"}</Button>
            </form>
          </>
        )}
        {step === "reset" && (
          <>
            <h2 className="font-display text-2xl font-semibold text-ink-900">Enter new password</h2>
            <p className="mt-2 text-sm text-ink-600/70">Check your email for the reset code.</p>
            <form onSubmit={doReset} className="mt-6 space-y-4">
              {error && <Alert>{error}</Alert>}
              <div><Label>Reset token</Label><Input value={token} onChange={e => setToken(e.target.value)} required placeholder="Paste from email" /></div>
              <div><Label>New password</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Resetting..." : "Reset password"}</Button>
            </form>
          </>
        )}
        {step === "done" && (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-jade-500/10"><span className="text-3xl">✓</span></div>
            <h2 className="mt-4 font-display text-2xl font-semibold text-ink-900">Password reset!</h2>
            <p className="mt-2 text-sm text-ink-600/70">You can now sign in with your new password.</p>
            <Link href="/login" className="btn-primary mt-6 inline-flex">Sign in</Link>
          </div>
        )}
        <p className="mt-6 text-sm text-center"><Link href="/login" className="text-ink-600/70 hover:text-ink-900">← Back to login</Link></p>
      </div>
    </div>
  );
}
