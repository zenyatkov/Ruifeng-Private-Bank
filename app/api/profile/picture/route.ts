import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });
  const body = await request.json();
  const picture = String(body.picture || "");
  if (!picture) return NextResponse.json({ error: "Picture data required" }, { status: 400 });
  // Store as base64 data URL
  await db.update(users).set({ profilePicture: picture, updatedAt: new Date() }).where(eq(users.id, user.id));
  return NextResponse.json({ ok: true });
}
