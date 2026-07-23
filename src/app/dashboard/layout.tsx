import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { eq, and } from "drizzle-orm";
import { DashboardShell } from "@/components/dashboard-shell";
import { UserPrefsProvider } from "@/components/user-context";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { seedIfNeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await seedIfNeeded();
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const unread = await db.select().from(notifications)
    .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));

  return (
    <UserPrefsProvider value={{ lang: user.preferredLanguage, currency: user.preferredCurrency, firstName: user.firstName, lastName: user.lastName }}>
      <DashboardShell user={user} notificationsCount={unread.length}>
        {children}
      </DashboardShell>
    </UserPrefsProvider>
  );
}
