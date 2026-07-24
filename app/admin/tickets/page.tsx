import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { supportTickets, users } from "@/db/schema";
import { formatDateTime } from "@/lib/utils";
import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { TicketAdminControls } from "@/components/admin/ticket-admin-controls";
import { AdminDeleteButtonWrapper } from "@/components/admin/admin-delete-button-wrapper";

export default async function AdminTicketsPage() {
  const rows = await db
    .select({
      id: supportTickets.id,
      subject: supportTickets.subject,
      message: supportTickets.message,
      status: supportTickets.status,
      priority: supportTickets.priority,
      category: supportTickets.category,
      adminReply: supportTickets.adminReply,
      createdAt: supportTickets.createdAt,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(supportTickets)
    .leftJoin(users, eq(supportTickets.userId, users.id))
    .orderBy(desc(supportTickets.createdAt));

  return (
    <div>
      <PageHeader title="Support desk" subtitle="Resolve concierge and operational tickets for private clients." />
      <div className="grid gap-4">
        {rows.map((ticket) => (
          <Panel key={ticket.id}>
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xl font-semibold text-ink-900">{ticket.subject}</p>
                    <p className="mt-1 text-sm text-ink-600/70">
                      {ticket.firstName} {ticket.lastName} · {ticket.email}
                    </p>
                    <p className="mt-1 text-xs text-ink-600/50">
                      {ticket.category} · {formatDateTime(ticket.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <StatusBadge status={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                    <AdminDeleteButtonWrapper type="ticket" id={ticket.id} />
                  </div>
                </div>
                <p className="mt-4 text-sm text-ink-800">{ticket.message}</p>
              </div>
              <TicketAdminControls
                ticket={{
                  id: ticket.id,
                  status: ticket.status,
                  priority: ticket.priority,
                  adminReply: ticket.adminReply,
                }}
              />
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
