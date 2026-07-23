import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-log";

export async function GET() {
  const rows = await db.select().from(systemSettings);
  const settings: Record<string, string> = {};
  for (const r of rows) settings[r.key] = r.value;
  return NextResponse.json({ settings });
}

export async function POST(request: Request) {
  const { user, error } = await requireUser(["admin"]);
  if (!user) return NextResponse.json({ error }, { status: 401 });
  const body = await request.json();
  const key = String(body.key);
  const value = String(body.value);

  const [existing] = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
  if (existing) {
    await db.update(systemSettings).set({ value, updatedAt: new Date() }).where(eq(systemSettings.key, key));
  } else {
    await db.insert(systemSettings).values({ key, value });
  }

  await logAdminAction({ adminId: user.id, action: "setting_change", targetType: "system", details: `${key} = ${value}` });
  return NextResponse.json({ ok: true });
}
