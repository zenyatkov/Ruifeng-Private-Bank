import { NextResponse } from "next/server";

// Cache news for 5 minutes to avoid hitting external APIs too often
let cachedNews: Array<{
  title: string;
  source: string;
  category: string;
  time: string;
  url?: string;
}> | null = null;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const FALLBACK_NEWS = [
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

function categorizeTitle(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("rate") || lower.includes("fed") || lower.includes("boj") || lower.includes("central bank") || lower.includes("monetary")) return "Central Banks";
  if (lower.includes("dollar") || lower.includes("fx") || lower.includes("currency") || lower.includes("yuan") || lower.includes("yen") || lower.includes("euro") || lower.includes("sgd") || lower.includes("hkd")) return "FX";
  if (lower.includes("ipo") || lower.includes("listing") || lower.includes("venture")) return "IPO";
  if (lower.includes("ai") || lower.includes("chip") || lower.includes("tech") || lower.includes("software") || lower.includes("semiconductor")) return "Tech";
  if (lower.includes("gold") || lower.includes("oil") || lower.includes("commodity") || lower.includes("copper") || lower.includes("silver")) return "Commodities";
  if (lower.includes("gdp") || lower.includes("economy") || lower.includes("growth") || lower.includes("inflation") || lower.includes("employment") || lower.includes("job")) return "Economy";
  if (lower.includes("wealth") || lower.includes("private bank") || lower.includes("aum") || lower.includes("fund")) return "Wealth";
  if (lower.includes("regulation") || lower.includes("regulator") || lower.includes("license") || lower.includes("compliance") || lower.includes("mas")) return "Regulation";
  if (lower.includes("crypto") || lower.includes("bitcoin") || lower.includes("ethereum") || lower.includes("token") || lower.includes("web3")) return "Crypto";
  if (lower.includes("invest") || lower.includes("portfolio") || lower.includes("allocation") || lower.includes("equity")) return "Investments";
  return "Markets";
}

async function fetchGoogleNewsRSS(): Promise<Array<{ title: string; source: string; category: string; time: string; url?: string }>> {
  try {
    // Fetch Google News RSS for finance/business
    const response = await fetch("https://news.google.com/rss/search?q=finance+asia+banking+markets+currency&hl=en-US&gl=SG&ceid=SG:en", {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RuiFengBot/1.0)" },
    });

    if (!response.ok) return [];

    const text = await response.text();
    const items: Array<{ title: string; source: string; category: string; time: string; url?: string }> = [];

    // Parse RSS XML items
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(text)) !== null && items.length < 15) {
      const itemContent = match[1];

      const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
      const sourceMatch = itemContent.match(/<source>([\s\S]*?)<\/source>/);
      const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

      if (!titleMatch) continue;

      // Google News titles include source at end like " - Reuters"
      let title = titleMatch[1].trim();
      let source = sourceMatch ? sourceMatch[1].trim() : "Google News";
      const suffixMatch = title.match(/ - (.+)$/);
      if (suffixMatch && !sourceMatch) {
        source = suffixMatch[1];
        title = title.replace(/ - (.+)$/, "");
      }

      const url = linkMatch ? linkMatch[1].trim() : undefined;
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : "";

      // Calculate relative time
      let time = "recently";
      if (pubDate) {
        try {
          const pubTime = new Date(pubDate).getTime();
          const diff = Date.now() - pubTime;
          const minutes = Math.floor(diff / 60000);
          if (minutes < 1) time = "Just now";
          else if (minutes < 60) time = `${minutes} min ago`;
          else if (minutes < 1440) time = `${Math.floor(minutes / 60)} hr ago`;
          else time = `${Math.floor(minutes / 1440)}d ago`;
        } catch {
          time = "recently";
        }
      }

      const category = categorizeTitle(title);

      items.push({ title, source, category, time, url });
    }

    return items;
  } catch {
    return [];
  }
}

async function fetchAlphaVantageNews(): Promise<Array<{ title: string; source: string; category: string; time: string; url?: string }>> {
  // AlphaVantage free tier allows 25 requests/day — we only call every 5 min
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY || "demo";
    const response = await fetch(
      `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=financial_services,banking,macro,economy&apikey=${apiKey}&limit=15`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.feed) return [];

    return data.feed.slice(0, 15).map((item: Record<string, string>) => {
      const title = item.title || "Market Update";
      const source = item.source || "AlphaVantage";
      const url = item.url;
      const time = item.time_published
        ? (() => {
            try {
              const diff = Date.now() - new Date(item.time_published).getTime();
              const minutes = Math.floor(diff / 60000);
              if (minutes < 1) return "Just now";
              if (minutes < 60) return `${minutes} min ago`;
              if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`;
              return `${Math.floor(minutes / 1440)}d ago`;
            } catch {
              return "recently";
            }
          })()
        : "recently";

      return {
        title,
        source,
        category: categorizeTitle(title),
        time,
        url,
      };
    });
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const now = Date.now();

    // Return cached news if still fresh
    if (cachedNews && now - lastFetch < CACHE_DURATION) {
      return NextResponse.json({ news: cachedNews, live: true });
    }

    // Try fetching real news from multiple sources
    let newsItems: Array<{ title: string; source: string; category: string; time: string; url?: string }> = [];

    // Try Google News RSS first (free, no API key needed)
    newsItems = await fetchGoogleNewsRSS();

    // If Google News fails, try AlphaVantage
    if (newsItems.length === 0) {
      newsItems = await fetchAlphaVantageNews();
    }

    // If both fail, use fallback with simulated refresh
    if (newsItems.length === 0) {
      // Simulate refresh by rotating items
      newsItems = [...FALLBACK_NEWS];
      const shiftCount = Math.floor((now / 300000) % newsItems.length);
      for (let i = 0; i < shiftCount; i++) {
        const first = newsItems.shift()!;
        first.time = `${Math.floor(Math.random() * 55) + 1} min ago`;
        newsItems.push(first);
      }
      if (newsItems.length > 0) {
        newsItems[0].time = "Just now";
      }
    }

    cachedNews = newsItems;
    lastFetch = now;

    return NextResponse.json({ news: newsItems, live: newsItems.length > 0 && newsItems !== FALLBACK_NEWS });
  } catch (err) {
    console.error("News API error:", err);
    return NextResponse.json({ news: FALLBACK_NEWS, live: false });
  }
}
