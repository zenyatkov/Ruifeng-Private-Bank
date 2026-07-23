"use client";

import { Globe, Coins } from "lucide-react";
import { useState } from "react";
import { LANGUAGE_LABELS, CURRENCY_LABELS } from "@/lib/i18n";

export function LangCurrencyDropdowns({ lang, currency }: { lang: string; currency: string }) {
  const [saving, setSaving] = useState(false);

  async function update(field: string, value: string) {
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    setSaving(false);
    // Force full page reload so entire site re-renders with new language/currency
    window.location.reload();
  }

  return (
    <div className="hidden items-center gap-1.5 sm:flex">
      <div className="relative">
        <Globe className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-600/50" />
        <select
          value={lang}
          disabled={saving}
          onChange={(e) => update("preferredLanguage", e.target.value)}
          className="appearance-none rounded-lg border border-ink-900/10 bg-white py-1.5 pl-7 pr-6 text-xs font-semibold text-ink-700 outline-none hover:border-jade-500/30 focus:border-jade-500 cursor-pointer"
        >
          {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </div>
      <div className="relative">
        <Coins className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-600/50" />
        <select
          value={currency}
          disabled={saving}
          onChange={(e) => update("preferredCurrency", e.target.value)}
          className="appearance-none rounded-lg border border-ink-900/10 bg-white py-1.5 pl-7 pr-8 text-xs font-semibold text-ink-700 outline-none hover:border-jade-500/30 focus:border-jade-500 cursor-pointer"
        >
          {Object.entries(CURRENCY_LABELS).map(([code, label]) => (
            <option key={code} value={code}>{code} - {label}</option>
          ))}
        </select>
      </div>
      {saving && <span className="text-[10px] text-jade-600 animate-pulse-jade">Saving...</span>}
    </div>
  );
}
