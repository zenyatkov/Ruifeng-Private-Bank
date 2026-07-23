import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/validation";
import { createValidatedApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-error";
import { AuthenticationError, AuthorizationError } from "@/lib/api-error";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const { user, error } = await requireUser();
    if (!user) {
      return NextResponse.json(
        { error: error === "Forbidden" ? "Forbidden" : "Unauthorized" },
        { status: error === "Forbidden" ? 403 : 401 }
      );
    }

    const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    if (!row) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    logger.info("Profile retrieved", { userId: user.id });

    return successResponse({
      profile: {
        id: row.id,
        email: row.email,
        firstName: row.firstName,
        lastName: row.lastName,
        phone: row.phone,
        role: row.role,
        country: row.country,
        city: row.city,
        address: row.address,
        nationality: row.nationality,
        dateOfBirth: row.dateOfBirth,
        kycStatus: row.kycStatus,
        clientTier: row.clientTier,
        preferredCurrency: row.preferredCurrency,
        preferredLanguage: row.preferredLanguage,
        lastLoginAt: row.lastLoginAt,
        createdAt: row.createdAt,
      },
    });
  } catch (err) {
    console.error("Profile GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const PATCH = createValidatedApiHandler(
  updateProfileSchema,
  async (request: NextRequest, data, { requestId }) => {
    const { user, error } = await requireUser();
    if (!user) {
      throw error === "Forbidden" ? new AuthorizationError() : new AuthenticationError();
    }

    const updates: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };

    if (data.firstName) updates.firstName = data.firstName;
    if (data.lastName) updates.lastName = data.lastName;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.city !== undefined) updates.city = data.city;
    if (data.address !== undefined) updates.address = data.address;
    if (data.country !== undefined) updates.country = data.country;
    if (data.preferredCurrency !== undefined) updates.preferredCurrency = data.preferredCurrency;
    if (data.preferredLanguage !== undefined) updates.preferredLanguage = data.preferredLanguage;

    const [updated] = await db.update(users).set(updates).where(eq(users.id, user.id)).returning();

    logger.info("Profile updated", { userId: user.id, requestId });

    return successResponse({
      profile: {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone,
        country: updated.country,
        city: updated.city,
        address: updated.address,
        clientTier: updated.clientTier,
        kycStatus: updated.kycStatus,
      },
    });
  }
);
