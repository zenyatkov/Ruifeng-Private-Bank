import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, notifications, users } from "@/db/schema";
import { hashPassword, requireUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-log";
import { generateAccountNumber } from "@/lib/utils";

export async function GET() {
  try {
    const { user, error } = await requireUser(["admin", "relationship_manager"]);
    if (!user) {
      return NextResponse.json({ error }, { status: error === "Forbidden" ? 403 : 401 });
    }

    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        role: users.role,
        country: users.country,
        city: users.city,
        nationality: users.nationality,
        kycStatus: users.kycStatus,
        clientTier: users.clientTier,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        relationshipManagerId: users.relationshipManagerId,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return NextResponse.json({ users: rows });
  } catch (err) {
    console.error("Admin users GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireUser(["admin"]);
    if (!user) {
      return NextResponse.json({ error }, { status: error === "Forbidden" ? 403 : 401 });
    }

    const body = await request.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const password = String(body.password || "Password123!");
    const role = body.role || "client";

    if (!email || !firstName || !lastName) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const [created] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        firstName,
        lastName,
        phone: body.phone ? String(body.phone) : null,
        role,
        country: body.country || "Singapore",
        city: body.city || null,
        nationality: body.nationality || body.country || "Singapore",
        kycStatus: body.kycStatus || "pending",
        clientTier: body.clientTier || "Private",
        isActive: true,
        relationshipManagerId: body.relationshipManagerId ? Number(body.relationshipManagerId) : null,
      })
      .returning();

    if (role === "client") {
      const accountNumber = generateAccountNumber();
      await db.insert(accounts).values({
        userId: created.id,
        accountNumber,
        iban: `SG89RFPB${accountNumber}`,
        type: "private_wealth",
        currency: "USD",
        balance: "0.00",
        availableBalance: "0.00",
        status: "active",
        nickname: "Private Wealth",
        interestRate: "1.250",
      });
    }

    await logAdminAction({
      adminId: user.id,
      action: "user_create",
      targetType: "user",
      targetId: created.id,
      details: `Created ${role} ${email}`,
    });

    return NextResponse.json({ user: created }, { status: 201 });
  } catch (err) {
    console.error("Admin users POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireUser(["admin"]);
    if (!user) {
      return NextResponse.json({ error }, { status: error === "Forbidden" ? 403 : 401 });
    }

    const body = await request.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "User id required" }, { status: 400 });

    const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const updates: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
    if (body.firstName !== undefined) updates.firstName = String(body.firstName);
    if (body.lastName !== undefined) updates.lastName = String(body.lastName);
    if (body.phone !== undefined) updates.phone = String(body.phone);
    if (body.role !== undefined) updates.role = body.role;
    if (body.country !== undefined) updates.country = String(body.country);
    if (body.city !== undefined) updates.city = String(body.city);
    if (body.kycStatus !== undefined) updates.kycStatus = body.kycStatus;
    if (body.clientTier !== undefined) updates.clientTier = String(body.clientTier);
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);
    if (body.relationshipManagerId !== undefined) {
      updates.relationshipManagerId = body.relationshipManagerId ? Number(body.relationshipManagerId) : null;
    }
    if (body.password) {
      updates.passwordHash = await hashPassword(String(body.password));
    }

    const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();

    await logAdminAction({
      adminId: user.id,
      action: "user_update",
      targetType: "user",
      targetId: id,
      details: `Updated user ${existing.email}: ${JSON.stringify(body)}`,
    });

    if (body.kycStatus && body.kycStatus !== existing.kycStatus) {
      await db.insert(notifications).values({
        userId: id,
        title: "KYC status updated",
        body: `Your verification status is now ${body.kycStatus}.`,
        type: body.kycStatus === "verified" ? "success" : "alert",
      });
    }

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        role: updated.role,
        kycStatus: updated.kycStatus,
        clientTier: updated.clientTier,
        isActive: updated.isActive,
      },
    });
  } catch (err) {
    console.error("Admin users PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
