"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";

export function LoanActions({ id, status }: { id: number; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(next: string) {
    setBusy(true);
    await fetch("/api/loans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
    setBusy(false);
    router.refresh();
  }

  if (!["pending", "approved", "active"].includes(status)) {
    return <span className="text-xs text-ink-600/50">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "pending" ? (
        <>
          <Button type="button" className="px-3 py-1.5 text-xs" disabled={busy} onClick={() => setStatus("approved")}>
            Approve
          </Button>
          <Button type="button" variant="danger" className="px-3 py-1.5 text-xs" disabled={busy} onClick={() => setStatus("rejected")}>
            Reject
          </Button>
        </>
      ) : null}
      {status === "active" ? (
        <Button type="button" variant="secondary" className="px-3 py-1.5 text-xs" disabled={busy} onClick={() => setStatus("paid_off")}>
          Mark paid
        </Button>
      ) : null}
    </div>
  );
}
