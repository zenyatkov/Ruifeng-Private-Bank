import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, notifications, users } from "@/db/schema";
import { attachSessionCookie, createSessionToken, hashPassword } from "@/lib/auth";
import { generateAccountNumber } from "@/lib/utils";
import { seedIfNeeded } from "@/lib/seed";
import { registerSchema } from "@/lib/validation";
import { createValidatedApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-error";
import { ConflictError } from "@/lib/api-error";
import { logger } from "@/lib/logger";

export const POST = createValidatedApiHandler(
  registerSchema,
  async (request: NextRequest, data, { requestId }) => {
    await seedIfNeeded();

    const email = data.email.toLowerCase();
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existing) {
      logger.warn("Registration attempt with existing email", { email, requestId });
      throw new ConflictError("An account with this email already exists");
    }

    const passwordHash = await hashPassword(data.password);

    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        country: data.country || "Singapore",
        city: data.city || null,
        nationality: data.nationality || data.country || "Singapore",
        role: "client",
        kycStatus: "pending",
        clientTier: "Private",
        preferredCurrency: data.preferredCurrency || "SGD",
        preferredLanguage: data.preferredLanguage || "en",
        isActive: true,
      })
      .returning();

    const accountNumber = generateAccountNumber();
    await db.insert(accounts).values({
      userId: user.id,
      accountNumber,
      iban: `SG89RFPB${accountNumber}`,
      type: "checking",
      currency: "SGD",
      balance: "0.00",
      availableBalance: "0.00",
      status: "active",
      nickname: "Primary Current",
      interestRate: "0.250",
    });

    await db.insert(notifications).values({
      userId: user.id,
      title: "Welcome to 瑞峯 RuiFeng Private Bank",
      body: "Your private banking relationship has begun. Complete KYC verification to unlock full access to accounts, transfers, cards, and wealth management.",
      type: "success",
    });

    // Send welcome email via Resend (non-blocking)
    try {
      const { sendEmail, welcomeEmailHtml } = await import("@/lib/email");
      const emailSent = await sendEmail(email, "Welcome to 瑞峯 RuiFeng Private Bank", welcomeEmailHtml(data.firstName));
      if (!emailSent) {
        // If email couldn't be delivered (Resend free tier), add in-app notification with hint
        await db.insert(notifications).values({
          userId: user.id,
          title: "Welcome Email Delivery Note",
          body: "We couldn't deliver the welcome email to your address. You can still access all features through the app. Verify your email in Settings to enable email notifications.",
          type: "info",
        });
      }
    } catch (err) {
      logger.warn("Failed to send welcome email", { userId: user.id, requestId });
    }

    // Also trigger OTP email verification for email verification
    try {
      const otp = String(Math.floor(100000 + Math.random() * 899999));
      const expiry = new Date(Date.now() + 10 * 60 * 1000);
      await db.update(users).set({ emailOtp: otp, emailOtpExpiry: expiry }).where(eq(users.id, user.id));
      
      const { sendEmail, otpEmailHtml } = await import("@/lib/email");
      const otpSent = await sendEmail(email, "瑞峯 RuiFeng — Verify Your Email", otpEmailHtml(otp));
      
      // Always create in-app notification with OTP as fallback
      await db.insert(notifications).values({
        userId: user.id,
        title: otpSent ? "Email Verification Code Sent" : "Email Verification Code (In-App)",
        body: `Your verification code is: ${otp}. This code expires in 10 minutes. ${otpSent ? "Check your email for details." : "We couldn't deliver the email to your address. Use this code to verify your email in the Security & Settings page."}`,
        type: otpSent ? "info" : "alert",
      });
    } catch (err) {
      logger.warn("Failed to send OTP during registration", { userId: user.id, requestId });
    }

    const { token, expiresAt } = await createSessionToken(user.id);

    logger.info("User registered successfully", {
      userId: user.id,
      email: user.email,
      requestId,
    });

    const response = successResponse({
      redirectTo: "/dashboard/kyc",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });

    return attachSessionCookie(response, token, expiresAt);
  }
);
