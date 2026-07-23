import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { supportTickets } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import { EmptyState, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { TicketForm } from "@/components/forms/ticket-form";
import { TicketReplyForm } from "@/components/forms/ticket-reply";
import { t } from "@/lib/i18n";

export default async function SupportPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const lang = user.preferredLanguage || "en";
  const tickets = await db.select().from(supportTickets).where(eq(supportTickets.userId, user.id)).orderBy(desc(supportTickets.createdAt));

  return (
    <div>
      <PageHeader title={t(lang, "concierge")} subtitle={t(lang, "supportSubtitle")} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title={t(lang, "newRequest")}><TicketForm /></Panel>
        <Panel title={t(lang, "yourTickets")}>
          {tickets.length === 0 ? <EmptyState title={t(lang, "noRequestsYet")} /> : (
            <div className="space-y-4">
              {tickets.map(tk => (
                <div key={tk.id} className="rounded-2xl border border-ink-900/5 bg-rice-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-ink-900">{tk.subject}</p>
                      <p className="mt-1 text-xs text-ink-600/60">{tk.category} · {formatDateTime(tk.createdAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      <StatusBadge status={tk.priority} />
                      <StatusBadge status={tk.status} />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-ink-700">{tk.message}</p>

                  {tk.adminReply && (
                    <div className="mt-3 rounded-xl border border-jade-500/20 bg-white px-3 py-2 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wider text-jade-600">{t(lang, "bankResponse")}</p>
                      <p className="mt-1 text-ink-800">{tk.adminReply}</p>
                    </div>
                  )}

                  {tk.userReply && (
                    <div className="mt-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">{t(lang, "yourReply")}</p>
                      <p className="mt-1 text-ink-800">{tk.userReply}</p>
                    </div>
                  )}

                  {tk.adminReply && tk.status !== "closed" && (
                    <TicketReplyForm ticketId={tk.id} />
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
