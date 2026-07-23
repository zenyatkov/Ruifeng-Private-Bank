"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Panel, StatusBadge, Button, EmptyState } from "@/components/ui";

type Bill = { id: number; billerName: string; billerCategory: string; referenceNumber: string; amount: string; currency: string; status: string; createdAt: string; firstName: string; lastName: string; email: string };

export default function AdminBillsPage() {
  const router = useRouter();
  const [bills, setBills] = useState<Bill[]>([]);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => { fetch("/api/admin/bills").then(r => r.json()).then(d => setBills(d.bills || [])); }, []);

  async function action(id: number, status: string) {
    setBusy(id);
    await fetch("/api/admin/bills", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    setBusy(null);
    fetch("/api/admin/bills").then(r => r.json()).then(d => setBills(d.bills || []));
    router.refresh();
  }

  return (
    <div>
      <PageHeader title="Bill Payments Review" subtitle="Approve or reject client bill payments." />
      <Panel>
        {bills.length === 0 ? <EmptyState title="No bill payments" /> : (
          <div className="space-y-3">
            {bills.map(b => (
              <div key={b.id} className={`rounded-xl border p-4 ${b.status === "pending" ? "border-bronze-400/30 bg-bronze-400/5" : "border-ink-900/5"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink-900">{b.billerName} ({b.billerCategory})</p>
                    <p className="text-xs text-ink-600/60">{b.firstName} {b.lastName} · {b.email}</p>
                    <p className="text-xs text-ink-600/50 mt-1">Ref: {b.referenceNumber || "—"} · {new Date(b.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{b.currency} {b.amount}</p>
                    <StatusBadge status={b.status} />
                  </div>
                </div>
                {b.status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <Button className="text-xs py-1 px-3" disabled={busy === b.id} onClick={() => action(b.id, "completed")}>Approve</Button>
                    <Button variant="danger" className="text-xs py-1 px-3" disabled={busy === b.id} onClick={() => action(b.id, "failed")}>Reject</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
