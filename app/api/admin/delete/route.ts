import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, cards, transactions, loans, investments, notifications, receipts, supportTickets, billPayments, beneficiaries } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-log";

export async function DELETE(request: Request) {
  const { user, error } = await requireUser(["admin"]);
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const body = await request.json();
  const { type, id } = body;
  if (!type || !id) return NextResponse.json({ error: "type and id required" }, { status: 400 });

  const recordId = Number(id);
  let deleted = "";

  try {
    switch (type) {
      case "receipt":
        await db.delete(receipts).where(eq(receipts.id, recordId));
        deleted = "receipt";
        break;
      case "loan":
        await db.delete(loans).where(eq(loans.id, recordId));
        deleted = "loan";
        break;
      case "account": {
        // Delete dependent records first
        await db.delete(transactions).where(eq(transactions.accountId, recordId));
        await db.delete(cards).where(eq(cards.accountId, recordId));
        await db.delete(billPayments).where(eq(billPayments.accountId, recordId));
        await db.delete(accounts).where(eq(accounts.id, recordId));
        deleted = "account";
        break;
      }
      case "bill_payment":
        await db.delete(billPayments).where(eq(billPayments.id, recordId));
        deleted = "bill_payment";
        break;
      case "notification":
        await db.delete(notifications).where(eq(notifications.id, recordId));
        deleted = "notification";
        break;
      case "transaction":
        await db.delete(transactions).where(eq(transactions.id, recordId));
        deleted = "transaction";
        break;
      case "card":
        await db.delete(cards).where(eq(cards.id, recordId));
        deleted = "card";
        break;
      case "investment":
        await db.delete(investments).where(eq(investments.id, recordId));
        deleted = "investment";
        break;
      case "beneficiary":
        await db.delete(beneficiaries).where(eq(beneficiaries.id, recordId));
        deleted = "beneficiary";
        break;
      case "ticket":
        await db.delete(supportTickets).where(eq(supportTickets.id, recordId));
        deleted = "ticket";
        break;
      default:
        return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }

    await logAdminAction({ adminId: user.id, action: `delete_${type}`, targetType: type, details: `Deleted ${type} #${recordId}` });
    return NextResponse.json({ ok: true, deleted });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
