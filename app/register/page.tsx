"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Logo } from "@/components/logo";
import { Alert, Button, Input, Label, Select } from "@/components/ui";
import { ASIAN_COUNTRIES } from "@/lib/utils";
import { COUNTRY_CURRENCY, COUNTRY_LANGUAGE, CURRENCY_LABELS, LANGUAGE_LABELS } from "@/lib/i18n";
import { CITIES_BY_COUNTRY } from "@/lib/geo";

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "", phone: "",
    country: "Singapore", city: "Singapore", nationality: "Singapore",
    preferredCurrency: "SGD" as string, preferredLanguage: "en" as string,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const cities = useMemo(() => CITIES_BY_COUNTRY[form.country] || [], [form.country]);

  function updateCountry(country: string) {
    const newCities = CITIES_BY_COUNTRY[country] || [];
    setForm(prev => ({
      ...prev, country,
      city: newCities[0] || "",
      preferredCurrency: COUNTRY_CURRENCY[country] || prev.preferredCurrency,
      preferredLanguage: COUNTRY_LANGUAGE[country] || prev.preferredLanguage,
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Unable to create account"); setLoading(false); return; }
      window.location.assign(data.redirectTo || "/dashboard/kyc");
    } catch { setError("Network error."); setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-ivory">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden lg:block">
          <Logo />
          <h1 className="mt-10 font-display text-4xl font-semibold leading-tight text-ink-900">Open your 瑞峯 private relationship</h1>
          <p className="mt-4 text-ink-600/80">Join Asia&apos;s premier private bank for entrepreneurs, families, and stewards of wealth.</p>
          <div className="mt-8 space-y-3 text-sm text-ink-700">
            <p>🏦 Instant multi-currency account</p>
            <p>🌏 Platform in your preferred language</p>
            <p>💳 Access to cards, FX, lending & investments</p>
            <p>🔒 KYC verification for full access</p>
          </div>
        </div>

        <div className="card-shadow rounded-3xl border border-ink-900/5 bg-white p-6 md:p-8">
          <div className="mb-6 lg:hidden"><Logo /></div>
          <h2 className="font-display text-2xl font-semibold text-ink-900">Create account</h2>
          <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
            {error ? <div className="sm:col-span-2"><Alert>{error}</Alert></div> : null}
            <div><Label>First name</Label><Input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required /></div>
            <div><Label>Last name</Label><Input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required /></div>
            <div className="sm:col-span-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
            <div className="sm:col-span-2"><Label>Password</Label><Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={8} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+65 ..." /></div>
            <div><Label>Country</Label>
              <Select value={form.country} onChange={e => updateCountry(e.target.value)}>
                {ASIAN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div><Label>City</Label>
              <Select value={form.city} onChange={e => setForm({...form, city: e.target.value})}>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
                {cities.length === 0 && <option value="">Select city</option>}
              </Select>
            </div>
            <div><Label>Nationality</Label>
              <Select value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})}>
                {ASIAN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div><Label>Currency</Label>
              <Select value={form.preferredCurrency} onChange={e => setForm({...form, preferredCurrency: e.target.value})}>
                {Object.entries(CURRENCY_LABELS).map(([code, label]) => <option key={code} value={code}>{code} - {label}</option>)}
              </Select>
            </div>
            <div><Label>Language</Label>
              <Select value={form.preferredLanguage} onChange={e => setForm({...form, preferredLanguage: e.target.value})}>
                {Object.entries(LANGUAGE_LABELS).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating…" : "Open private account"}</Button>
            </div>
          </form>
          <p className="mt-6 text-sm text-ink-600/70">Already a client? <Link href="/login" className="font-semibold text-jade-600">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
