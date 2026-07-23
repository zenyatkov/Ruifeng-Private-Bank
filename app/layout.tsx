import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F1629",
};

export const metadata: Metadata = {
  title: {
    default: "瑞峯 RuiFeng Private Bank | Asia Pacific Wealth",
    template: "%s | 瑞峯 RuiFeng Private Bank",
  },
  description: "瑞峯 RuiFeng Private Bank — ultra-premium private banking across Asia. Multi-currency accounts, wealth management, FX, lending, cards, and concierge.",
  keywords: ["private banking", "Asia", "wealth management", "Singapore", "Hong Kong", "Tokyo", "multi-currency"],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: "瑞峯 RuiFeng Private Bank",
    description: "Premium private banking for Asia Pacific. Multi-currency, investments, lending, FX, cards.",
    siteName: "瑞峯 RuiFeng Private Bank",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
