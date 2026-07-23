"use client";

import { FormEvent, useState } from "react";
import { Alert, Button, Input, Label, Select, Textarea } from "@/components/ui";
import { CURRENCY_LABELS, LANGUAGE_LABELS } from "@/lib/i18n";

type Profile = {
  firstName: string;
  lastName: string;
  phone: string | null;
  city: string | null;
  address: string | null;
  country: string | null;
  preferredCurrency: string;
  preferredLanguage: string;
};

export function ProfileForm({ profile }: { profile: Profile }) {
  const [form, setForm] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone || "",
    city: profile.city || "",
    address: profile.address || "",
    country: profile.country || "",
    preferredCurrency: profile.preferredCurrency,
    preferredLanguage: profile.preferredLanguage,
    currentPassword: "",
    newPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Update failed");
      return;
    }
    setSuccess("Profile updated. Refresh to see language/currency changes.");
    setForm((f) => ({ ...f, currentPassword: "", newPassword: "" }));
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      {error ? <div className="sm:col-span-2"><Alert>{error}</Alert></div> : null}
      {success ? <div className="sm:col-span-2"><Alert type="success">{success}</Alert></div> : null}
      <div>
        <Label>First name · 名</Label>
        <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
      </div>
      <div>
        <Label>Last name · 姓</Label>
        <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
      </div>
      <div>
        <Label>Phone · 电话</Label>
        <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <div>
        <Label>City · 城市</Label>
        <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
      </div>
      <div>
        <Label>Country · 国家</Label>
        <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
      </div>
      <div className="sm:col-span-2">
        <Label>Address · 地址</Label>
        <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </div>

      {/* Language & Currency preferences */}
      <div>
        <Label>Preferred language · 语言</Label>
        <Select value={form.preferredLanguage} onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}>
          {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Preferred currency · 货币</Label>
        <Select value={form.preferredCurrency} onChange={(e) => setForm({ ...form, preferredCurrency: e.target.value })}>
          {Object.entries(CURRENCY_LABELS).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </Select>
      </div>

      {/* Password */}
      <div>
        <Label>Current password (for change)</Label>
        <Input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
      </div>
      <div>
        <Label>New password</Label>
        <Input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving… 保存中" : "Save profile · 保存"}
        </Button>
      </div>
    </form>
  );
}
