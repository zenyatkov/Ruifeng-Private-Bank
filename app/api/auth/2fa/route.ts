import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import crypto from "crypto";

function generateSecret(): string {
  return crypto.randomBytes(20).toString("hex").slice(0, 32);
}

function base32Encode(hex: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes = Buffer.from(hex, "hex");
  let bits = ""; for (const b of bytes) bits += b.toString(2).padStart(8, "0");
  let result = ""; for (let i = 0; i < bits.length; i += 5) result += alphabet[parseInt(bits.slice(i, i + 5).padEnd(5, "0"), 2)];
  return result;
}

function generateTOTP(secret: string): string {
  const time = Math.floor(Date.now() / 30000);
  const buf = Buffer.alloc(8); buf.writeUInt32BE(time, 4);
  const hmac = crypto.createHmac("sha1", Buffer.from(secret, "hex")).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[offset] & 0x7f) << 24 | hmac[offset + 1] << 16 | hmac[offset + 2] << 8 | hmac[offset + 3]) % 1000000;
  return code.toString().padStart(6, "0");
}

// GET: get 2FA status and setup URI
export async function GET() {
  try {
    const { user, error } = await requireUser();
    if (!user) return NextResponse.json({ error }, { status: 401 });
    const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    return NextResponse.json({ enabled: row?.totpEnabled || false, hasSecret: !!row?.totpSecret });
  } catch (err) {
    console.error("2FA GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: setup 2FA
export async function POST() {
  try {
    const { user, error } = await requireUser();
    if (!user) return NextResponse.json({ error }, { status: 401 });
    const secret = generateSecret();
    const b32 = base32Encode(secret);
    await db.update(users).set({ totpSecret: secret }).where(eq(users.id, user.id));
    const uri = `otpauth://totp/RuiFeng:${user.email}?secret=${b32}&issuer=RuiFeng%20Bank&digits=6&period=30`;
    return NextResponse.json({ secret: b32, uri, manualKey: b32 });
  } catch (err) {
    console.error("2FA POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: verify and enable 2FA
export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireUser();
    if (!user) return NextResponse.json({ error }, { status: 401 });
    const body = await request.json();
    const code = String(body.code || "");
    const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    if (!row?.totpSecret) return NextResponse.json({ error: "Setup 2FA first" }, { status: 400 });
    const expected = generateTOTP(row.totpSecret);
    // Allow 1 time window tolerance
    const prevTime = Math.floor(Date.now() / 30000) - 1;
    const prevBuf = Buffer.alloc(8); prevBuf.writeUInt32BE(prevTime, 4);
    const prevHmac = crypto.createHmac("sha1", Buffer.from(row.totpSecret, "hex")).update(prevBuf).digest();
    const prevOff = prevHmac[prevHmac.length - 1] & 0xf;
    const prevCode = ((prevHmac[prevOff] & 0x7f) << 24 | prevHmac[prevOff + 1] << 16 | prevHmac[prevOff + 2] << 8 | prevHmac[prevOff + 3]) % 1000000;
    const prev = prevCode.toString().padStart(6, "0");

    if (code !== expected && code !== prev) return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    await db.update(users).set({ totpEnabled: true }).where(eq(users.id, user.id));
    return NextResponse.json({ ok: true, enabled: true });
  } catch (err) {
    console.error("2FA PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
