"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { PageHeader, Panel, EmptyState } from "@/components/ui";
import { Logo } from "@/components/logo";

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Array<Record<string, unknown>>>([]);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);

  useEffect(() => { fetch("/api/receipts").then(r => r.json()).then(d => setReceipts(d.receipts || [])); }, []);

  if (selected) {
    const data = (selected.data || {}) as Record<string, string>;
    return (
      <div className="mx-auto max-w-lg py-8">
        <div className="card-shadow rounded-3xl bg-white p-6">
          <div className="flex items-center justify-between border-b border-ink-900/8 pb-4"><Logo /><p className="text-xs uppercase tracking-wider text-ink-600/50">Receipt</p></div>
          <div className="mt-4 space-y-2">
            {Object.entries(data).map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-ink-900/5 pb-1.5 text-sm">
                <span className="text-ink-600 capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                <span className="font-semibold text-ink-900">{String(v)}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-[10px] text-ink-600/30">瑞峯 RuiFeng Private Bank · Digital Receipt</p>
        </div>
        <button onClick={() => setSelected(null)} className="btn-secondary w-full mt-4 text-sm">Back to receipts</button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Receipts · 收据" subtitle="View all your transaction receipts." />
      <Panel>
        {receipts.length === 0 ? <EmptyState title="No receipts yet" description="Transaction receipts will appear here." /> : (
          <div className="space-y-2">
            {receipts.map((r, i) => (
              <button key={i} onClick={() => setSelected(r)} className="w-full rounded-xl border border-ink-900/5 bg-rice-50 p-4 flex items-center gap-3 text-left hover:border-jade-500/20 transition">
                <FileText className="h-5 w-5 text-jade-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-900 capitalize">{String(r.type)} receipt</p>
                  <p className="text-xs text-ink-600/50">{new Date(String(r.createdAt)).toLocaleString()}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
