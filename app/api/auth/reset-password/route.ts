import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { sendEmail, resetPasswordEmailHtml } from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) return NextResponse.json({ ok: true, message: "If an account exists, a reset link has been sent." });

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 30 * 60 * 1000);
  await db.update(users).set({ passwordResetToken: token, passwordResetExpiry: expiry }).where(eq(users.id, user.id));

  await sendEmail(email, "瑞峯 RuiFeng — Password Reset", resetPasswordEmailHtml(token));

  return NextResponse.json({ ok: true, message: "If an account exists, a reset link has been sent." });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const token = String(body.token || "");
  const newPassword = String(body.newPassword || "");
  if (!token || newPassword.length < 8) return NextResponse.json({ error: "Valid token and password (8+ chars) required" }, { status: 400 });

  const [user] = await db.select().from(users).where(eq(users.passwordResetToken, token)).limit(1);
  if (!user) return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
  if (user.passwordResetExpiry && user.passwordResetExpiry < new Date()) return NextResponse.json({ error: "Reset link expired" }, { status: 400 });

  const hash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash: hash, passwordResetToken: null, passwordResetExpiry: null, updatedAt: new Date() }).where(eq(users.id, user.id));
  return NextResponse.json({ ok: true });
}
