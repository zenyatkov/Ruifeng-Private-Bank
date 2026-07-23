import { NextResponse } from "next/server";

// Base instruments with static data that gets updated with live prices
const BASE_INSTRUMENTS = [
  { symbol: "RFGF", name: "瑞峯 Asia Growth Fund", assetClass: "Equities", basePrice: 48.75, currency: "USD", region: "Asia Pacific" },
  { symbol: "2800.HK", name: "Tracker Fund HK", assetClass: "ETF", basePrice: 18.92, currency: "HKD", region: "Hong Kong" },
  { symbol: "1321.T", name: "Nikkei 225 ETF", assetClass: "ETF", basePrice: 38500, currency: "JPY", region: "Japan" },
  { symbol: "SGS32", name: "SG Gov Bond 2032", assetClass: "Fixed Income", basePrice: 99.45, currency: "SGD", region: "Singapore" },
  { symbol: "NIFTY50", name: "Nifty 50 India ETF", assetClass: "ETF", basePrice: 2450, currency: "INR", region: "India" },
  { symbol: "KOSPI", name: "KOSPI 200 ETF", assetClass: "ETF", basePrice: 34200, currency: "KRW", region: "South Korea" },
  { symbol: "CSI300", name: "CSI 300 China", assetClass: "ETF", basePrice: 4.12, currency: "USD", region: "China" },
  { symbol: "PC-ASIA", name: "Private Credit Asia", assetClass: "Alternatives", basePrice: 1085.50, currency: "USD", region: "Asia Pacific" },
  { symbol: "XAU", name: "Gold Bullion", assetClass: "Commodities", basePrice: 2340, currency: "USD", region: "Global" },
  { symbol: "SG-REIT", name: "SG REIT Index", assetClass: "Real Estate", basePrice: 0.985, currency: "SGD", region: "Singapore" },
  { symbol: "ASEAN-BD", name: "ASEAN Bond Fund", assetClass: "Fixed Income", basePrice: 102.30, currency: "USD", region: "ASEAN" },
  { symbol: "JP-DIV", name: "Japan Dividend Fund", assetClass: "Equities", basePrice: 15600, currency: "JPY", region: "Japan" },
  { symbol: "DBS.SG", name: "DBS Group Holdings", assetClass: "Equities", basePrice: 38.50, currency: "SGD", region: "Singapore" },
  { symbol: "700.HK", name: "Tencent Holdings", assetClass: "Equities", basePrice: 380.60, currency: "HKD", region: "Hong Kong" },
  { symbol: "9984.T", name: "SoftBank Group", assetClass: "Equities", basePrice: 8950, currency: "JPY", region: "Japan" },
  { symbol: "RELIANCE", name: "Reliance Industries", assetClass: "Equities", basePrice: 2890, currency: "INR", region: "India" },
  { symbol: "005930.KS", name: "Samsung Electronics", assetClass: "Equities", basePrice: 72500, currency: "KRW", region: "South Korea" },
  { symbol: "BABA", name: "Alibaba Group", assetClass: "Equities", basePrice: 88.20, currency: "USD", region: "China" },
  { symbol: "9988.HK", name: "Alibaba (HK)", assetClass: "Equities", basePrice: 89.45, currency: "HKD", region: "Hong Kong" },
  { symbol: "TSMC", name: "Taiwan Semiconductor", assetClass: "Equities", basePrice: 178.50, currency: "USD", region: "Taiwan" },
  { symbol: "BTC-ETF", name: "Bitcoin ETF Asia", assetClass: "Crypto ETF", basePrice: 62.40, currency: "USD", region: "Global" },
  { symbol: "ETH-ETF", name: "Ethereum ETF Asia", assetClass: "Crypto ETF", basePrice: 32.10, currency: "USD", region: "Global" },
  { symbol: "GRAB", name: "Grab Holdings", assetClass: "Equities", basePrice: 3.85, currency: "USD", region: "ASEAN" },
  { symbol: "SEA", name: "Sea Limited", assetClass: "Equities", basePrice: 72.30, currency: "USD", region: "ASEAN" },
];

