import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, notifications } from "@/db/schema";
import { sendEmail, otpEmailHtml } from "@/lib/email";
import { verifyEmailSchema } from "@/lib/validation";
import { createValidatedApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-error";
import { NotFoundError, ValidationError } from "@/lib/api-error";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();

    if (!email) {
      throw new ValidationError("Email is required");
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const otp = String(Math.floor(100000 + Math.random() * 899999));
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await db.update(users).set({ emailOtp: otp, emailOtpExpiry: expiry }).where(eq(users.id, user.id));

    // Try to send email, but always create in-app notification as fallback
    const emailSent = await sendEmail(email, "瑞峯 RuiFeng — Email Verification Code", otpEmailHtml(otp));

    // Create in-app notification with the OTP code (so user can find it even if email fails)
    await db.insert(notifications).values({
      userId: user.id,
      title: emailSent ? "Email Verification Code Sent" : "Email Verification Code (In-App)",
      body: `Your verification code is: ${otp}. This code expires in 10 minutes. ${emailSent ? "Check your email for details." : "We couldn't deliver the email to your address. Use this code to verify your email in the app."}`,
      type: emailSent ? "info" : "alert",
      isRead: false,
    });

    logger.info("Verification code sent", { userId: user.id, emailSent });

    return successResponse({
      message: emailSent
        ? "Verification code sent to your email"
        : "Verification code available in your in-app notifications (email delivery failed)",
      emailSent,
    });
  } catch (error) {
    logger.error("Send OTP error", error);
    throw error;
  }
}

export const PATCH = createValidatedApiHandler(
  verifyEmailSchema,
  async (request: NextRequest, data, { requestId }) => {
    const [user] = await db.select().from(users).where(eq(users.email, data.email)).limit(1);

    if (!user) {
      logger.warn("Email verification attempt for non-existent user", { email: data.email, requestId });
      throw new NotFoundError("User not found");
    }

    if (user.emailOtp !== data.otp) {
      logger.warn("Invalid OTP attempt", { userId: user.id, requestId });
      throw new ValidationError("Invalid verification code");
    }

    if (user.emailOtpExpiry && user.emailOtpExpiry < new Date()) {
      logger.warn("Expired OTP attempt", { userId: user.id, requestId });
      throw new ValidationError("Code expired. Request a new one.");
    }

    await db
      .update(users)
      .set({ emailVerified: true, emailOtp: null, emailOtpExpiry: null, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    logger.info("Email verified successfully", { userId: user.id, requestId });

    return successResponse({ verified: true });
  }
);
