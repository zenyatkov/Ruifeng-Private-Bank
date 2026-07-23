import { NextResponse } from "next/server";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";

// Public endpoint — no auth required. Returns all service settings.
// Client pages use this to check if services are enabled.
export async function GET() {
  try {
    const rows = await db.select().from(systemSettings);
    const settings: Record<string, string> = {};
    for (const r of rows) settings[r.key] = r.value;
    // Default all services to enabled if not set
    const defaults = {
      transfers_enabled: settings.transfers_enabled || "true",
      withdrawals_enabled: settings.withdrawals_enabled || "true",
      cards_enabled: settings.cards_enabled || "true",
      fx_enabled: settings.fx_enabled || "true",
      loans_enabled: settings.loans_enabled || "true",
      bills_enabled: settings.bills_enabled || "true",
    };
    return NextResponse.json({ settings: defaults });
  } catch (err) {
    console.error("Public settings GET error:", err);
    // Return defaults on error
    return NextResponse.json({ settings: {
      transfers_enabled: "true", withdrawals_enabled: "true", cards_enabled: "true",
      fx_enabled: "true", loans_enabled: "true", bills_enabled: "true",
    } });
  }
}
