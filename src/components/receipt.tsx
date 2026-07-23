"use client";

import { Logo } from "@/components/logo";

type ReceiptLine = { label: string; value: string };

export function TransactionReceipt({
  type,
  lines,
  status,
  onClose,
}: {
  type: "debit" | "credit";
  lines: ReceiptLine[];
  status: string;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-ink-900/10 bg-white p-6 card-shadow">
        {/* Header with logo */}
        <div className="flex items-center justify-between border-b border-ink-900/8 pb-4">
          <Logo compact={false} />
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-600/50">Transaction Receipt</p>
            <p className={`text-sm font-bold ${type === "credit" ? "text-jade-600" : "text-vermillion-500"}`}>
              {type === "credit" ? "CREDIT" : "DEBIT"}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div className="my-4 flex justify-center">
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
            status === "pending" ? "bg-bronze-400/15 text-bronze-600" :
            status === "completed" ? "bg-jade-500/10 text-jade-700" :
            "bg-vermillion-500/10 text-vermillion-600"
          }`}>
            {status === "pending" ? "⏳" : status === "completed" ? "✓" : "✗"}
            <span className="uppercase">{status}</span>
          </div>
        </div>

        {/* Lines */}
        <div className="space-y-2.5">
          {lines.map((line, i) => (
            <div key={i} className="flex justify-between border-b border-ink-900/5 pb-2 last:border-0">
              <span className="text-sm text-ink-600">{line.label}</span>
              <span className="text-sm font-semibold text-ink-900 text-right max-w-[60%] break-all">{line.value}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-ink-900/8 pt-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink-600/40">瑞峯 RuiFeng Private Bank</p>
          <p className="mt-1 text-[10px] text-ink-600/30">This is a digital receipt. Retain for your records.</p>
        </div>
      </div>

      <button onClick={onClose} className="btn-secondary w-full text-sm">Close receipt · 关闭</button>
    </div>
  );
}
