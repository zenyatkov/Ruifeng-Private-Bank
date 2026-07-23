"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui";

export function TransactionActions({ id, status }: { id: number; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(next: string) {
    setBusy(true);
    await fetch("/api/admin/transactions", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
    setBusy(false); router.refresh();
  }

  if (status !== "pending" && status !== "flagged") {
    return <span className="text-xs text-ink-600/40">No actions available</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" className="px-3 py-1.5 text-xs" disabled={busy} onClick={() => setStatus("completed")}>✓ Approve</Button>
      <Button type="button" variant="danger" className="px-3 py-1.5 text-xs" disabled={busy} onClick={() => setStatus("failed")}>✗ Reject</Button>
      {status !== "flagged" && <Button type="button" variant="secondary" className="px-3 py-1.5 text-xs" disabled={busy} onClick={() => setStatus("flagged")}>⚑ Flag</Button>}
    </div>
  );
}

export function TransactionDetailToggle({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(v => !v)} className="mt-2 flex items-center gap-1 text-xs font-semibold text-jade-600 hover:text-jade-700">
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {open ? "Hide details" : "View full details"}
      </button>
      {open && children}
    </div>
  );
}
