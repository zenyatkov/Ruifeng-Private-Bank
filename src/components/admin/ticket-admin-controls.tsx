"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Select, Textarea } from "@/components/ui";

export function TicketAdminControls({
  ticket,
}: {
  ticket: { id: number; status: string; priority: string; adminReply: string | null };
}) {
  const router = useRouter();
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [reply, setReply] = useState(ticket.adminReply || "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await fetch("/api/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: ticket.id,
        status,
        priority,
        adminReply: reply,
      }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Select className="py-1.5 text-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </Select>
        <Select className="py-1.5 text-xs" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </Select>
      </div>
      <Textarea
        className="min-h-20 text-xs"
        placeholder="Admin reply"
        value={reply}
        onChange={(e) => setReply(e.target.value)}
      />
      <Button type="button" className="w-full text-xs" disabled={busy} onClick={save}>
        {busy ? "Saving…" : "Update ticket"}
      </Button>
    </div>
  );
}
