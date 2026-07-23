"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, X, Check, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserPrefs } from "@/components/user-context";
import { t } from "@/lib/i18n";

type Notification = { id: number; title: string; body: string; type: string | null; isRead: boolean; createdAt: string };

// Map notification titles to destination URLs
function getNotificationLink(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("transfer") || lower.includes("sent") || lower.includes("wire")) return "/dashboard/transfers";
  if (lower.includes("loan") || lower.includes("credit")) return "/dashboard/loans";
  if (lower.includes("card") || lower.includes("card approved")) return "/dashboard/cards";
  if (lower.includes("bill") || lower.includes("payment completed") || lower.includes("payment declined")) return "/dashboard/bills";
  if (lower.includes("kyc") || lower.includes("verification") || lower.includes("identity")) return "/dashboard/kyc";
  if (lower.includes("fx") || lower.includes("conversion") || lower.includes("rate")) return "/dashboard/fx";
  if (lower.includes("investment") || lower.includes("portfolio")) return "/dashboard/investments";
  if (lower.includes("receipt")) return "/dashboard/receipts";
  if (lower.includes("password") || lower.includes("security") || lower.includes("2fa")) return "/dashboard/security";
  if (lower.includes("welcome") || lower.includes("onboarding")) return "/dashboard/kyc";
  if (lower.includes("support") || lower.includes("reply") || lower.includes("ticket")) return "/dashboard/support";
  if (lower.includes("funds credited") || lower.includes("funds debited") || lower.includes("adjustment")) return "/dashboard/accounts";
  // Default: go to dashboard
  return "/dashboard";
}

export function NotificationBell({ initialCount }: { initialCount: number }) {
  const router = useRouter();
  const { lang } = useUserPrefs();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [count, setCount] = useState(initialCount);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function load() {
    if (!loaded) {
      const res = await fetch("/api/notifications");
      const d = await res.json();
      // Handle successResponse wrapper
      const notifs = d.data?.notifications || d.notifications || [];
      setItems(notifs);
      setLoaded(true);
    }
    setOpen(v => !v);
  }

  async function markRead(id: number) {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isRead: true }) });
    setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setCount(prev => Math.max(0, prev - 1));
  }

  async function markAll() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAll: true }) });
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    setCount(0);
  }

  function handleNotificationClick(n: Notification) {
    if (!n.isRead) markRead(n.id);
    const link = getNotificationLink(n.title);
    setOpen(false);
    router.push(link);
  }

  const typeIcon: Record<string, string> = { success: "🟢", alert: "🔴", info: "🔵" };

  return (
    <div ref={ref} className="relative">
      <button onClick={load} className="relative rounded-xl border border-ink-900/10 bg-white p-2 text-ink-800 hover:bg-rice-100 transition">
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-vermillion-500 px-1 text-[10px] font-bold text-white animate-pulse-jade">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-ink-900/10 bg-white shadow-2xl animate-slide-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-ink-900/5 px-4 py-3">
            <p className="font-display text-sm font-semibold text-ink-900">{t(lang, "notifications")}</p>
            <div className="flex items-center gap-2">
              {count > 0 && (
                <button onClick={markAll} className="flex items-center gap-1 text-[11px] font-semibold text-jade-600 hover:text-jade-700">
                  <CheckCheck className="h-3 w-3" /> {t(lang, "markAllRead") || "Mark all read"}
                </button>
              )}
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-rice-100"><X className="h-4 w-4 text-ink-600/50" /></button>
            </div>
          </div>

          {/* Items */}
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-ink-600/50">{t(lang, "noNotifications") || "No notifications"}</div>
            ) : (
              items.slice(0, 15).map(n => (
                <button
                  key={n.id}
                  className={`w-full text-left border-b border-ink-900/5 px-4 py-3 transition hover:bg-rice-50 cursor-pointer ${n.isRead ? "opacity-60" : ""}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-sm">{typeIcon[n.type || "info"] || "🔵"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink-900 truncate">{n.title}</p>
                      <p className="mt-0.5 text-xs text-ink-600/70 line-clamp-2">{n.body}</p>
                      <p className="mt-1 text-[10px] text-ink-600/40">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                    {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-jade-500" />}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-ink-900/5 px-4 py-2">
            <Link href="/dashboard/notifications" onClick={() => setOpen(false)} className="block text-center text-xs font-semibold text-jade-600 hover:text-jade-700 py-1">
              {t(lang, "viewAllNotifications") || "View all notifications"} →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
