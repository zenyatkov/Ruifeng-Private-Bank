"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, CreditCard, LineChart, MoreHorizontal } from "lucide-react";

const items = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/dashboard/transfers", icon: ArrowLeftRight, label: "Transfer" },
  { href: "/dashboard/cards", icon: CreditCard, label: "Cards" },
  { href: "/dashboard/investments", icon: LineChart, label: "Invest" },
  { href: "/dashboard/profile", icon: MoreHorizontal, label: "More" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-ink-900/5 bg-white/95 backdrop-blur-lg lg:hidden">
      <div className="flex items-center justify-around py-2">
        {items.map(item => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${active ? "text-jade-600" : "text-ink-600/50"}`}>
              <item.icon className={`h-5 w-5 ${active ? "text-jade-600" : ""}`} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
