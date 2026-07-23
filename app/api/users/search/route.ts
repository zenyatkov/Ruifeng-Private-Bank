import { NextResponse } from "next/server";
import { and, eq, ilike, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { accounts, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { user, error } = await requireUser();
    if (!user) return NextResponse.json({ error }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    if (!q || q.length < 2) return NextResponse.json({ results: [] });

    // Search by email OR account number
    const matchedUsers = await db
      .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
      .from(users)
      .where(and(ne(users.id, user.id), eq(users.role, "client"), eq(users.isActive, true), ilike(users.email, `%${q}%`)))
      .limit(10);

    // Also search by account number
    const matchedAccounts = await db
      .select({ id: accounts.id, userId: accounts.userId, accountNumber: accounts.accountNumber, currency: accounts.currency, nickname: accounts.nickname })
      .from(accounts)
      .where(and(ilike(accounts.accountNumber, `%${q}%`), eq(accounts.status, "active")))
      .limit(10);

    // Get users for matched accounts
    const accountUserIds = matchedAccounts.filter(a => a.userId !== user.id).map(a => a.userId);
    const additionalUsers = accountUserIds.length > 0
      ? await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
          .from(users).where(and(eq(users.isActive, true), or(...accountUserIds.map(uid => eq(users.id, uid)))))
      : [];

    // Merge and dedupe
    const allUsers = [...matchedUsers];
    for (const u of additionalUsers) {
      if (!allUsers.find(x => x.id === u.id)) allUsers.push(u);
    }

    const results = [];
    for (const u of allUsers) {
      const accts = await db.select({ id: accounts.id, accountNumber: accounts.accountNumber, currency: accounts.currency, nickname: accounts.nickname })
        .from(accounts).where(and(eq(accounts.userId, u.id), eq(accounts.status, "active")));
      if (accts.length > 0) results.push({ ...u, accounts: accts });
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Users search error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
