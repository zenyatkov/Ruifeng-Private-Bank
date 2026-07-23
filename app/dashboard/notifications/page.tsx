import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { EmptyState, PageHeader, Panel } from "@/components/ui";
import { NotificationActions, NotificationItem } from "@/components/notifications-client";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const rows = await db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)).limit(50);
  const unread = rows.filter(n => !n.isRead).length;

  return (
    <div>
      <PageHeader title="Notifications · 通知" subtitle={`${unread} unread`} actions={<NotificationActions />} />
      <Panel>
        {rows.length === 0 ? (
          <EmptyState title="No notifications" description="You're all caught up." />
        ) : (
          <div className="space-y-2">
            {rows.map(n => <NotificationItem key={n.id} notification={n} />)}
          </div>
        )}
      </Panel>
    </div>
  );
}
