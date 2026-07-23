import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { and, eq } from "drizzle-orm";
import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { seedIfNeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await seedIfNeeded();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.role !== "relationship_manager") {
    redirect("/dashboard");
  }

  const unread = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));

  return (
    <DashboardShell user={user} notificationsCount={unread.length}>
      {children}
    </DashboardShell>
  );
}
