import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(
  amount: string | number | null | undefined,
  currency = "USD",
  locale = "en-SG"
) {
  const value = typeof amount === "string" ? parseFloat(amount) : amount ?? 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function generateAccountNumber(prefix = "88") {
  const mid = Math.floor(10000000 + Math.random() * 89999999).toString();
  const check = Math.floor(10 + Math.random() * 89).toString();
  return `${prefix}${mid}${check}`;
}

export function generateReference(prefix = "AXB") {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

export function generateLoanNumber() {
  return `LN${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
}

export function maskCardNumber() {
  const last4 = Math.floor(1000 + Math.random() * 9000);
  return `•••• •••• •••• ${last4}`;
}

export function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export const ASIAN_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
] as const;

export const ASIAN_COUNTRIES = [
  "Singapore",
  "Hong Kong",
  "Japan",
  "South Korea",
  "China",
  "India",
  "Thailand",
  "Malaysia",
  "Indonesia",
  "Philippines",
  "Vietnam",
  "Taiwan",
  "Australia",
  "New Zealand",
  "United Arab Emirates",
  "United States",
  "Canada",
  "United Kingdom",
] as const;

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: "Current Account",
  savings: "Savings Account",
  private_wealth: "Private Wealth",
  multi_currency: "Multi-Currency",
  fixed_deposit: "Fixed Deposit",
};

export const CLIENT_TIERS = ["Private", "Priority", "Prestige", "Ultra High Net Worth"] as const;
