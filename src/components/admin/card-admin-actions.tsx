"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";

export function AdminCardActions({ id, status }: { id: number; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function action(newStatus: string) {
    setBusy(true);
    await fetch("/api/cards", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: newStatus }) });
    setBusy(false); router.refresh();
  }

  async function deleteCard() {
    if (!confirm("Delete this card permanently?")) return;
    setBusy(true);
    await fetch(`/api/cards?id=${id}`, { method: "DELETE" });
    setBusy(false); router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-1">
      {status === "pending" && <Button type="button" className="px-2 py-1 text-xs" disabled={busy} onClick={() => action("active")}>Approve</Button>}
      {status === "active" && <Button type="button" variant="secondary" className="px-2 py-1 text-xs" disabled={busy} onClick={() => action("blocked")}>Block</Button>}
      {status === "blocked" && <Button type="button" className="px-2 py-1 text-xs" disabled={busy} onClick={() => action("active")}>Unblock</Button>}
      {(status === "active" || status === "pending") && <Button type="button" variant="secondary" className="px-2 py-1 text-xs" disabled={busy} onClick={() => action("flagged")}>Flag</Button>}
      <Button type="button" variant="danger" className="px-2 py-1 text-xs" disabled={busy} onClick={deleteCard}>Delete</Button>
    </div>
  );
}
