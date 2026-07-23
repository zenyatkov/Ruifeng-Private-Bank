import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { submitKycSchema } from "@/lib/validation";
import { createValidatedApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-error";
import { AuthenticationError, AuthorizationError } from "@/lib/api-error";
import { logger } from "@/lib/logger";

export const POST = createValidatedApiHandler(
  submitKycSchema,
  async (request: NextRequest, data, { requestId }) => {
    const { user, error } = await requireUser();
    if (!user) {
      throw error === "Forbidden" ? new AuthorizationError() : new AuthenticationError();
    }

    // Update user KYC details
    await db
      .update(users)
      .set({
        kycDocumentType: data.documentType,
        kycDocumentNumber: data.documentNumber,
        kycFullName: data.fullName,
        kycDateOfBirth: data.dateOfBirth,
        kycAddress: data.address,
        kycEmployer: data.employer || null,
        kycOccupation: data.occupation || null,
        kycSourceOfFunds: data.sourceOfFunds || null,
        kycAnnualIncome: data.annualIncome || null,
        kycPepStatus: data.pepStatus || null,
        kycStatus: "review",
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Notify admins
    const admins = await db.select().from(users).where(eq(users.role, "admin"));
    for (const admin of admins) {
      await db.insert(notifications).values({
        userId: admin.id,
        title: `KYC submitted: ${user.firstName} ${user.lastName}`,
        body: `${data.documentType} ${data.documentNumber}. Review in Admin → KYC.`,
        type: "info",
      });
    }

    await db.insert(notifications).values({
      userId: user.id,
      title: "KYC submitted",
      body: "Your identity documents are under review.",
      type: "info",
    });

    logger.info("KYC submitted", { userId: user.id, documentType: data.documentType, requestId });

    return successResponse({ ok: true, status: "review" }, 201);
  }
);
