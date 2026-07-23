"use client";

import { useEffect, useState } from "react";
import { RefreshCw, TrendingUp, Globe } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui";

const NEWS_ITEMS = [
  { title: "Asian markets rally on US rate cut expectations", source: "Reuters Asia", category: "Markets", time: "2 min ago" },
  { title: "Singapore dollar strengthens against USD amid strong GDP data", source: "Bloomberg", category: "FX", time: "5 min ago" },
  { title: "Bank of Japan holds rates steady, yen weakens", source: "Nikkei Asia", category: "Central Banks", time: "8 min ago" },
  { title: "Hong Kong IPO market sees biggest listing in 3 years", source: "SCMP", category: "IPO", time: "12 min ago" },
  { title: "India's Sensex hits record high on tech sector gains", source: "Economic Times", category: "Markets", time: "15 min ago" },
  { title: "PBOC cuts reserve ratio to boost China economy", source: "Xinhua", category: "Central Banks", time: "18 min ago" },
  { title: "Korean chipmakers surge on AI demand forecasts", source: "Korea Herald", category: "Tech", time: "22 min ago" },
  { title: "Gold prices hit new high as geopolitical tensions rise", source: "Reuters", category: "Commodities", time: "25 min ago" },
  { title: "Southeast Asian economies outperform global growth", source: "ADB", category: "Economy", time: "30 min ago" },
  { title: "Private banking AUM in Asia surpasses $5 trillion milestone", source: "Asian Banker", category: "Wealth", time: "35 min ago" },
  { title: "Thailand approves digital banking licenses for 3 fintech firms", source: "Bangkok Post", category: "Regulation", time: "40 min ago" },
  { title: "Vietnam's VN-Index gains 2.3% on foreign inflows", source: "VnExpress", category: "Markets", time: "45 min ago" },
  { title: "Australian dollar rises on strong employment data", source: "AFR", category: "FX", time: "48 min ago" },
  { title: "UAE sovereign wealth fund increases Asia Pacific allocation", source: "Gulf News", category: "Investments", time: "52 min ago" },
  { title: "Cryptocurrency regulations tighten across ASEAN nations", source: "CoinDesk Asia", category: "Crypto", time: "55 min ago" },
];

export default function NewsPage() {
  const [items, setItems] = useState(NEWS_ITEMS);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshing(true);
      setTimeout(() => {
        setItems(prev => {
          const shuffled = [...prev];
          // Rotate and randomize times
          const first = shuffled.shift()!;
          first.time = "Just now";
          shuffled.push(first);
          shuffled.forEach((item, i) => {
            if (i < shuffled.length - 1) item.time = `${(i + 1) * 3} min ago`;
          });
          return [...shuffled];
        });
        setRefreshing(false);
      }, 500);
    }, 15000);
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
      <PageHeader title="Financial News · 财经新闻" subtitle="Live Asia-Pacific financial news. Auto-refreshes every 15 seconds."
        actions={<div className="flex items-center gap-2 text-xs text-ink-600/60"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-jade-500" : ""}`} /><span>Live</span><span className="h-2 w-2 rounded-full bg-jade-500 animate-pulse-jade" /></div>} />
      <Panel>
        <div className="space-y-1">
          {items.map((item, i) => (
            <div key={i} className={`rounded-xl p-4 flex items-start gap-4 transition ${i === 0 ? "bg-jade-500/5 border border-jade-500/15" : "hover:bg-rice-50"}`}>
              <div className="mt-1 shrink-0">{i === 0 ? <TrendingUp className="h-5 w-5 text-jade-600" /> : <Globe className="h-4 w-4 text-ink-600/30" />}</div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold text-ink-900 ${i === 0 ? "text-base" : ""}`}>{item.title}</p>
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${catColors[item.category] || "text-ink-600 bg-ink-900/5"}`}>{item.category}</span>
                  <span className="text-xs text-ink-600/50">{item.source}</span>
                  <span className="text-xs text-ink-600/40">· {item.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
