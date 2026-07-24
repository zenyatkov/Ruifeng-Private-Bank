import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { receipts, users } from "@/db/schema";
import { formatDateTime } from "@/lib/utils";
import { PageHeader, Panel, EmptyState } from "@/components/ui";
import { AdminReceiptView } from "@/components/admin/receipt-view";
import { AdminDeleteButtonWrapper } from "@/components/admin/admin-delete-button-wrapper";
import { getCurrentUser } from "@/lib/auth";
import { t } from "@/lib/i18n";


export default async function AdminReceiptsPage() {
  const user = await getCurrentUser();
  const lang = user?.preferredLanguage || "en";
  const rows = await db.select({
    id: receipts.id, type: receipts.type, data: receipts.data, createdAt: receipts.createdAt,
    userId: receipts.userId, firstName: users.firstName, lastName: users.lastName, email: users.email,
  }).from(receipts).leftJoin(users, eq(receipts.userId, users.id)).orderBy(desc(receipts.createdAt)).limit(100);

  return (
    <div>
      <PageHeader title={t(lang, "adminAllReceipts") || "All Receipts"} subtitle={`${rows.length} receipts`} />
      <Panel>
        {rows.length === 0 ? <EmptyState title="No receipts" /> : (
          <div className="space-y-2">
            {rows.map(r => (
              <div key={r.id} className="rounded-xl border border-ink-900/5 bg-white p-4 hover-lift">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink-900 capitalize">{r.type.replaceAll("_", " ")} receipt</p>
                    <p className="text-xs text-ink-600/60">{r.firstName} {r.lastName} · {r.email}</p>
                    <p className="text-xs text-ink-600/40">{formatDateTime(r.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AdminReceiptView data={r.data as Record<string, string>} />
                    <AdminDeleteButtonWrapper type="receipt" id={r.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
