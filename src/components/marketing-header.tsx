import Link from "next/link";
import { Logo } from "@/components/logo";

export function MarketingHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Logo light />
        <nav className="hidden items-center gap-8 text-sm text-rice-200/80 md:flex">
          <a href="#services" className="hover:text-jade-300">服务 Services</a>
          <a href="#markets" className="hover:text-jade-300">市场 Markets</a>
          <a href="#wealth" className="hover:text-jade-300">财富 Wealth</a>
          <a href="#concierge" className="hover:text-jade-300">管家 Concierge</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost text-sm text-rice-50">Sign in</Link>
          <Link href="/register" className="btn-primary text-sm">Open account</Link>
        </div>
      </div>
    </header>
  );
}
