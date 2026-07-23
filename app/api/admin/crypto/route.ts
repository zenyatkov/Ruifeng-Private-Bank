import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-log";

export async function POST(request: Request) {
  const { user, error } = await requireUser(["admin"]);
  if (!user) return NextResponse.json({ error }, { status: 401 });

  try {
    const body = await request.json();
    const userId = Number(body.userId);
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    // Verify user exists
    const [targetUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Build update - explicitly set each field
    const btc = body.btc !== undefined ? (String(body.btc).trim() || null) : undefined;
    const eth = body.eth !== undefined ? (String(body.eth).trim() || null) : undefined;
    const usdt = body.usdt !== undefined ? (String(body.usdt).trim() || null) : undefined;

    const updateFields: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
    if (btc !== undefined) updateFields.cryptoWalletBtc = btc;
    if (eth !== undefined) updateFields.cryptoWalletEth = eth;
    if (usdt !== undefined) updateFields.cryptoWalletUsdt = usdt;

    await db.update(users).set(updateFields).where(eq(users.id, userId));

    const assigned: string[] = [];
    if (btc) assigned.push(`BTC: ${btc}`);
    if (eth) assigned.push(`ETH: ${eth}`);
    if (usdt) assigned.push(`USDT: ${usdt}`);

    await logAdminAction({
      adminId: user.id, action: "crypto_wallet_assign", targetType: "user",
      targetId: userId, details: `Assigned to ${targetUser.email}: ${assigned.join(", ") || "cleared"}`,
    });

    await db.insert(notifications).values({
      userId, title: "Crypto wallets updated",
      body: `Your crypto funding wallets have been ${assigned.length > 0 ? "assigned" : "updated"}. ${assigned.join(" · ")}`,
      type: "success",
    });

    return NextResponse.json({ ok: true, assigned: assigned.length });
  } catch (err) {
    console.error("Crypto assign error:", err);
    return NextResponse.json({ error: "Failed to assign wallets" }, { status: 500 });
  }
}
