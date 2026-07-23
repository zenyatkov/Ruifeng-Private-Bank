import { NextRequest } from "next/server";
import { desc, eq, count } from "drizzle-orm";
import { db } from "@/db";
import { accounts, notifications } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { generateAccountNumber } from "@/lib/utils";
import { createAccountSchema } from "@/lib/validation";
import { createValidatedApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-error";
import { AuthenticationError, AuthorizationError } from "@/lib/api-error";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireUser();
    if (!user) {
      throw error === "Forbidden" ? new AuthorizationError() : new AuthenticationError();
    }

    const rows =
      user.role === "admin"
        ? await db.select().from(accounts).orderBy(desc(accounts.openedAt))
        : await db.select().from(accounts).where(eq(accounts.userId, user.id)).orderBy(desc(accounts.openedAt));

    logger.info("Accounts retrieved", { userId: user.id, count: rows.length });
    return successResponse({ accounts: rows });
  } catch (error) {
    logger.error("Get accounts error", error);
    throw error;
  }
}

export const POST = createValidatedApiHandler(
  createAccountSchema,
  async (request: NextRequest, data, { requestId }) => {
    const { user, error } = await requireUser(["client", "admin"]);
    if (!user) {
      throw error === "Forbidden" ? new AuthorizationError() : new AuthenticationError();
    }

    const currency = data.currency.toUpperCase();
    const targetUserId = user.role === "admin" && request.nextUrl.searchParams.get("userId") ? Number(request.nextUrl.searchParams.get("userId")) : user.id;

    const [existingCount] = await db.select({ v: count() }).from(accounts).where(eq(accounts.userId, targetUserId));
    const isFirstAccount = existingCount.v === 0;
    const needsApproval = !isFirstAccount && user.role !== "admin";

    const accountNumber = needsApproval ? `PENDING-${Date.now()}` : generateAccountNumber();
    const accountStatus = needsApproval ? "pending" : "active";

    const [account] = await db
      .insert(accounts)
      .values({
        userId: targetUserId,
        accountNumber,
        iban: needsApproval ? "Pending assignment" : `SG89RFPB${accountNumber}`,
        type: data.type,
        currency,
        balance: "0.00",
        availableBalance: "0.00",
        status: accountStatus,
        nickname: data.nickname || null,
        interestRate: data.type === "savings" || data.type === "fixed_deposit" ? "2.500" : "0.350",
      })
      .returning();

    if (needsApproval) {
      await db.insert(notifications).values({
        userId: targetUserId,
        title: "Account application submitted",
        body: `Your ${currency} ${data.type} account application is being processed. Account details will be assigned upon activation.`,
        type: "info",
      });
    }

    logger.info("Account created", {
      userId: user.id,
      accountId: account.id,
      status: accountStatus,
      requestId,
    });

    return successResponse({ account }, 201);
  }
);

