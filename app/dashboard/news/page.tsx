"use client";

import { useEffect, useState } from "react";
import { RefreshCw, TrendingUp, Globe, ExternalLink } from "lucide-react";
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

  async function fetchNews() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/news");
      const data = await res.json();
      if (data.news && data.news.length > 0) {
        setItems(data.news);
        setLive(data.live === true);
      }
    } catch {
      // Keep existing items on fetch failure
    }
    setRefreshing(false);
  }

  // Initial fetch
  useEffect(() => { fetchNews(); }, []);

  // Auto-refresh every 30 seconds for live feed, every 15 seconds for simulated
  useEffect(() => {
    const interval = setInterval(fetchNews, live ? 30000 : 15000);
    return () => clearInterval(interval);
  }, [live]);

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
        subtitle={live ? "Live Asia-Pacific financial news. Auto-refreshes every 30s." : "Asia-Pacific financial news. Auto-refreshes every 15s."}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={fetchNews}
              className="flex items-center gap-2 text-xs text-ink-600/60 hover:text-jade-600 transition"
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-jade-500" : ""}`} />
              Refresh
            </button>
            <div className="flex items-center gap-2 text-xs text-ink-600/60">
              {live && <span className="h-2 w-2 rounded-full bg-jade-500 animate-pulse-jade" />}
              <span>{live ? "Live" : "Simulated"}</span>
            </div>
          </div>
        }
      />
      <Panel>
        {items.length === 0 ? (
          <div className="py-8 text-center text-sm text-ink-600/50">Loading financial news...</div>
        ) : (
          <div className="space-y-1">
            {items.map((item, i) => (
              <div
                key={`${item.title}-${i}`}
                className={`rounded-xl p-4 flex items-start gap-4 transition ${i === 0 ? "bg-jade-500/5 border border-jade-500/15" : "hover:bg-rice-50"}`}
              >
                <div className="mt-1 shrink-0">
                  {i === 0 ? <TrendingUp className="h-5 w-5 text-jade-600" /> : <Globe className="h-4 w-4 text-ink-600/30" />}
                </div>
                <div className="min-w-0 flex-1">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-sm font-semibold text-ink-900 hover:text-jade-600 transition ${i === 0 ? "text-base" : ""}`}
                    >
                      {item.title}
                      <ExternalLink className="h-3 w-3 ml-1 inline text-ink-600/30" />
                    </a>
                  ) : (
                    <p className={`text-sm font-semibold text-ink-900 ${i === 0 ? "text-base" : ""}`}>{item.title}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${catColors[item.category] || "text-ink-600 bg-ink-900/5"}`}>{item.category}</span>
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
