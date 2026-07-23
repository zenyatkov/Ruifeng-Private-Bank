"use client";

import { useUserPrefs } from "@/components/user-context";
import { t } from "@/lib/i18n";
import type { ReactNode } from "react";

export function THeader({ titleKey, subtitle, actions }: { titleKey: string; subtitle?: string; actions?: ReactNode }) {
  const { lang } = useUserPrefs();
  const translated = t(lang, titleKey);

  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-jade-600">
          {t(lang, "bankName")} {t(lang, "bankSubtitle")}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900 md:text-4xl">{translated}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-ink-600/80 md:text-base">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
