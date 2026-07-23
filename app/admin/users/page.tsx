import { desc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { formatDateTime } from "@/lib/utils";
import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { CreateUserForm, UserRowActions } from "@/components/admin/user-admin-controls";

export default async function AdminUsersPage() {
  const rows = await db.select().from(users).orderBy(desc(users.createdAt));

  return (
    <div>
      <PageHeader
        title="Clients & Staff"
        subtitle="Onboard users, manage KYC, tiers, and access across the platform."
        actions={<CreateUserForm />}
      />
      <Panel>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Role</th>
                <th>Market</th>
                <th>KYC</th>
                <th>Status</th>
                <th>Last login</th>
                <th>Controls</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td>
                    <p className="font-semibold">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-xs text-ink-600/60">{u.email}</p>
                    <p className="text-xs text-ink-600/50">{u.clientTier}</p>
                  </td>
                  <td className="capitalize">{u.role.replaceAll("_", " ")}</td>
                  <td>
                    {u.city ? `${u.city}, ` : ""}
                    {u.country}
                  </td>
                  <td>
                    <StatusBadge status={u.kycStatus} />
                  </td>
                  <td>
                    <StatusBadge status={u.isActive ? "active" : "closed"} />
                  </td>
                  <td>{formatDateTime(u.lastLoginAt)}</td>
                  <td>
                    <UserRowActions
                      user={{
                        id: u.id,
                        kycStatus: u.kycStatus,
                        clientTier: u.clientTier,
                        isActive: u.isActive,
                        role: u.role,
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
