import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { attachSessionCookie, createSessionToken, updateLastLogin, verifyPassword } from "@/lib/auth";
import { seedIfNeeded } from "@/lib/seed";
import { loginSchema } from "@/lib/validation";
import { createValidatedApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-error";
import { AuthenticationError, AuthorizationError } from "@/lib/api-error";
import { logger } from "@/lib/logger";

export const POST = createValidatedApiHandler(
  loginSchema,
  async (request: NextRequest, data, { requestId }) => {
    await seedIfNeeded();

    const email = data.email.toLowerCase();
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      logger.warn("Login attempt with invalid email", { email, requestId });
      throw new AuthenticationError("Invalid credentials");
    }

    if (!user.isActive) {
      logger.warn("Login attempt on inactive account", { userId: user.id, requestId });
      throw new AuthorizationError("Account is deactivated. Contact support.");
    }

    const valid = await verifyPassword(data.password, user.passwordHash);
    if (!valid) {
      logger.warn("Login attempt with invalid password", { userId: user.id, requestId });
      throw new AuthenticationError("Invalid credentials");
    }

    const { token, expiresAt } = await createSessionToken(user.id);
    await updateLastLogin(user.id);

    logger.info("User logged in successfully", {
      userId: user.id,
      email: user.email,
      requestId,
    });

    const response = successResponse({
      redirectTo: user.role === "admin" || user.role === "relationship_manager" ? "/admin" : "/dashboard",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        clientTier: user.clientTier,
      },
    });

    return attachSessionCookie(response, token, expiresAt);
  }
);
