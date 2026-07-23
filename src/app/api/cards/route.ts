import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, cards, notifications } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { maskCardNumber } from "@/lib/utils";
import { logAdminAction } from "@/lib/admin-log";
import { createCardSchema } from "@/lib/validation";
import { createValidatedApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-error";
import { ValidationError, NotFoundError, AuthenticationError, AuthorizationError } from "@/lib/api-error";
import { logger } from "@/lib/logger";

function generateCVV() {
  return String(Math.floor(100 + Math.random() * 900));
}

function generateFullNumber() {
  let n = "4580";
  for (let i = 0; i < 12; i++) n += Math.floor(Math.random() * 10);
  return n;
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await requireUser(["admin"]);
    if (!user) {
      throw error === "Forbidden" ? new AuthorizationError() : new AuthenticationError();
    }

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!id) {
      throw new ValidationError("Card ID is required");
    }

    await db.delete(cards).where(eq(cards.id, id));

    await logAdminAction({
      adminId: user.id,
      action: "card_deleted",
      targetType: "card",
      targetId: id,
      details: `Deleted card #${id}`,
    });

    logger.info("Card deleted", { adminId: user.id, cardId: id });

    return successResponse({ ok: true });
  } catch (error) {
    logger.error("Card DELETE error", error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireUser();
    if (!user) {
      throw error === "Forbidden" ? new AuthorizationError() : new AuthenticationError();
    }

    const rows =
      user.role === "admin"
        ? await db.select().from(cards)
        : await db.select().from(cards).where(eq(cards.userId, user.id));

    // For each card, get linked account balance
    const result = [];
    for (const card of rows) {
      const [acct] = await db.select().from(accounts).where(eq(accounts.id, card.accountId)).limit(1);
      result.push({
        ...card,
        accountBalance: acct?.balance || "0",
        accountCurrency: acct?.currency || "USD",
      });
    }

    logger.info("Cards retrieved", { userId: user.id, count: result.length });

    return successResponse({ cards: result });
  } catch (error) {
    logger.error("Card GET error", error);
    throw error;
  }
}

export const POST = createValidatedApiHandler(
  createCardSchema,
  async (request: NextRequest, data, { requestId }) => {
    const { user, error } = await requireUser(["client", "admin"]);
    if (!user) {
      throw error === "Forbidden" ? new AuthorizationError() : new AuthenticationError();
    }

    const [account] = await db.select().from(accounts).where(eq(accounts.id, data.accountId)).limit(1);
    if (!account) {
      throw new NotFoundError("Account not found");
    }

    if (user.role !== "admin" && account.userId !== user.id) {
      throw new AuthorizationError("Account does not belong to you");
    }

    const now = new Date();
    const [card] = await db
      .insert(cards)
      .values({
        userId: account.userId,
        accountId: account.id,
        cardNumberMasked: maskCardNumber(),
        cardholderName: `${user.firstName} ${user.lastName}`.toUpperCase(),
        type: data.type,
        status: user.role === "admin" ? "active" : "pending",
        expiryMonth: now.getMonth() + 1,
        expiryYear: now.getFullYear() + 4,
        cvv: generateCVV(),
        fullCardNumber: generateFullNumber(),
        creditLimit: data.type === "debit" ? null : data.creditLimit || "50000.00",
        spentThisMonth: "0",
        network: data.type === "black" ? "Mastercard World Elite" : data.type === "platinum" ? "Visa Infinite" : "Visa",
        cardArt: data.cardArt,
      })
      .returning();

    await db.insert(notifications).values({
      userId: account.userId,
      title: card.status === "pending" ? "Card application submitted" : "Card issued",
      body:
        card.status === "pending"
          ? `Your ${data.type} card application is being processed.`
          : `Your new ${data.type} card is active.`,
      type: card.status === "pending" ? "info" : "success",
    });

    logger.info("Card created", { userId: user.id, cardId: card.id, type: data.type, requestId });

    return successResponse(
      {
        card: {
          ...card,
          accountBalance: account.balance,
          accountCurrency: account.currency,
        },
      },
      201
    );
  }
);

export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await requireUser(["client", "admin"]);
    if (!user) {
      throw error === "Forbidden" ? new AuthorizationError() : new AuthenticationError();
    }

    const body = await request.json();
    const id = Number(body.id);
    const newStatus = body.status as string;

    if (!id) {
      throw new ValidationError("Card ID is required");
    }

    const [card] = await db.select().from(cards).where(eq(cards.id, id)).limit(1);
    if (!card) {
      throw new NotFoundError("Card not found");
    }

    if (user.role !== "admin") {
      if (card.userId !== user.id) {
        throw new AuthorizationError("Card does not belong to you");
      }
      // Clients can only block their cards or change card art
      if (newStatus && newStatus !== "blocked") {
        throw new ValidationError("Contact support for this action.");
      }
    }

    if (user.role === "admin" && card.status === "pending" && newStatus === "active") {
      await db.insert(notifications).values({
        userId: card.userId,
        title: "Card activated",
        body: `Your ${card.type} card is now active.`,
        type: "success",
      });

      await logAdminAction({
        adminId: user.id,
        action: "card_approved",
        targetType: "card",
        targetId: id,
        details: `Approved ${card.type} card`,
      });
    }

    const updates: Partial<typeof cards.$inferInsert> = {};
    if (newStatus) updates.status = newStatus as typeof card.status;
    if (body.cardArt) updates.cardArt = String(body.cardArt);

    if (Object.keys(updates).length === 0) {
      throw new ValidationError("No changes provided");
    }

    const [updated] = await db.update(cards).set(updates).where(eq(cards.id, id)).returning();

    logger.info("Card updated", { userId: user.id, cardId: id, status: newStatus, requestId });

    return successResponse({ card: updated });
  } catch (error) {
    logger.error("Card PATCH error", error);
    throw error;
  }
}
