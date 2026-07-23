import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { adminLogs, users } from "@/db/schema";
import { formatDateTime } from "@/lib/utils";
import { EmptyState, PageHeader, Panel } from "@/components/ui";

export default async function AdminLogsPage() {
  const rows = await db
    .select({
      id: adminLogs.id,
      action: adminLogs.action,
      targetType: adminLogs.targetType,
      targetId: adminLogs.targetId,
      details: adminLogs.details,
      createdAt: adminLogs.createdAt,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(adminLogs)
    .leftJoin(users, eq(adminLogs.adminId, users.id))
    .orderBy(desc(adminLogs.createdAt))
    .limit(200);

  return (
    <div>
      <PageHeader title="Audit logs" subtitle="Immutable trail of privileged administrative actions." />
      <Panel>
        {rows.length === 0 ? (
          <EmptyState title="No audit events" description="Admin actions will appear here." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDateTime(log.createdAt)}</td>
                    <td>
                      <p className="font-medium">
                        {log.firstName} {log.lastName}
                      </p>
                      <p className="text-xs text-ink-600/60">{log.email}</p>
                    </td>
                    <td className="font-semibold">{log.action}</td>
                    <td>
                      {log.targetType || "—"}
                      {log.targetId ? ` #${log.targetId}` : ""}
                    </td>
                    <td className="max-w-md text-xs text-ink-700">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
