"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Alert, Button, Input, Label, Select } from "@/components/ui";
import { ASIAN_COUNTRIES, ASIAN_CURRENCIES } from "@/lib/utils";

export function BeneficiaryForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    name: "",
    bankName: "",
    accountNumber: "",
    swiftCode: "",
    currency: "USD",
    country: "Singapore",
    nickname: "",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const res = await fetch("/api/beneficiaries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed to save beneficiary");
      return;
    }
    setSuccess("Beneficiary added.");
    setForm({
      name: "",
      bankName: "",
      accountNumber: "",
      swiftCode: "",
      currency: "USD",
      country: "Singapore",
      nickname: "",
    });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      {error ? (
        <div className="sm:col-span-2">
          <Alert>{error}</Alert>
        </div>
      ) : null}
      {success ? (
        <div className="sm:col-span-2">
          <Alert type="success">{success}</Alert>
        </div>
      ) : null}
      <div>
        <Label>Beneficiary name</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div>
        <Label>Nickname</Label>
        <Input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
      </div>
      <div>
        <Label>Bank name</Label>
        <Input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} required />
      </div>
      <div>
        <Label>Account number / IBAN</Label>
        <Input
          value={form.accountNumber}
          onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
          required
        />
      </div>
      <div>
        <Label>SWIFT / BIC</Label>
        <Input value={form.swiftCode} onChange={(e) => setForm({ ...form, swiftCode: e.target.value })} />
      </div>
      <div>
        <Label>Currency</Label>
        <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
          {ASIAN_CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code}
            </option>
          ))}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label>Country</Label>
        <Select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
          {ASIAN_COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Add beneficiary"}
        </Button>
      </div>
    </form>
  );
}
