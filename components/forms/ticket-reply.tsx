"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button, Textarea } from "@/components/ui";

export function TicketReplyForm({ ticketId }: { ticketId: number }) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setLoading(true);
    await fetch("/api/tickets", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ticketId, userReply: reply }),
    });
    setLoading(false); setReply(""); setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-2 text-xs font-semibold text-jade-600 hover:text-jade-700">
        Reply to this ticket →
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-2">
      <Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Type your reply..." className="min-h-20 text-sm" />
      <div className="flex gap-2">
        <Button type="button" variant="secondary" className="text-xs py-1" onClick={() => setOpen(false)}>Cancel</Button>
        <Button type="submit" className="text-xs py-1" disabled={loading || !reply.trim()}>
          {loading ? "Sending..." : "Send reply"}
        </Button>
      </div>
    </form>
  );
}
