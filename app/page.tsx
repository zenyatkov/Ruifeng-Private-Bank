import Link from "next/link";
import {
  ArrowRight, Building2, Globe2, Landmark, LineChart, Lock,
  ShieldCheck, Sparkles, Wallet, Bitcoin, BadgeJapaneseYen,
} from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";
import { HeroSlideshow } from "@/components/hero-slideshow";
import { Logo } from "@/components/logo";
import { seedIfNeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

const hubs = [
  { city: "新加坡 Singapore", role: "Global HQ & Wealth Hub" },
  { city: "香港 Hong Kong", role: "Capital Markets Desk" },
  { city: "東京 Tokyo", role: "North Asia Coverage" },
  { city: "मुम्बई Mumbai", role: "South Asia Private Clients" },
  { city: "دبي Dubai", role: "Cross-border Family Office" },
  { city: "서울 Seoul", role: "Korea Private Banking" },
  { city: "🇺🇸 New York", role: "Americas Coverage" },
  { city: "🇬🇧 London", role: "European Wealth Desk" },
  { city: "🇨🇦 Toronto", role: "North American Hub" },
];

const services = [
  { title: "Multi-Currency Treasury", description: "Hold, move, and optimise cash across 18 currencies — SGD, HKD, JPY, KRW, CNY, INR, USD, GBP, EUR, CAD and more — with institutional FX spreads.", icon: Wallet },
  { title: "Discretionary Wealth", description: "Bespoke portfolios spanning Asia equities, private credit, sovereign bonds, and alternatives.", icon: LineChart },
  { title: "Crypto Payments & Settlement", description: "Fund and settle with BTC, ETH, USDT, USDC. Zero FX friction, instant settlement, institutional-grade custody.", icon: Bitcoin },
  { title: "Low-Tax Optimisation", description: "Capital gains at 0% in Singapore, Hong Kong, UAE. Tax-aware structuring for Asian principal families.", icon: BadgeJapaneseYen },
  { title: "Secured Lending", description: "Lombard facilities, property financing, and liquidity lines against diversified collateral.", icon: Landmark },
  { title: "Bank-grade Security", description: "Layered authentication, real-time monitoring, and compliance across MAS, FCA, SEC, HKMA.", icon: ShieldCheck },
];

export default async function HomePage() {
  await seedIfNeeded();

  return (
    <div className="bg-ink-950 text-rice-50">
      <MarketingHeader />

      {/* Hero with slideshow */}
      <section className="relative overflow-hidden min-h-[90vh]">
        <HeroSlideshow />
        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-36 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pt-40">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-jade-500/30 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-jade-300">
              <Globe2 className="h-3.5 w-3.5" />
              亚洲全境服务 · 18 Markets · Crypto · Low Tax
            </div>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl lg:text-7xl">
              <span className="jade-text">瑞峯</span>{" "}
              <span className="text-rice-50">Private banking for</span>{" "}
              <span className="vermillion-text">Asia&apos;s stewards of wealth</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-rice-200/75 md:text-lg">
              瑞峯 RuiFeng Private Bank unites multi-currency banking, crypto payments, investment craftsmanship, and white-glove concierge
              across 18 markets — Singapore, Hong Kong, Tokyo, Mumbai, Seoul, London, New York, Toronto, Dubai, and beyond — built for families who move markets.
            </p>
            {/* Fintech badges */}
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-jade-500/15 border border-jade-500/20 px-3 py-1 text-[10px] font-semibold text-jade-300">🪙 Crypto Payments</span>
              <span className="rounded-full bg-bronze-400/15 border border-bronze-500/20 px-3 py-1 text-[10px] font-semibold text-bronze-300">📊 0% Capital Gains Tax</span>
              <span className="rounded-full bg-rice-200/10 border border-rice-200/10 px-3 py-1 text-[10px] font-semibold text-rice-200/80">🔒 256-bit SSL</span>
              <span className="rounded-full bg-vermillion-500/10 border border-vermillion-500/20 px-3 py-1 text-[10px] font-semibold text-vermillion-400">🌍 18 Markets</span>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/register" className="btn-primary">
                Begin onboarding <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="rounded-full border border-rice-200/20 px-6 py-3 text-sm font-semibold text-rice-50 hover:bg-white/5">
                Client login
              </Link>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
              {[
                ["SGD 48B+", "Client assets advised"],
                ["18", "Markets covered"],
                ["24/7", "Concierge & dealing"],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="font-display text-2xl text-jade-300 md:text-3xl">{value}</p>
                  <p className="mt-1 text-xs text-rice-200/60 md:text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Wealth card — SGD, increased */}
          <div className="relative">
            <div className="premium-card glow-jade rounded-[2rem] p-6 md:p-8">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-jade-300">財富概覽 Wealth Snapshot</p>
                <Lock className="h-4 w-4 text-jade-300" />
              </div>
              <p className="mt-6 text-sm text-rice-200/60">Consolidated Asia book</p>
              <p className="mt-2 font-display text-4xl text-rice-50 md:text-5xl">SGD 64,284,450</p>
              <p className="mt-2 text-sm text-jade-400">+8.4% MTD performance · SGD base currency</p>
              <div className="mt-8 space-y-3">
                {[
                  ["Private Wealth SGD", "42,845,000", "SGD"],
                  ["SGD Liquidity", "13,809,450", "SGD"],
                  ["Asia Growth Fund", "8,630,000", "SGD"],
                ].map(([name, amount, ccy]) => (
                  <div key={name} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-rice-50">{name}</p>
                      <p className="text-xs text-rice-200/50">{ccy}</p>
                    </div>
                    <p className="font-semibold text-jade-300">{amount}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-jade-500/20 bg-jade-500/10 px-4 py-3 text-xs text-jade-300">
                <span className="seal-mark">峯</span>
                <span>Relationship Manager: Hiroshi Tanaka · Tokyo & Singapore desk · Crypto & Low-Tax Optimised</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Promotional Ad Video Section ── */}
      <section id="ad-video" className="bg-ink-950 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end mb-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-jade-300">瑞峯 RuiFeng · Digital Banking</p>
              <h2 className="mt-3 font-display text-3xl font-semibold md:text-5xl text-rice-50">Experience the future of private banking</h2>
            </div>
            <p className="max-w-md text-sm text-rice-200/70">A seamless fusion of tradition and innovation — watch how RuiFeng redefines wealth management for Asia&apos;s next generation.</p>
          </div>
          {/* Animated ad video placeholder */}
          <div className="relative rounded-[2rem] overflow-hidden premium-card-glow" style={{ minHeight: '420px' }}>
            {/* Animated background layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-jade-900 via-ink-950 to-emerald-900" />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(22,163,74,0.3) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(217,119,6,0.15) 0%, transparent 50%)' }} />
            {/* Animated ticker line */}
            <div className="absolute top-0 left-0 right-0 overflow-hidden h-16 bg-gradient-to-b from-ink-950/90 to-transparent">
              <div className="flex items-center gap-8 animate-slide-in whitespace-nowrap py-4 px-6 text-jade-300/50 text-xs font-mono tracking-wider">
                <span>SGD/USD 1.3425 ▲</span><span>HKD/JPY 15.82 ▼</span><span>BTC 68,420 ▲</span><span>ETH 3,845 ▲</span><span>USDT 1.00 ─</span><span>S&P 500 5,821 ▲</span><span>Nikkei 38,420 ▲</span><span>HSI 20,156 ▼</span><span>INR/USD 0.012 ▲</span><span>KRW/USD 0.00073 ─</span>
              </div>
            </div>
            {/* Central content */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-8 py-20" style={{ minHeight: '420px' }}>
              <div className="seal-mark text-6xl mb-6 animate-bounce-slow">峯</div>
              <h3 className="font-display text-3xl md:text-4xl font-semibold text-rice-50 mb-4">瑞峯 Private Banking</h3>
              <p className="text-rice-200/70 text-lg max-w-xl mb-8">Multi-currency · Crypto settlement · 0% capital gains · 18 markets · 24/7 concierge</p>
              {/* Animated feature tiles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl w-full">
                {[
                  { icon: "🪙", label: "Crypto", value: "BTC·ETH·USDT" },
                  { icon: "📊", label: "Markets", value: "18 Countries" },
                  { icon: "🔒", label: "Security", value: "256-bit SSL" },
                  { icon: "🏦", label: "Tax", value: "0% Capital Gains" },
                ].map((item, i) => (
                  <div key={item.label} className="rounded-2xl border border-jade-500/20 bg-white/5 px-4 py-3 animate-fade-in" style={{ animationDelay: `${i * 200}ms` }}>
                    <p className="text-2xl mb-1">{item.icon}</p>
                    <p className="text-xs font-semibold text-jade-300">{item.label}</p>
                    <p className="text-[10px] text-rice-200/50">{item.value}</p>
                  </div>
                ))}
              </div>
              <Link href="/register" className="mt-8 btn-primary animate-fade-in" style={{ animationDelay: '800ms' }}>
                Start your journey <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-ink-950 to-transparent" />
          </div>
        </div>
      </section>

      {/* Services — luxurious */}
      <section id="services" className="bg-rice-50 px-6 py-24 text-ink-900">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-jade-600">服务 Capabilities</p>
            <h2 className="mt-3 font-display text-3xl font-semibold md:text-5xl">Every instrument of modern private banking</h2>
            <p className="mt-4 text-ink-600/80">
              From same-day SWIFT and multi-currency cash to crypto settlement, discretionary mandates, and secured credit —
              one seamless platform for principal families across Asia and the world.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <div key={service.title} className="card-shadow rounded-3xl border border-ink-900/5 bg-white p-6 transition hover:border-jade-500/20 hover:shadow-jade-500/5 hover-lift">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900 text-jade-300">
                  <service.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold">{service.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-600/80">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Markets */}
      <section id="markets" className="bg-ink-900 px-6 py-24 digital-grid">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-jade-300">全球网络 Global footprint</p>
              <h2 className="mt-3 font-display text-3xl font-semibold md:text-5xl">Anchored in Asia, present worldwide</h2>
            </div>
            <p className="max-w-md text-sm text-rice-200/70">
              Local market expertise with cross-border custody, tax-aware structuring guidance, crypto settlement, and multilingual coverage teams.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hubs.map((hub) => (
              <div key={hub.city} className="glass-card rounded-3xl p-6 transition hover:border-jade-500/30 hover-lift">
                <p className="font-display text-2xl text-rice-50">{hub.city}</p>
                <p className="mt-2 text-sm text-jade-300">{hub.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment philosophy */}
      <section id="wealth" className="bg-rice-100 px-6 py-24 text-ink-900">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-jade-600">投資哲学 Investment philosophy</p>
            <h2 className="mt-3 font-display text-3xl font-semibold md:text-5xl">Patient capital. Asian insight. Global access.</h2>
            <p className="mt-5 text-ink-600/80">
              Our CIO desk blends on-the-ground research across ASEAN, Greater China, India, Japan, Korea, Americas, and Europe with disciplined
              risk frameworks — so your balance sheet works as hard as your enterprise.
            </p>
            <ul className="mt-8 space-y-4 text-sm">
              {[
                "Direct Asia equity and ETF access with transparent custody",
                "Crypto settlement — BTC, ETH, USDT with institutional custody",
                "0% capital gains tax in Singapore, Hong Kong, and UAE jurisdictions",
                "FX overlay and multi-currency treasury optimisation (18 currencies)",
                "Private credit and alternatives reserved for private clients",
                "Real-time consolidated reporting in your client portal",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-jade-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Asia Growth Mandate", value: "+18.4%", note: "3Y annualised" },
              { label: "SGD Bond Sleeve", value: "4.1%", note: "Yield to maturity" },
              { label: "Private Credit", value: "9.6%", note: "Target net IRR" },
              { label: "Crypto Overlay", value: "+24.2%", note: "YTD BTC + ETH" },
            ].map((card) => (
              <div key={card.label} className="rounded-3xl bg-ink-950 p-6 text-rice-50 glow-jade transition hover:border-jade-500/20 hover-lift">
                <p className="text-xs uppercase tracking-[0.16em] text-jade-300">{card.label}</p>
                <p className="mt-4 font-display text-3xl text-jade-300">{card.value}</p>
                <p className="mt-2 text-sm text-rice-200/60">{card.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="concierge" className="bg-mesh digital-grid px-6 py-24">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-jade-500/20 bg-white/5 p-8 md:p-12 glow-jade">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <span className="seal-mark text-lg">峯</span>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-jade-300">邀請 Invitation</p>
              </div>
              <h2 className="mt-3 font-display text-3xl font-semibold md:text-5xl">Experience banking without friction</h2>
              <p className="mt-4 max-w-2xl text-rice-200/75">
                Open a Private, Priority, Prestige, or Ultra High Net Worth relationship. Crypto-friendly, low-tax, and 24/7 concierge — your dedicated manager and Asia desk are ready.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/register" className="btn-primary">Request access</Link>
              <Link href="/login" className="rounded-full border border-rice-200/20 px-6 py-3 text-sm font-semibold">Existing client</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-ink-950 px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <Logo light />
          <p className="max-w-xl text-sm text-rice-200/50">
            瑞峯 RuiFeng Private Bank Ltd is regulated by MAS, FCA, SEC. Licensed for private banking and wealth management across Asia Pacific, Americas, and Europe. Crypto settlement services available in select jurisdictions. 0% capital gains tax in Singapore, Hong Kong, UAE.
          </p>
          <div className="text-sm text-rice-200/60">© {new Date().getFullYear()} 瑞峯 RuiFeng Private Bank</div>
        </div>
      </footer>
    </div>
  );
}
