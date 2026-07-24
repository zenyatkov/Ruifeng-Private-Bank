import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, loans, notifications, transactions } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { generateLoanNumber, generateReference } from "@/lib/utils";
import { logAdminAction } from "@/lib/admin-log";
import { applyLoanSchema } from "@/lib/validation";
import { createValidatedApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-error";
import { ValidationError, NotFoundError, AuthenticationError, AuthorizationError } from "@/lib/api-error";
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

    const rows =
      user.role === "admin"
        ? await db.select().from(loans).orderBy(desc(loans.createdAt))
        : await db.select().from(loans).where(eq(loans.userId, user.id)).orderBy(desc(loans.createdAt));

    logger.info("Loans retrieved", { userId: user.id, count: rows.length });
    return successResponse({ loans: rows });
  } catch (err) {
    console.error("Loans GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const POST = createValidatedApiHandler(
  applyLoanSchema,
  async (request: NextRequest, data, { requestId }) => {
    const { user, error } = await requireUser(["client", "admin"]);
    if (!user) {
      throw error === "Forbidden" ? new AuthorizationError() : new AuthenticationError();
    }

    const principal = parseFloat(data.principal);
    const termMonths = data.termMonths ?? 36;
    const productName = data.productName ?? "Private Credit Facility";
    const purpose = data.purpose ?? null;
    const currency = (data.currency ?? "USD").toUpperCase();
    const interestRate = data.interestRate ?? "4.250";
    const accountId = data.accountId ?? null;

    // Validate the disbursement account exists and belongs to user
    if (accountId) {
      const [acct] = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
      if (!acct) {
        throw new NotFoundError("Disbursement account not found");
      }
      if (user.role !== "admin" && acct.userId !== user.id) {
        throw new AuthorizationError("Account does not belong to you");
      }
    }

    const rate = parseFloat(interestRate) / 100 / 12;
    const monthly =
      rate > 0
        ? ((principal * rate * Math.pow(1 + rate, termMonths)) / (Math.pow(1 + rate, termMonths) - 1)).toFixed(2)
        : (principal / termMonths).toFixed(2);

    const targetUserId = user.role === "admin" && data.userId ? data.userId : user.id;

    const [loan] = await db
      .insert(loans)
      .values({
        userId: targetUserId,
        accountId,
        loanNumber: generateLoanNumber(),
        productName,
        principal: principal.toFixed(2),
        outstanding: principal.toFixed(2),
        interestRate,
        termMonths,
        monthlyPayment: monthly,
        currency,
        status: "pending",
        purpose,
      })
      .returning();

    await db.insert(notifications).values({
      userId: loan.userId,
      title: "Loan application submitted",
      body: `Your ${productName} application for ${currency} ${principal.toFixed(2)} is under review. You will be notified upon approval.`,
      type: "info",
    });

    logger.info("Loan application submitted", { userId: user.id, loanId: loan.id, requestId });

    return successResponse({ loan }, 201);
  }
);

export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await requireUser(["admin"]);
    if (!user) {
      return NextResponse.json({ error }, { status: error === "Forbidden" ? 403 : 401 });
    }

    const body = await request.json();
    const id = Number(body.id);
    const newStatus = body.status as string;

    if (!id || !newStatus) {
      return NextResponse.json({ error: "Loan ID and status are required" }, { status: 400 });
    }

    const [existing] = await db.select().from(loans).where(eq(loans.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    const updates: Partial<typeof loans.$inferInsert> = {
      status: newStatus as typeof existing.status,
      updatedAt: new Date(),
    };

      // When approved → set to active, set dates, and CREDIT the disbursement account
    if (newStatus === "approved" || newStatus === "active") {
      updates.status = "active";
      updates.startDate = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + existing.termMonths);
      updates.endDate = end;

      // Use or create a single dedicated loan disbursement account per user
      // (don't create multiple accounts for multiple loans)
      const existingLoanAcct = await db.select().from(accounts).where(
        eq(accounts.userId, existing.userId)
      ).limit(100);
      const dedicatedLoanAccount = existingLoanAcct.find(
        a => a.nickname === "Loan Disbursement" && a.status === "active" && a.type === "checking" && a.currency === existing.currency
      );

      let loanAccountId: number;
      if (dedicatedLoanAccount) {
        // Reuse existing loan disbursement account — add principal to balance
        loanAccountId = dedicatedLoanAccount.id;
        const newBal = (parseFloat(dedicatedLoanAccount.balance) + parseFloat(existing.principal)).toFixed(2);
        const newAvail = (parseFloat(dedicatedLoanAccount.availableBalance) + parseFloat(existing.principal)).toFixed(2);
        await db.update(accounts).set({
          balance: newBal, availableBalance: newAvail, updatedAt: new Date(),
        }).where(eq(accounts.id, dedicatedLoanAccount.id));
      } else {
        // Create a single dedicated loan disbursement account
        const loanAcctNum = `LND${existing.loanNumber.replace(/\D/g, "")}`;
        const [newAcct] = await db
          .insert(accounts)
          .values({
            userId: existing.userId,
            accountNumber: loanAcctNum,
            iban: `SG89RFLN${loanAcctNum}`,
            type: "checking",
            currency: existing.currency,
            balance: existing.principal,
            availableBalance: existing.principal,
            status: "active",
            nickname: "Loan Disbursement",
            interestRate: "0",
          })
          .returning();
        loanAccountId = newAcct.id;
      }

      // Link loan to this account
      await db.update(loans).set({ accountId: loanAccountId }).where(eq(loans.id, id));

      // Record disbursement transaction
      await db.insert(transactions).values({
        accountId: loanAccountId,
        type: "loan_disbursement",
        status: "completed",
        amount: existing.principal,
        currency: existing.currency,
        fee: "0",
        description: `Loan disbursement: ${existing.productName} (${existing.loanNumber}). Auto-debit of ${existing.currency} ${existing.monthlyPayment || "0"}/month enabled.`,
        reference: generateReference("LND"),
        counterpartyName: "瑞峯 RuiFeng Lending",
        category: "Loan",
        processedAt: new Date(),
      });

      // Also credit the original disbursement account if one was specified
      const origAccountId = existing.accountId;
      if (origAccountId) {
        const [origAcct] = await db.select().from(accounts).where(eq(accounts.id, origAccountId)).limit(1);
        if (origAcct && origAcct.status === "active") {
          const origBal = (parseFloat(origAcct.balance) + parseFloat(existing.principal)).toFixed(2);
          await db.update(accounts).set({ balance: origBal, availableBalance: origBal, updatedAt: new Date() }).where(eq(accounts.id, origAcct.id));

          await db.insert(transactions).values({
            accountId: origAcct.id,
            type: "deposit",
            status: "completed",
            amount: existing.principal,
            currency: existing.currency,
            fee: "0",
            description: `Loan proceeds: ${existing.productName}`,
            reference: generateReference("LNPR"),
            counterpartyName: "瑞峯 Loan Account",
            category: "Loan",
            processedAt: new Date(),
          });
        }
      }

      await db.insert(notifications).values({
        userId: existing.userId,
        title: "Loan approved & funded",
        body: `${existing.currency} ${existing.principal} credited. Dedicated loan account created. Monthly auto-debit of ${existing.currency} ${existing.monthlyPayment || "N/A"} will apply.`,
        type: "success",
      });
    }

    const [loan] = await db.update(loans).set(updates).where(eq(loans.id, id)).returning();

    await logAdminAction({
      adminId: user.id,
      action: `loan_${newStatus}`,
      targetType: "loan",
      targetId: id,
      details: `Changed loan ${existing.loanNumber} to ${updates.status}`,
    });

    await db.insert(notifications).values({
      userId: existing.userId,
      title: `Loan ${updates.status}`,
      body:
        updates.status === "active"
          ? `Your loan ${existing.loanNumber} has been approved and funds disbursed.`
          : `Your loan ${existing.loanNumber} status: ${updates.status}.`,
      type: updates.status === "rejected" ? "alert" : "success",
    });

    logger.info("Loan status updated", {
      adminId: user.id,
      loanId: id,
      status: updates.status,
    });

    return successResponse({ loan });
  } catch (err) {
    console.error("Loan PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
