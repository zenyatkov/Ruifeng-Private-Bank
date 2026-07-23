export type SupportedLanguage = "en" | "zh-CN" | "zh-TW" | "ja" | "ko" | "hi" | "th" | "ms" | "id" | "vi" | "ar";
export type SupportedCurrency = "USD" | "SGD" | "HKD" | "JPY" | "CNY" | "KRW" | "INR" | "THB" | "MYR" | "IDR" | "PHP" | "VND" | "TWD" | "AUD" | "AED" | "EUR" | "GBP";

export const COUNTRY_CURRENCY: Record<string, SupportedCurrency> = {
  Singapore: "SGD", "Hong Kong": "HKD", Japan: "JPY", "South Korea": "KRW", China: "CNY",
  India: "INR", Thailand: "THB", Malaysia: "MYR", Indonesia: "IDR", Philippines: "PHP",
  Vietnam: "VND", Taiwan: "TWD", Australia: "AUD", "New Zealand": "AUD", "United Arab Emirates": "AED",
};
export const COUNTRY_LANGUAGE: Record<string, SupportedLanguage> = {
  Singapore: "en", "Hong Kong": "zh-TW", Japan: "ja", "South Korea": "ko", China: "zh-CN",
  India: "hi", Thailand: "th", Malaysia: "ms", Indonesia: "id", Philippines: "en",
  Vietnam: "vi", Taiwan: "zh-TW", Australia: "en", "New Zealand": "en", "United Arab Emirates": "ar",
};
export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: "English", "zh-CN": "简体中文", "zh-TW": "繁體中文", ja: "日本語", ko: "한국어",
  hi: "हिन्दी", th: "ไทย", ms: "Bahasa Melayu", id: "Bahasa Indonesia", vi: "Tiếng Việt", ar: "العربية",
};
export const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  USD: "US Dollar", SGD: "Singapore Dollar", HKD: "Hong Kong Dollar", JPY: "Japanese Yen",
  CNY: "Chinese Yuan", KRW: "South Korean Won", INR: "Indian Rupee", THB: "Thai Baht",
  MYR: "Malaysian Ringgit", IDR: "Indonesian Rupiah", PHP: "Philippine Peso", VND: "Vietnamese Dong",
  TWD: "Taiwan Dollar", AUD: "Australian Dollar", AED: "UAE Dirham", EUR: "Euro", GBP: "British Pound",
};

// Common core keys shared by all languages
const coreKeys = [
  "bankName", "bankSubtitle", "welcome", "signIn", "signOut",
  "dashboard", "accounts", "transfers", "cards", "investments",
  "lending", "fxDesk", "beneficiaries", "concierge", "profile",
  "settings", "admin", "overview", "openAccount",
  "newTransfer", "totalWealth", "cashBalances", "activeLoans",
  "privateBanking", "commandCenter", "recentActivity",
  "notifications", "clientSince", "secureSession",
  "billPayments", "cryptoFunding", "news", "receipts",
  "amount", "submit", "cancel", "save", "close", "loading",
  "pending", "completed", "active", "blocked",
  "fromAccount", "toAccount", "reference",
  "balance", "currency", "language", "search",
  "apply", "buy", "sell", "confirm", "date",
  "status", "type", "details", "total", "fee",
  "fundCard", "viewReceipt", "manageCard",
  "loanDue", "monthlyPayment", "autoDebit",
  "cardNumber", "cvv", "expiry", "cardholder",
  "recurringPayments", "statements", "security",
];

// Extended keys for i18n coverage
const extendedKeys = [
  "payUtilities", "payBill", "biller", "selectBiller", "paymentHistory", "noBillPayments",
  "downloadStatements", "generateStatement", "selectAccount", "month",
  "previewStatement", "preview", "selectAccountAndMonth", "thenPreview", "noTransactionsThisMonth",
  "priorityAlerts", "youreAllCaughtUp", "noUnreadNotifications",
  "noAccountsYet", "multiCurrencyAccount",
  "processingPayment", "verifyingWith", "paymentSubmitted", "pendingConfirmation",
  "noPositions", "buyPositions", "holdings", "portfolioMTM", "totalPL", "positions",
  "marketBoard", "authorizePurchase", "fundFrom", "quantity", "totalCost", "insufficientFunds", "executing",
  "noReceiptsYet", "receipt", "digitalReceipt", "backToReceipts",
  "transferServices", "internalExternal", "withdrawals",
  "cardServices", "currencyConversion",
  "lendingServices", "loanApplications", "utilityBillPayment",
  "online", "offline", "serviceDownMessage", "maintenanceDescription",
  "alternativeCryptoFunding", "directedToCrypto",
  "sendBroadcast", "notifyAllUsers", "kycQueue", "reviewVerifications",
  "approveTransfers", "cardApprovals", "platformMetrics", "auditTrail",
  "noActivity", "noActivityYet", "viewAccounts", "accountActivity",
  "transactionReceiptsAppearHere", "category",
];

// Full site-wide translations

// Import per-language translations (splits large object for Turbopack compatibility)
import { translations as en } from "./i18n/en";
import { translations as zh_CN } from "./i18n/zh-CN";
import { translations as zh_TW } from "./i18n/zh-TW";
import { translations as ja } from "./i18n/ja";
import { translations as ko } from "./i18n/ko";
import { translations as hi } from "./i18n/hi";
import { translations as th } from "./i18n/th";
import { translations as ms } from "./i18n/ms";
import { translations as id } from "./i18n/id";
import { translations as vi } from "./i18n/vi";
import { translations as ar } from "./i18n/ar";

// Full site-wide translations (composed from per-language files)
const T: Record<SupportedLanguage, Record<string, string>> = {
  "en": en,
  "zh-CN": zh_CN,
  "zh-TW": zh_TW,
  "ja": ja,
  "ko": ko,
  "hi": hi,
  "th": th,
  "ms": ms,
  "id": id,
  "vi": vi,
  "ar": ar,
};


export function t(lang: string, key: string): string {
  const l = (lang || "en") as SupportedLanguage;
  return T[l]?.[key] || T.en[key] || key;
}

export function getDefaultCurrency(country: string): SupportedCurrency { return COUNTRY_CURRENCY[country] || "USD"; }
export function getDefaultLanguage(country: string): SupportedLanguage { return COUNTRY_LANGUAGE[country] || "en"; }

export function fmtCurrency(amount: string | number | null | undefined, currency: string, lang: string) {
  const value = typeof amount === "string" ? parseFloat(amount) : amount ?? 0;
  const localeMap: Record<string, string> = { en:"en-SG","zh-CN":"zh-CN","zh-TW":"zh-TW",ja:"ja-JP",ko:"ko-KR",hi:"en-IN",th:"th-TH",ms:"ms-MY",id:"id-ID",vi:"vi-VN",ar:"ar-AE" };
  return new Intl.NumberFormat(localeMap[lang] || "en-SG", {
    style: "currency", currency,
    minimumFractionDigits: ["JPY","KRW","VND","IDR"].includes(currency) ? 0 : 2,
    maximumFractionDigits: ["JPY","KRW","VND","IDR"].includes(currency) ? 0 : 2,
  }).format(Number.isFinite(value) ? value : 0);
}

