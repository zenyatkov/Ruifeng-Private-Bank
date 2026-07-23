import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { beneficiaries } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const { user, error } = await requireUser();
  if (!user) {
    return NextResponse.json({ error }, { status: error === "Forbidden" ? 403 : 401 });
  }

  const rows =
    user.role === "admin"
      ? await db.select().from(beneficiaries).orderBy(desc(beneficiaries.createdAt))
      : await db
          .select()
          .from(beneficiaries)
          .where(eq(beneficiaries.userId, user.id))
          .orderBy(desc(beneficiaries.createdAt));

  return NextResponse.json({ beneficiaries: rows });
}

export async function POST(request: Request) {
  const { user, error } = await requireUser(["client", "admin"]);
  if (!user) {
    return NextResponse.json({ error }, { status: error === "Forbidden" ? 403 : 401 });
  }

  const body = await request.json();
  const name = String(body.name || "").trim();
  const bankName = String(body.bankName || "").trim();
  const accountNumber = String(body.accountNumber || "").trim();
  if (!name || !bankName || !accountNumber) {
    return NextResponse.json({ error: "Name, bank and account number are required" }, { status: 400 });
  }

  const [row] = await db
    .insert(beneficiaries)
    .values({
      userId: user.id,
      name,
      bankName,
      accountNumber,
      swiftCode: body.swiftCode ? String(body.swiftCode) : null,
      currency: String(body.currency || "USD").toUpperCase(),
      country: body.country ? String(body.country) : null,
      nickname: body.nickname ? String(body.nickname) : null,
      status: "active",
    })
    .returning();

  return NextResponse.json({ beneficiary: row }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { user, error } = await requireUser(["client", "admin"]);
  if (!user) {
    return NextResponse.json({ error }, { status: error === "Forbidden" ? 403 : 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const [row] = await db.select().from(beneficiaries).where(eq(beneficiaries.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role !== "admin" && row.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(beneficiaries).where(eq(beneficiaries.id, id));
  return NextResponse.json({ ok: true });
}
