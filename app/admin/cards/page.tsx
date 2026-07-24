import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cards, users } from "@/db/schema";
import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { AdminCardActions } from "@/components/admin/card-admin-actions";
import { AdminDeleteButtonWrapper } from "@/components/admin/admin-delete-button-wrapper";
import { getCurrentUser } from "@/lib/auth";
import { t } from "@/lib/i18n";


export default async function AdminCardsPage() {
  const user = await getCurrentUser();
  const lang = user?.preferredLanguage || "en";
  const rows = await db
    .select({
      id: cards.id, cardNumberMasked: cards.cardNumberMasked, cardholderName: cards.cardholderName,
      type: cards.type, status: cards.status, network: cards.network, creditLimit: cards.creditLimit,
      cardArt: cards.cardArt, createdAt: cards.createdAt,
      firstName: users.firstName, lastName: users.lastName, email: users.email, userId: cards.userId,
    })
    .from(cards)
    .leftJoin(users, eq(cards.userId, users.id))
    .orderBy(desc(cards.createdAt));

  return (
    <div>
      <PageHeader title={t(lang, "adminCardsManagement") || "Cards Management"} subtitle="Approve, flag, delete cards." />
      <Panel>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Client</th><th>Card</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id}>
                  <td><p className="font-medium">{c.firstName} {c.lastName}</p><p className="text-xs text-ink-600/60">{c.email}</p></td>
                  <td><p className="font-mono text-sm">{c.cardNumberMasked}</p><p className="text-xs text-ink-600/60">{c.network}</p></td>
                  <td className="capitalize">{c.type}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <AdminCardActions id={c.id} status={c.status} />
                      <AdminDeleteButtonWrapper type="card" id={c.id} />
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
