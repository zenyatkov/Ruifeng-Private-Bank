"use client";

import { useState } from "react";
import { Eye, X } from "lucide-react";
import { Logo } from "@/components/logo";

export function AdminReceiptView({ data }: { data: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);
  if (!open) return <button onClick={() => setOpen(true)} className="text-xs font-semibold text-jade-600 hover:text-jade-700 flex items-center gap-1"><Eye className="h-3 w-3" />View</button>;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink-950/50 p-4" onClick={() => setOpen(false)}>
      <div className="card-shadow w-full max-w-md rounded-3xl bg-white p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-ink-900/8 pb-3 mb-4">
          <Logo /><button onClick={() => setOpen(false)} className="rounded-lg bg-rice-100 p-1.5 hover:bg-rice-200"><X className="h-4 w-4" /></button>
        </div>
        <p className="text-[10px] uppercase tracking-wider text-ink-600/40 mb-3">Transaction Receipt</p>
        <div className="space-y-2">
          {Object.entries(data).filter(([, v]) => typeof v !== "object" && v).map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm border-b border-ink-900/5 pb-1.5">
              <span className="text-ink-600/60 capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
              <span className="font-semibold text-ink-900 text-right max-w-[55%] break-all">{String(v)}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-[9px] text-ink-600/30">瑞峯 RuiFeng Private Bank · Confidential</p>
      </div>
    </div>
  );
}
