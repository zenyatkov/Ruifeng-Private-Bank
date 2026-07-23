"use client";

import { useState } from "react";
import { FileText, X, Download } from "lucide-react";
import { Logo } from "@/components/logo";

export function ViewReceiptButton({ receiptData }: { receiptData: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);

  function downloadTxt() {
    const lines = Object.entries(receiptData)
      .filter(([k]) => typeof receiptData[k] !== "object")
      .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}: ${v}`);
    const content = `瑞峯 RuiFeng Private Bank — Transaction Receipt\n${"=".repeat(50)}\n${lines.join("\n")}\n${"=".repeat(50)}\nCONFIDENTIAL`;
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `Receipt_${(receiptData.reference as string) || "TX"}.txt`; a.click();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-[11px] font-semibold text-jade-600 hover:text-jade-700 transition">
        <FileText className="h-3 w-3" /> Receipt
      </button>
    );
  }

  const entries = Object.entries(receiptData).filter(([, v]) => typeof v !== "object" && v !== "—" && v);

  return (
    <div className="mt-3 rounded-2xl border border-ink-900/10 bg-white p-5 card-shadow animate-slide-in">
      <div className="flex items-center justify-between border-b border-ink-900/8 pb-3 mb-4">
        <Logo compact={false} />
        <div className="flex items-center gap-2">
          <button onClick={downloadTxt} className="rounded-lg bg-rice-100 p-1.5 hover:bg-rice-200 transition" title="Download"><Download className="h-4 w-4 text-ink-600" /></button>
          <button onClick={() => setOpen(false)} className="rounded-lg bg-rice-100 p-1.5 hover:bg-rice-200 transition"><X className="h-4 w-4 text-ink-600" /></button>
        </div>
      </div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-ink-600/40 mb-3">Digital Receipt</p>
      <div className="space-y-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex justify-between text-sm border-b border-ink-900/5 pb-1.5 last:border-0">
            <span className="text-ink-600/60 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
            <span className="font-semibold text-ink-900 text-right max-w-[55%] break-all">{String(value)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-ink-900/5 text-center">
        <p className="text-[9px] text-ink-600/30">瑞峯 RuiFeng Private Bank Ltd · MAS Regulated · Digital Receipt</p>
      </div>
    </div>
  );
}
