"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeftRight,
  BadgeJapaneseYen,
  Bitcoin,
  Building2,
  CreditCard,
  FileText,
  HandCoins,
  LayoutDashboard,
  LineChart,
  LifeBuoy,
  LogOut,
  Newspaper,
  Receipt,
  Zap,
  Menu,
  PiggyBank,
  Settings,
  Users,
  Wallet,
  X,
  Bell,
  Landmark,
  ScrollText,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { FloatingParticles } from "@/components/particles";
import { LangCurrencyDropdowns } from "@/components/header-dropdowns";
import { AiChatWidget } from "@/components/ai-chat";
import { NotificationBell } from "@/components/notification-bell";
import { MobileBottomNav } from "@/components/mobile-nav";
import { cn, initials } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { SessionUser } from "@/lib/auth";

type NavItem = { href: string; labelKey: string; label?: string; icon: ReactNode };

const clientNav: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/dashboard/accounts", labelKey: "accounts", icon: <Wallet className="h-4 w-4" /> },
  { href: "/dashboard/transfers", labelKey: "transfers", icon: <ArrowLeftRight className="h-4 w-4" /> },
  { href: "/dashboard/cards", labelKey: "cards", icon: <CreditCard className="h-4 w-4" /> },
  { href: "/dashboard/investments", labelKey: "investments", icon: <LineChart className="h-4 w-4" /> },
  { href: "/dashboard/loans", labelKey: "lending", icon: <HandCoins className="h-4 w-4" /> },
  { href: "/dashboard/fx", labelKey: "fxDesk", icon: <BadgeJapaneseYen className="h-4 w-4" /> },
  { href: "/dashboard/bills", labelKey: "billPayments", icon: <Zap className="h-4 w-4" /> },
  { href: "/dashboard/crypto", labelKey: "cryptoFunding", icon: <Bitcoin className="h-4 w-4" /> },
  { href: "/dashboard/news", labelKey: "news", icon: <Newspaper className="h-4 w-4" /> },
  { href: "/dashboard/beneficiaries", labelKey: "beneficiaries", icon: <Users className="h-4 w-4" /> },
  { href: "/dashboard/receipts", labelKey: "receipts", icon: <Receipt className="h-4 w-4" /> },
  { href: "/dashboard/scheduled", labelKey: "recurringPayments", icon: <Receipt className="h-4 w-4" /> },
  { href: "/dashboard/statements", labelKey: "statements", icon: <FileText className="h-4 w-4" /> },
  { href: "/dashboard/support", labelKey: "concierge", icon: <LifeBuoy className="h-4 w-4" /> },
  { href: "/dashboard/notifications", labelKey: "notifications", icon: <Bell className="h-4 w-4" /> },
  { href: "/dashboard/security", labelKey: "settings", icon: <Shield className="h-4 w-4" /> },
  { href: "/dashboard/profile", labelKey: "profile", icon: <Settings className="h-4 w-4" /> },
];

const adminNav: NavItem[] = [
  { href: "/admin", labelKey: "commandCenter", icon: <Shield className="h-4 w-4" /> },
  { href: "/admin/analytics", labelKey: "overview", icon: <LineChart className="h-4 w-4" /> },
  { href: "/admin/kyc", labelKey: "overview", icon: <FileText className="h-4 w-4" /> },
  { href: "/admin/users", labelKey: "admin", icon: <Users className="h-4 w-4" /> },
  { href: "/admin/accounts", labelKey: "accounts", icon: <Landmark className="h-4 w-4" /> },
  { href: "/admin/transactions", labelKey: "transfers", icon: <ScrollText className="h-4 w-4" /> },
  { href: "/admin/cards", labelKey: "cards", icon: <CreditCard className="h-4 w-4" /> },
  { href: "/admin/loans", labelKey: "lending", icon: <PiggyBank className="h-4 w-4" /> },
  { href: "/admin/bills", labelKey: "billPayments", icon: <Zap className="h-4 w-4" /> },
  { href: "/admin/crypto", labelKey: "cryptoFunding", icon: <Bitcoin className="h-4 w-4" /> },
  { href: "/admin/broadcast", labelKey: "notifications", icon: <Bell className="h-4 w-4" /> },
  { href: "/admin/receipts", labelKey: "receipts", icon: <Receipt className="h-4 w-4" /> },
  { href: "/admin/system", labelKey: "settings", icon: <Settings className="h-4 w-4" /> },
  { href: "/admin/tickets", labelKey: "concierge", icon: <LifeBuoy className="h-4 w-4" /> },
  { href: "/admin/logs", labelKey: "overview", icon: <Building2 className="h-4 w-4" /> },
];

