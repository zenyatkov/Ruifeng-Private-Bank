import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const { user, error } = await requireUser();
    if (!user) return NextResponse.json({ error }, { status: 401 });
    const rows = await db.select().from(receipts).where(eq(receipts.userId, user.id)).orderBy(desc(receipts.createdAt)).limit(50);
    return NextResponse.json({ receipts: rows });
  } catch (err) {
    console.error("Receipts API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireUser();
    if (!user) return NextResponse.json({ error }, { status: 401 });
    const body = await request.json();
    const [row] = await db.insert(receipts).values({
      userId: user.id,
      transactionId: body.transactionId || null,
      type: String(body.type || "transfer"),
      data: body.data || {},
    }).returning();
    return NextResponse.json({ receipt: row }, { status: 201 });
  } catch (err) {
    console.error("Receipts POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
