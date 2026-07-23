import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, requireUser, verifyPassword } from "@/lib/auth";

// GET: check if user has set a PIN
export async function GET() {
  try {
    const { user, error } = await requireUser();
    if (!user) return NextResponse.json({ error }, { status: 401 });
    const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    return NextResponse.json({ hasPin: !!row?.transactionPin });
  } catch (err) {
    console.error("PIN GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: set or update PIN
export async function POST(request: Request) {
  try {
    const { user, error } = await requireUser();
    if (!user) return NextResponse.json({ error }, { status: 401 });
    const body = await request.json();
    const pin = String(body.pin || "").trim();
    if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be 4-6 digits" }, { status: 400 });
    }
    const hashed = await hashPassword(pin);
    await db.update(users).set({ transactionPin: hashed, updatedAt: new Date() }).where(eq(users.id, user.id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PIN POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: verify PIN
export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireUser();
    if (!user) return NextResponse.json({ error }, { status: 401 });
    const body = await request.json();
    const pin = String(body.pin || "");
    const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    if (!row?.transactionPin) {
      return NextResponse.json({ valid: true, noPinSet: true });
    }
    const valid = await verifyPassword(pin, row.transactionPin);
    if (!valid) return NextResponse.json({ valid: false, error: "Invalid PIN" }, { status: 403 });
    return NextResponse.json({ valid: true });
  } catch (err) {
    console.error("PIN PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
