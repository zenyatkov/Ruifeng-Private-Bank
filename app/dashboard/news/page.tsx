"use client";

import { useEffect, useState } from "react";
import { RefreshCw, TrendingUp, Globe, ExternalLink, Newspaper } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui";
import { useUserPrefs } from "@/components/user-context";
import { t } from "@/lib/i18n";

type NewsItem = {
  title: string;
  source: string;
  category: string;
  time: string;
  url?: string;
};

export default function NewsPage() {
  const { lang } = useUserPrefs();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [live, setLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  async function fetchNews() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/news");
      const data = await res.json();
      if (data.news && data.news.length > 0) {
        setItems(data.news);
        setLive(data.live === true);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch {
      // Keep existing items on fetch failure
    }
    setRefreshing(false);
  }

  // Initial fetch
  useEffect(() => { fetchNews(); }, []);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchNews, 10000);
    return () => clearInterval(interval);
  }, []);

  const catColors: Record<string, string> = {
    Markets: "text-jade-600 bg-jade-500/10", FX: "text-sky-600 bg-sky-100",
    "Central Banks": "text-vermillion-500 bg-vermillion-500/10", IPO: "text-purple-600 bg-purple-100",
    Tech: "text-indigo-600 bg-indigo-100", Commodities: "text-bronze-600 bg-bronze-400/15",
    Economy: "text-teal-600 bg-teal-100", Wealth: "text-jade-700 bg-jade-500/10",
    Regulation: "text-orange-600 bg-orange-100", Investments: "text-ink-700 bg-ink-900/5",
    Crypto: "text-amber-600 bg-amber-100",
  };

  return (
    <div>
      <PageHeader
        title={t(lang, "news")}
        subtitle={live ? "🔴 Live financial news · Auto-refreshes every 10s" : "Financial news · Auto-refreshes every 10s"}
        actions={
          <div className="flex items-center gap-4">
            <button onClick={fetchNews} className="flex items-center gap-2 rounded-full border border-ink-900/10 bg-white px-3 py-2 text-xs font-semibold text-ink-800 hover:bg-rice-50 transition" disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-jade-500" : ""}`} />
              Refresh
            </button>
            <div className="flex items-center gap-2 text-xs">
              {live && <span className="h-2.5 w-2.5 rounded-full bg-vermillion-500 animate-pulse-jade" />}
              <span className="font-semibold text-ink-700">{live ? "🔴 Live Feed" : "Simulated"}</span>
              {lastUpdated && <span className="text-ink-600/50">· Last: {lastUpdated}</span>}
            </div>
          </div>
        }
      />

      {/* Featured headline */}
      {items.length > 0 && (
        <div className="mb-6 rounded-3xl bg-gradient-to-br from-ink-950 to-ink-900 p-6 text-rice-50 premium-card glow-jade">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-jade-300" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-jade-300">Featured · {items[0].category}</span>
            <span className="text-xs text-rice-200/50">{items[0].source}</span>
          </div>
          {items[0].url ? (
            <a href={items[0].url} target="_blank" rel="noopener noreferrer" className="text-xl font-display font-semibold text-rice-50 hover:text-jade-300 transition">
              {items[0].title} <ExternalLink className="h-4 w-4 inline ml-1 text-jade-300" />
            </a>
          ) : (
            <p className="text-xl font-display font-semibold text-rice-50">{items[0].title}</p>
          )}
          <p className="mt-2 text-sm text-rice-200/60">{items[0].time}</p>
        </div>
      )}

      <Panel>
        {items.length === 0 ? (
          <div className="py-12 text-center">
            <Newspaper className="h-12 w-12 mx-auto text-ink-600/30" />
            <p className="mt-3 text-sm text-ink-600/50">Loading financial news...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.slice(1).map((item, i) => (
              <div key={`${item.title}-${i}`}
                className="rounded-2xl border border-ink-900/5 bg-white p-4 flex items-start gap-4 transition hover-lift hover:border-jade-500/15"
              >
                <div className="mt-1 shrink-0">
                  <Globe className="h-4 w-4 text-ink-600/30" />
                </div>
                <div className="min-w-0 flex-1">
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-ink-900 hover:text-jade-600 transition">
                      {item.title} <ExternalLink className="h-3 w-3 ml-1 inline text-ink-600/30" />
                    </a>
                  ) : (
                    <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${catColors[item.category] || "text-ink-600 bg-ink-900/5"}`}>{item.category}</span>
                    <span className="text-xs text-ink-600/50">{item.source}</span>
                    <span className="text-xs text-ink-600/40">· {item.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
