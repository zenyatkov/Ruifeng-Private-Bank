"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { Alert, Button, Input, Label } from "@/components/ui";

export function PinEntry({
  onVerified,
  onCancel,
}: {
  onVerified: () => void;
  onCancel: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/pin").then(r => r.json()).then(d => setHasPin(d.hasPin));
    inputRef.current?.focus();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (hasPin === false) {
      // No pin set — set one
      const res = await fetch("/api/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) { setError(data.error || "Failed to set PIN"); return; }
      onVerified();
      return;
    }

    // Verify existing pin
    const res = await fetch("/api/pin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok || !data.valid) {
      setError("Invalid PIN. Please try again.");
      setPin("");
      inputRef.current?.focus();
      return;
    }
    onVerified();
  }

  if (hasPin === null) return <div className="text-center py-8 text-ink-600">Loading security…</div>;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink-950/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 card-shadow">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-900 text-jade-300">
            {hasPin ? <Lock className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </div>
          <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">
            {hasPin ? "Enter Transaction PIN" : "Set Transaction PIN"}
          </h3>
          <p className="mt-2 text-sm text-ink-600/70">
            {hasPin
              ? "Enter your 4-6 digit PIN to authorize this transaction."
              : "Create a 4-6 digit PIN to secure your transactions."}
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error && <Alert>{error}</Alert>}
          <div>
            <Label>{hasPin ? "PIN · 密码" : "Create PIN · 设置密码"}</Label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={6}
              minLength={4}
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="text-center text-2xl tracking-[0.5em]"
              required
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={loading || pin.length < 4}>
              {loading ? "Verifying…" : hasPin ? "Confirm" : "Set PIN"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
