import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";

// GET user's assigned crypto wallets
export async function GET() {
  try {
    const { user, error } = await requireUser();
    if (!user) return NextResponse.json({ error }, { status: 401 });
    const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    return NextResponse.json({
      wallets: {
        BTC: row?.cryptoWalletBtc || null,
        ETH: row?.cryptoWalletEth || null,
        USDT: row?.cryptoWalletUsdt || null,
      },
    });
  } catch (err) {
    console.error("Crypto GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
