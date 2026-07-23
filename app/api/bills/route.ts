import { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, billPayments, notifications, transactions } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { generateReference } from "@/lib/utils";
import { payBillSchema } from "@/lib/validation";
import { createValidatedApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-error";
import { ValidationError, NotFoundError, AuthenticationError, AuthorizationError } from "@/lib/api-error";
import { logger } from "@/lib/logger";

const BILLERS: Record<string, { name: string; category: string }[]> = {
  Singapore: [
    { name: "SP Group (Electricity)", category: "Utilities" },
    { name: "PUB Water", category: "Utilities" },
    { name: "Singtel", category: "Telecom" },
    { name: "StarHub", category: "Telecom" },
    { name: "IRAS Tax", category: "Government" },
    { name: "HDB Housing", category: "Housing" },
  ],
  "Hong Kong": [
    { name: "CLP Power", category: "Utilities" },
    { name: "HK Electric", category: "Utilities" },
    { name: "PCCW/HKT", category: "Telecom" },
    { name: "Water Supplies Dept", category: "Utilities" },
  ],
  Japan: [
    { name: "TEPCO", category: "Utilities" },
    { name: "Tokyo Gas", category: "Utilities" },
    { name: "NTT Docomo", category: "Telecom" },
    { name: "SoftBank", category: "Telecom" },
  ],
  India: [
    { name: "BSES Electricity", category: "Utilities" },
    { name: "Jio Recharge", category: "Telecom" },
    { name: "Airtel", category: "Telecom" },
    { name: "Income Tax", category: "Government" },
  ],
  China: [
    { name: "State Grid", category: "Utilities" },
    { name: "China Mobile", category: "Telecom" },
    { name: "China Unicom", category: "Telecom" },
  ],
  "South Korea": [
    { name: "KEPCO", category: "Utilities" },
    { name: "SK Telecom", category: "Telecom" },
    { name: "KT Corp", category: "Telecom" },
  ],
  Malaysia: [
    { name: "TNB Electricity", category: "Utilities" },
    { name: "Maxis", category: "Telecom" },
    { name: "Celcom", category: "Telecom" },
  ],
  Thailand: [
    { name: "PEA Electricity", category: "Utilities" },
    { name: "AIS Telecom", category: "Telecom" },
    { name: "TRUE Corp", category: "Telecom" },
  ],
  Indonesia: [
    { name: "PLN Electricity", category: "Utilities" },
    { name: "Telkomsel", category: "Telecom" },
  ],
  Philippines: [
    { name: "Meralco", category: "Utilities" },
    { name: "Globe Telecom", category: "Telecom" },
  ],
  Vietnam: [
    { name: "EVN Electricity", category: "Utilities" },
    { name: "Viettel", category: "Telecom" },
  ],
  Taiwan: [
    { name: "Taipower", category: "Utilities" },
    { name: "Chunghwa Telecom", category: "Telecom" },
  ],
  Australia: [
    { name: "AGL Energy", category: "Utilities" },
    { name: "Telstra", category: "Telecom" },
  ],
  "United Arab Emirates": [
    { name: "DEWA", category: "Utilities" },
    { name: "Etisalat", category: "Telecom" },
  ],
};

export async function GET(request: NextRequest) {
  const { user, error } = await requireUser();
  if (!user) {
    throw error === "Forbidden" ? new AuthorizationError() : new AuthenticationError();
  }

  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country") || user.country || "Singapore";
  const billers = BILLERS[country] || BILLERS["Singapore"];
  const history = await db.select().from(billPayments).where(eq(billPayments.userId, user.id)).orderBy(desc(billPayments.createdAt)).limit(20);

  logger.info("Billers retrieved", { userId: user.id, country });
  return successResponse({ billers, history });
}

export const POST = createValidatedApiHandler(
  payBillSchema,
  async (request: NextRequest, data, { requestId }) => {
    const { user, error } = await requireUser(["client", "admin"]);
    if (!user) {
      throw error === "Forbidden" ? new AuthorizationError() : new AuthenticationError();
    }

    const accountId = data.accountId;
    const amount = parseFloat(data.amount);
    const billerName = data.billerName;
    const billerCategory = data.billerCategory || "Utilities";
    const referenceNumber = data.referenceNumber || "";

    const [acct] = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
    if (!acct) {
      throw new NotFoundError("Account not found");
    }

    if (user.role !== "admin" && acct.userId !== user.id) {
      throw new AuthorizationError("Account does not belong to you");
    }

    const accountBalance = parseFloat(acct.balance);
    if (accountBalance < amount) {
      throw new ValidationError("Insufficient funds");
    }

    // Hold funds (debit now, refund if rejected)
    const newBal = (accountBalance - amount).toFixed(2);
    await db.update(accounts).set({ balance: newBal, availableBalance: newBal, updatedAt: new Date() }).where(eq(accounts.id, acct.id));

    const ref = generateReference("BILL");
    await db.insert(transactions).values({
      accountId: acct.id,
      type: "payment",
      status: "pending",
      amount: amount.toFixed(2),
      currency: acct.currency,
      fee: "0",
      description: `Bill: ${billerName} (${billerCategory}) Ref: ${referenceNumber}`,
      reference: ref,
      counterpartyName: billerName,
      category: "Bill Payment",
      processedAt: null,
    });

    // Bill starts as "pending" — requires admin approval
    const [bill] = await db
      .insert(billPayments)
      .values({
        userId: user.id,
        accountId,
        billerName,
        billerCategory,
        referenceNumber,
        amount: amount.toFixed(2),
        currency: acct.currency,
        status: "pending",
      })
      .returning();

    await db.insert(notifications).values({
      userId: user.id,
      title: "Bill payment submitted",
      body: `${acct.currency} ${amount.toFixed(2)} to ${billerName} is being processed. Ref: ${ref}`,
      type: "info",
    });

    logger.info("Bill payment submitted", {
      userId: user.id,
      billId: bill.id,
      amount,
      billerName,
      requestId,
    });

    return successResponse({ bill, newBalance: newBal, reference: ref }, 201);
  }
);