export function DashboardShell({
  user,
  children,
  notificationsCount = 0,
}: {
  user: SessionUser;
  children: ReactNode;
  notificationsCount?: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isAdmin = user.role === "admin" || user.role === "relationship_manager";
  const nav = isAdmin && pathname.startsWith("/admin") ? adminNav : clientNav;
  const lang = user.preferredLanguage || "en";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    window.location.assign("/login");
  }

  return (
    <div className="min-h-screen bg-ivory">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 transform bg-ink-950 transition-transform duration-200 lg:static lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-full flex-col border-r border-white/5">
            <div className="flex items-center justify-between px-5 py-5">
              <Logo light lang={lang} />
              <button className="text-rice-100 lg:hidden" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User card */}
            <div className="px-5 pb-4">
              <div className="rounded-2xl border border-jade-500/20 bg-white/5 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-jade-300">
                  {t(lang, isAdmin && pathname.startsWith("/admin") ? "commandCenter" : "privateBanking")}
                </p>
                <p className="mt-2 text-sm font-semibold text-rice-50">
                  {user.firstName} {user.lastName}
                </p>
                <p className="mt-1 text-xs text-rice-200/60">
                  {user.clientTier || user.role} · {user.country} · {user.preferredCurrency}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
              {nav.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn("sidebar-link", active && "active")}
                  >
                    {item.icon}
                    {t(lang, item.labelKey)}
                  </Link>
                );
              })}
            </nav>

            {/* Bottom actions — SIGN OUT always visible */}
            <div className="space-y-1 border-t border-white/10 px-3 pb-5 pt-4">
              {isAdmin ? (
                <Link
                  href={pathname.startsWith("/admin") ? "/dashboard" : "/admin"}
                  className="sidebar-link"
                  onClick={() => setOpen(false)}
                >
                  <Shield className="h-4 w-4" />
                  {pathname.startsWith("/admin") ? t(lang, "privateBanking") : t(lang, "commandCenter")}
                </Link>
              ) : null}
              <button
                onClick={handleLogout}
                className="sidebar-link w-full text-vermillion-400/80 hover:bg-vermillion-500/10 hover:text-vermillion-400"
              >
                <LogOut className="h-4 w-4" />
                {t(lang, "signOut")}
              </button>
            </div>
          </div>
        </aside>

        {open ? <div className="fixed inset-0 z-40 bg-ink-950/50 lg:hidden" onClick={() => setOpen(false)} /> : null}

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-ink-900/5 bg-rice-50/90 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-8">
              <div className="flex items-center gap-3">
                <button
                  className="rounded-xl border border-ink-900/10 bg-white p-2 text-ink-800 lg:hidden"
                  onClick={() => setOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-jade-600">
                    Asia Pacific · {t(lang, "privateBanking")}
                  </p>
                  <p className="text-sm text-ink-700">{t(lang, "secureSession")} · KYC {user.kycStatus}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Language & Currency dropdowns */}
                <LangCurrencyDropdowns lang={lang} currency={user.preferredCurrency} />
                <NotificationBell initialCount={notificationsCount} />
                <div className="hidden items-center gap-3 rounded-2xl border border-ink-900/10 bg-white px-3 py-2 sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full jade-gradient text-xs font-bold text-white">
                    {initials(user.firstName, user.lastName)}
                  </div>
                  <div className="leading-tight">
                    <p className="text-sm font-semibold text-ink-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs capitalize text-ink-600/70">{user.role.replaceAll("_", " ")}</p>
                  </div>
                </div>
                {/* Mobile sign out */}
                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-vermillion-500/20 bg-white p-2 text-vermillion-500 sm:hidden"
                  title={t(lang, "signOut")}
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>
          <main className="relative flex-1 px-4 py-6 pb-20 md:px-8 md:py-8 lg:pb-8">
            <FloatingParticles />
            <div className="relative z-10">{children}</div>
            <AiChatWidget />
            <MobileBottomNav />
            {/* Compliance footer */}
            <footer className="relative z-10 border-t border-ink-900/5 px-4 py-4 md:px-8">
              <div className="flex flex-col gap-2 text-[10px] text-ink-600/40 md:flex-row md:items-center md:justify-between">
                <p>© {new Date().getFullYear()} 瑞峯 RuiFeng Private Bank Ltd. All rights reserved. Regulated by MAS.</p>
                <div className="flex gap-4">
                  <span>Privacy Policy</span>
                  <span>Terms of Service</span>
                  <span>AML/KYC Policy</span>
                  <span>Cookie Policy</span>
                </div>
                <p>256-bit SSL · SOC 2 · ISO 27001</p>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