// Cache market data
let cachedMarket: Array<{ symbol: string; name: string; assetClass: string; price: number; currency: string; region: string; change: number }> | null = null;
let lastFetch = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute

function simulateLivePrice(basePrice: number, symbol: string): { price: number; change: number } {
  // Generate realistic-looking price movements based on time
  const now = Date.now();
  const minuteOffset = (now / 60000) % 1000;
  
  // Different volatility per asset class
  let volatility: number;
  const instr = BASE_INSTRUMENTS.find(i => i.symbol === symbol);
  if (instr?.assetClass === "Fixed Income") volatility = 0.002;
  else if (instr?.assetClass === "Crypto ETF") volatility = 0.08;
  else if (instr?.currency === "JPY" || instr?.currency === "KRW") volatility = 0.015;
  else volatility = 0.03;
  
  // Use deterministic noise based on time so prices are consistent across requests in same minute
  const seed = minuteOffset * 13 + symbol.length * 7;
  const pseudoRandom = ((Math.sin(seed) + 1) / 2); // 0-1 range
  
  const changePercent = (pseudoRandom - 0.5) * volatility * 2;
  const price = basePrice * (1 + changePercent / 100);
  
  return { price: Math.round(price * 10000) / 10000, change: Math.round(changePercent * 100) / 100 };
}

async function fetchYahooPrices(): Promise<Record<string, { price: number; change: number }>> {
  try {
    // Try fetching from Yahoo Finance for major stocks
    const symbols = ["DBS.SG", "700.HK", "9984.T", "RELIANCE.NS", "005930.KS", "BABA", "TSM", "GRAB", "SE"];
    const query = symbols.join(",");
    const response = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${query}`,
      { signal: AbortSignal.timeout(5000), headers: { "User-Agent": "Mozilla/5.0" } }
    );
    if (!response.ok) return {};
    const data = await response.json();
    const result: Record<string, { price: number; change: number }> = {};
    if (data.quoteResponse?.result) {
      for (const q of data.quoteResponse.result) {
        if (q.regularMarketPrice && q.regularMarketChangePercent) {
          // Map Yahoo symbols back to our symbols
          const yahooToOur: Record<string, string> = {
            "DBS.SI": "DBS.SG", "0700.HK": "700.HK", "9984.T": "9984.T",
            "RELIANCE.NS": "RELIANCE", "005930.KS": "005930.KS", "BABA": "BABA",
            "TSM": "TSMC", "GRAB": "GRAB", "SE": "SEA",
          };
          const ourSymbol = yahooToOur[q.symbol] || q.symbol;
          result[ourSymbol] = { price: q.regularMarketPrice, change: Math.round(q.regularMarketChangePercent * 100) / 100 };
        }
      }
    }
    return result;
  } catch {
    return {};
  }
}

export async function GET() {
  try {
    const now = Date.now();
    if (cachedMarket && now - lastFetch < CACHE_DURATION) {
      return NextResponse.json({ instruments: cachedMarket, live: false });
    }

    // Try fetching live prices from Yahoo Finance
    const yahooPrices = await fetchYahooPrices();
    const hasLive = Object.keys(yahooPrices).length > 0;

    // Build final instruments list with live or simulated prices
    const instruments = BASE_INSTRUMENTS.map(inst => {
      if (yahooPrices[inst.symbol]) {
        return { ...inst, price: yahooPrices[inst.symbol].price, change: yahooPrices[inst.symbol].change };
      }
      const sim = simulateLivePrice(inst.basePrice, inst.symbol);
      return { ...inst, price: sim.price, change: sim.change };
    });

    cachedMarket = instruments;
    lastFetch = now;

    return NextResponse.json({ instruments, live: hasLive });
  } catch (err) {
    console.error("Market API error:", err);
    // Fallback to simulated prices
    const instruments = BASE_INSTRUMENTS.map(inst => {
      const sim = simulateLivePrice(inst.basePrice, inst.symbol);
      return { ...inst, price: sim.price, change: sim.change };
    });
    return NextResponse.json({ instruments, live: false });
  }
}
