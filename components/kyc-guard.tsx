"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ShieldCheck, ShieldAlert, Clock, ArrowRight } from "lucide-react";
import { t } from "@/lib/i18n";
import Link from "next/link";

// Pages that require KYC verification to access
const KYC_REQUIRED_PATHS = [
  "/dashboard/transfers",
  "/dashboard/cards",
  "/dashboard/loans",
  "/dashboard/fx",
  "/dashboard/bills",
  "/dashboard/crypto",
  "/dashboard/investments",
  "/dashboard/beneficiaries",
  "/dashboard/scheduled",
];

// Pages accessible without KYC
const KYC_EXCLUDED_PATHS = [
  "/dashboard",
  "/dashboard/accounts",
  "/dashboard/kyc",
  "/dashboard/security",
  "/dashboard/profile",
  "/dashboard/notifications",
  "/dashboard/news",
  "/dashboard/support",
  "/dashboard/statements",
  "/dashboard/receipts",
];

export function KycGuard({
  kycStatus,
  lang,
  children,
}: {
  kycStatus: string;
  lang: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [showBanner, setShowBanner] = useState(false);

  // Admins and relationship managers bypass KYC
  // Only check for paths that require KYC
  const needsKyc = KYC_REQUIRED_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (needsKyc && kycStatus !== "verified") {
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, [needsKyc, kycStatus, pathname]);

  // If user is verified or page doesn't need KYC, render normally
  if (!needsKyc || kycStatus === "verified") {
    return <>{children}</>;
  }

  // Show KYC restriction overlay
  if (kycStatus === "rejected") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="max-w-md text-center animate-fade-in">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-vermillion-500/10">
            <ShieldAlert className="h-10 w-10 text-vermillion-500" />
          </div>
          <h2 className="mt-6 font-display text-2xl font-semibold text-ink-900">
            {t(lang, "kycRejectedTitle")}
          </h2>
          <p className="mt-3 text-ink-600/70">
            {t(lang, "kycRejectedBody")}
          </p>
          <p className="mt-2 text-sm text-vermillion-500 font-medium">
            {t(lang, "kycRejectedAction")}
          </p>
          <Link
            href="/dashboard/support"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink-900 px-6 py-3 text-sm font-semibold text-white hover:bg-ink-800 transition"
          >
            {t(lang, "concierge")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  // kycStatus is "pending" or "review" — show pending overlay
  if (kycStatus === "review") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="max-w-md text-center animate-fade-in">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-jade-500/10 animate-bounce-slow">
            <Clock className="h-10 w-10 text-jade-600" />
          </div>
          <h2 className="mt-6 font-display text-2xl font-semibold text-ink-900">
            {t(lang, "kycReviewTitle")}
          </h2>
          <p className="mt-3 text-ink-600/70">
            {t(lang, "kycReviewBody")}
          </p>
          <div className="mt-6 flex gap-1 justify-center">
            <span className="h-2 w-8 rounded-full bg-jade-500" />
            <span className="h-2 w-6 rounded-full bg-jade-400 progress-animate" />
            <span className="h-2 w-6 rounded-full bg-ink-900/10" />
          </div>
        </div>
      </div>
    );
  }

  // kycStatus is "pending" — user hasn't submitted KYC yet, redirect prompt
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="max-w-md text-center animate-fade-in">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-jade-500/10">
          <ShieldCheck className="h-10 w-10 text-jade-600" />
        </div>
        <h2 className="mt-6 font-display text-2xl font-semibold text-ink-900">
          {t(lang, "kycRequiredTitle")}
        </h2>
        <p className="mt-3 text-ink-600/70">
          {t(lang, "kycRequiredBody")}
        </p>
        <p className="mt-2 text-sm font-medium text-jade-600">
          {t(lang, "kycRequiredAction")}
        </p>
        <Link
          href="/dashboard/kyc"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-jade-600 px-6 py-3 text-sm font-semibold text-white hover:bg-jade-700 transition"
        >
          {t(lang, "startKyc")} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
