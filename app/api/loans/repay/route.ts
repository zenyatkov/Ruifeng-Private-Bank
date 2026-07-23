import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, loans, notifications, transactions } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { generateReference } from "@/lib/utils";

export async function POST(request: Request) {
  const { user, error } = await requireUser(["client", "admin"]);
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const body = await request.json();
  const loanId = Number(body.loanId);
  const amount = parseFloat(String(body.amount));
  const fromAccountId = Number(body.fromAccountId);

  if (!loanId || !Number.isFinite(amount) || amount <= 0 || !fromAccountId)
    return NextResponse.json({ error: "Invalid repayment details" }, { status: 400 });

  const [loan] = await db.select().from(loans).where(eq(loans.id, loanId)).limit(1);
  if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });
  if (loan.status !== "active") return NextResponse.json({ error: "Loan is not active" }, { status: 400 });
  if (user.role !== "admin" && loan.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const outstanding = parseFloat(loan.outstanding);
  const repayAmount = Math.min(amount, outstanding);

  const [acct] = await db.select().from(accounts).where(eq(accounts.id, fromAccountId)).limit(1);
  if (!acct) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  if (parseFloat(acct.balance) < repayAmount) return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });

  // Debit account
  const newBal = (parseFloat(acct.balance) - repayAmount).toFixed(2);
  await db.update(accounts).set({ balance: newBal, availableBalance: newBal, updatedAt: new Date() }).where(eq(accounts.id, acct.id));

  // Reduce outstanding
  const newOutstanding = (outstanding - repayAmount).toFixed(2);
  const newStatus = parseFloat(newOutstanding) <= 0 ? "paid_off" : "active";
  await db.update(loans).set({ outstanding: newOutstanding, status: newStatus as typeof loan.status, updatedAt: new Date() }).where(eq(loans.id, loanId));

  // Record transaction
  const ref = generateReference("LNRP");
  await db.insert(transactions).values({
    accountId: acct.id, type: "loan_repayment", status: "completed",
    amount: repayAmount.toFixed(2), currency: acct.currency, fee: "0",
    description: `Loan repayment: ${loan.productName} (${loan.loanNumber})`,
    reference: ref, counterpartyName: "瑞峯 RuiFeng Lending", category: "Loan Repayment", processedAt: new Date(),
  });

  await db.insert(notifications).values({
    userId: loan.userId,
    title: newStatus === "paid_off" ? "Loan fully repaid!" : "Loan repayment processed",
    body: newStatus === "paid_off"
      ? `Your loan ${loan.loanNumber} has been fully repaid. Congratulations!`
      : `${acct.currency} ${repayAmount.toFixed(2)} repaid on loan ${loan.loanNumber}. Outstanding: ${loan.currency} ${newOutstanding}`,
    type: "success",
  });

  return NextResponse.json({ ok: true, repaid: repayAmount.toFixed(2), outstanding: newOutstanding, status: newStatus, reference: ref });
}
