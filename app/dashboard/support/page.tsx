import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { supportTickets } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import { EmptyState, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { TicketForm } from "@/components/forms/ticket-form";
import { TicketReplyForm } from "@/components/forms/ticket-reply";

export default async function SupportPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const tickets = await db.select().from(supportTickets).where(eq(supportTickets.userId, user.id)).orderBy(desc(supportTickets.createdAt));

  return (
    <div>
      <PageHeader title="Concierge & Support" subtitle="Raise tickets, reply to responses, and track your requests." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="New request"><TicketForm /></Panel>
        <Panel title="Your tickets">
          {tickets.length === 0 ? <EmptyState title="No requests yet" /> : (
            <div className="space-y-4">
              {tickets.map(t => (
                <div key={t.id} className="rounded-2xl border border-ink-900/5 bg-rice-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-ink-900">{t.subject}</p>
                      <p className="mt-1 text-xs text-ink-600/60">{t.category} · {formatDateTime(t.createdAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      <StatusBadge status={t.priority} />
                      <StatusBadge status={t.status} />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-ink-700">{t.message}</p>

                  {/* Admin reply */}
                  {t.adminReply && (
                    <div className="mt-3 rounded-xl border border-jade-500/20 bg-white px-3 py-2 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wider text-jade-600">Bank Response</p>
                      <p className="mt-1 text-ink-800">{t.adminReply}</p>
                    </div>
                  )}

                  {/* User's follow-up reply */}
                  {t.userReply && (
                    <div className="mt-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">Your Reply</p>
                      <p className="mt-1 text-ink-800">{t.userReply}</p>
                    </div>
                  )}

                  {/* Reply form — show if admin has replied and ticket is not closed */}
                  {t.adminReply && t.status !== "closed" && (
                    <TicketReplyForm ticketId={t.id} />
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
