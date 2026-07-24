import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, users } from "@/db/schema";
import { ACCOUNT_TYPE_LABELS, formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { AccountAdminActions, CreateAccountAdminForm } from "@/components/admin/account-admin-controls";
import { AdminDeleteButtonWrapper } from "@/components/admin/admin-delete-button-wrapper";

export default async function AdminAccountsPage() {
  const rows = await db.select({
    id: accounts.id, userId: accounts.userId, accountNumber: accounts.accountNumber,
    type: accounts.type, currency: accounts.currency, balance: accounts.balance,
    status: accounts.status, nickname: accounts.nickname, openedAt: accounts.openedAt,
    firstName: users.firstName, lastName: users.lastName, email: users.email,
  }).from(accounts).leftJoin(users, eq(accounts.userId, users.id)).orderBy(desc(accounts.openedAt));

  const clientUsers = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email }).from(users);
  const pendingAccounts = rows.filter(a => a.status === "pending");

  return (
    <div>
      <PageHeader title="Accounts Ledger" subtitle={`${pendingAccounts.length} pending approval`} actions={<CreateAccountAdminForm users={clientUsers} />} />

      {pendingAccounts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-bronze-500 mb-3">Pending Approval ({pendingAccounts.length})</h3>
          <div className="grid gap-3">
            {pendingAccounts.map(a => (
              <Panel key={a.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{a.firstName} {a.lastName} · {a.email}</p>
                    <p className="text-xs text-ink-600/60">{a.accountNumber} · {ACCOUNT_TYPE_LABELS[a.type] || a.type} · {a.currency}</p>
                  </div>
                  <AccountAdminActions account={{ id: a.id, status: a.status }} />
                </div>
              </Panel>
            ))}
          </div>
        </div>
      )}

      <Panel>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Account</th><th>Client</th><th>Type</th><th>Balance</th><th>Status</th><th>Opened</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map(a => (
                <tr key={a.id}>
                  <td><p className="font-semibold">{a.nickname || a.accountNumber}</p><p className="text-xs text-ink-600/60">{a.accountNumber}</p></td>
                  <td><p className="font-medium">{a.firstName} {a.lastName}</p><p className="text-xs text-ink-600/60">{a.email}</p></td>
                  <td>{ACCOUNT_TYPE_LABELS[a.type] || a.type}</td>
                  <td className="font-semibold">{formatCurrency(a.balance, a.currency)}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td className="text-xs">{formatDate(a.openedAt)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <AccountAdminActions account={{ id: a.id, status: a.status }} />
                      <AdminDeleteButtonWrapper type="account" id={a.id} />
                    </div>
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
