import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { accounts, fxRates, notifications, receipts, systemSettings, transactions } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { generateReference } from "@/lib/utils";
import { transferSchema } from "@/lib/validation";
import { createValidatedApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-error";
import { ValidationError, NotFoundError, AuthenticationError, AuthorizationError } from "@/lib/api-error";
import { logger } from "@/lib/logger";

export async function GET() {
  const { user, error } = await requireUser();
  if (!user) {
    throw error === "Forbidden" ? new AuthorizationError() : new AuthenticationError();
  }

  const rows =
    user.role === "admin"
      ? await db.select().from(transactions).where(eq(transactions.type, "transfer")).orderBy(desc(transactions.createdAt))
      : await db
          .select()
          .from(transactions)
          .where(and(eq(transactions.type, "transfer"), eq(transactions.accountId, user.id)))
          .orderBy(desc(transactions.createdAt));

  logger.info("Transfers retrieved", { userId: user.id, count: rows.length });
  return successResponse({ transactions: rows });
}

export const POST = createValidatedApiHandler(
  transferSchema,
  async (request: NextRequest, data, { requestId }) => {
    const { user, error } = await requireUser(["client", "admin"]);
    if (!user) {
      throw error === "Forbidden" ? new AuthorizationError() : new AuthenticationError();
    }

    // Check if transfers are enabled
    if (user.role !== "admin") {
      const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, "transfers_enabled")).limit(1);
      if (setting && setting.value === "false") {
        logger.warn("Transfer attempted during maintenance", { userId: user.id, requestId });
        return NextResponse.json(
          {
            error: "Transfer services are temporarily unavailable for maintenance. Please use Crypto Funding for deposits.",
            maintenanceMode: true,
          },
          { status: 503 }
        );
      }
    }

    const fromAccountId = data.fromAccountId;
    const amount = data.amount;
    const description = data.description || "Transfer";
    const transferType = data.transferType || "external";
    const toAccountId = transferType === "internal" ? data.toAccountId : null;

    // Beneficiary details from inline form
    const beneficiaryName = data.beneficiaryName || "Beneficiary";
    const beneficiaryBank = data.beneficiaryBank || "";
    const beneficiaryAccount = data.beneficiaryAccount || "";
    const beneficiarySwift = data.beneficiarySwift || "";
    const beneficiaryCountry = data.beneficiaryCountry || "";

    const [fromAccount] = await db.select().from(accounts).where(eq(accounts.id, fromAccountId)).limit(1);
    if (!fromAccount) {
      throw new NotFoundError("Source account not found");
    }

    if (user.role !== "admin" && fromAccount.userId !== user.id) {
      throw new AuthorizationError("Account does not belong to you");
    }

    if (fromAccount.status !== "active") {
      throw new ValidationError("Source account is not active");
    }

    const balance = parseFloat(fromAccount.balance);
    const fee = amount >= 10000 ? 35 : amount >= 1000 ? 15 : 5;
    if (balance < amount + fee) {
      throw new ValidationError(`Insufficient funds. Available: ${fromAccount.currency} ${balance.toFixed(2)}`);
    }

    let counterpartyName = beneficiaryName;
    let counterpartyAccount = beneficiaryAccount;

    if (transferType === "internal" && toAccountId) {
      const [toAccount] = await db.select().from(accounts).where(eq(accounts.id, toAccountId)).limit(1);
      if (!toAccount) {
        throw new NotFoundError("Destination account not found");
      }
      if (toAccount.id === fromAccount.id) {
        throw new ValidationError("Cannot transfer to the same account");
      }
      counterpartyName = toAccount.nickname || `Account ${toAccount.accountNumber}`;
      counterpartyAccount = toAccount.accountNumber;
    }

    const reference = generateReference("TRF");
    // ALL transfers require admin approval (status = pending)
    const status = user.role === "admin" ? "completed" : "pending";

    // Debit source immediately (hold funds)
    const newBalance = (balance - amount - fee).toFixed(2);
    await db
      .update(accounts)
      .set({ balance: newBalance, availableBalance: newBalance, updatedAt: new Date() })
      .where(eq(accounts.id, fromAccount.id));

    const [debitTx] = await db
      .insert(transactions)
      .values({
        accountId: fromAccount.id,
        counterpartyAccountId: toAccountId,
        type: "transfer",
        status,
        amount: amount.toFixed(2),
        currency: fromAccount.currency,
        fee: fee.toFixed(2),
        description: `${description}${beneficiaryBank ? ` via ${beneficiaryBank}` : ""}${beneficiaryCountry ? ` (${beneficiaryCountry})` : ""}`,
        reference,
        counterpartyName,
        counterpartyAccount: counterpartyAccount || null,
        category: transferType === "internal" ? "Internal Transfer" : "External Transfer",
        metadata: { transferType, beneficiaryBank, beneficiarySwift, beneficiaryCountry },
        processedAt: status === "completed" ? new Date() : null,
      })
      .returning();

    // If admin does it or internal, credit immediately (with FX conversion if different currencies)
    if (status === "completed" && transferType === "internal" && toAccountId) {
      const [toAccount] = await db.select().from(accounts).where(eq(accounts.id, toAccountId)).limit(1);
      if (toAccount) {
        let creditAmount = amount;
        let fxNote = "";
        // Auto FX conversion if currencies differ
        if (toAccount.currency !== fromAccount.currency) {
          let rate = 1;
          const [direct] = await db
            .select()
            .from(fxRates)
            .where(and(eq(fxRates.baseCurrency, fromAccount.currency), eq(fxRates.quoteCurrency, toAccount.currency)))
            .limit(1);
          if (direct) {
            rate = parseFloat(direct.rate);
          } else {
            const [inverse] = await db
              .select()
              .from(fxRates)
              .where(and(eq(fxRates.baseCurrency, toAccount.currency), eq(fxRates.quoteCurrency, fromAccount.currency)))
              .limit(1);
            if (inverse) {
              rate = 1 / parseFloat(inverse.rate);
            } else {
              const allRates = await db.select().from(fxRates);
              const toUsd = allRates.find((r) => r.baseCurrency === fromAccount.currency && r.quoteCurrency === "USD");
              const fromUsd = allRates.find((r) => r.baseCurrency === "USD" && r.quoteCurrency === toAccount.currency);
              if (fromAccount.currency === "USD" && fromUsd) rate = parseFloat(fromUsd.rate);
              else if (toAccount.currency === "USD" && toUsd) rate = parseFloat(toUsd.rate);
              else if (toUsd && fromUsd) rate = parseFloat(toUsd.rate) * parseFloat(fromUsd.rate);
            }
          }
          creditAmount = amount * rate;
          fxNote = ` (FX: ${fromAccount.currency}→${toAccount.currency} @ ${rate.toFixed(6)})`;
        }
        const toBal = (parseFloat(toAccount.balance) + creditAmount).toFixed(2);
        await db
          .update(accounts)
          .set({ balance: toBal, availableBalance: toBal, updatedAt: new Date() })
          .where(eq(accounts.id, toAccount.id));
        await db.insert(transactions).values({
          accountId: toAccount.id,
          counterpartyAccountId: fromAccount.id,
          type: "deposit",
          status: "completed",
          amount: creditAmount.toFixed(2),
          currency: toAccount.currency,
          fee: "0",
          description: `Incoming: ${description}${fxNote}`,
          reference: generateReference("IN"),
          counterpartyName: fromAccount.nickname || fromAccount.accountNumber,
          counterpartyAccount: fromAccount.accountNumber,
          category: "Internal Transfer",
          processedAt: new Date(),
        });
      }
    }

    await db.insert(notifications).values({
      userId: fromAccount.userId,
      title: status === "pending" ? "Transfer pending admin approval" : "Transfer completed",
      body: `${fromAccount.currency} ${amount.toFixed(2)} to ${counterpartyName}. Ref: ${reference}. ${status === "pending" ? "Awaiting admin review." : ""}`,
      type: status === "pending" ? "alert" : "success",
    });

    const receipt = {
      reference,
      status,
      type: transferType,
      fromAccount: { number: fromAccount.accountNumber, nickname: fromAccount.nickname, currency: fromAccount.currency },
      toName: counterpartyName,
      toAccount: counterpartyAccount,
      toBank: beneficiaryBank,
      toCountry: beneficiaryCountry,
      toSwift: beneficiarySwift,
      amount: amount.toFixed(2),
      fee: fee.toFixed(2),
      total: (amount + fee).toFixed(2),
      currency: fromAccount.currency,
      description,
      timestamp: new Date().toISOString(),
      newBalance,
    };

    // Save receipt to DB for future viewing
    await db.insert(receipts).values({
      userId: fromAccount.userId,
      transactionId: debitTx.id,
      type: "transfer",
      data: receipt,
    });

    logger.info("Transfer created", {
      userId: user.id,
      transactionId: debitTx.id,
      status,
      amount,
      requestId,
    });

    return successResponse({ transaction: debitTx, receipt }, 201);
  }
);
