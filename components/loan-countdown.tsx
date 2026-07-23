"use client";

import { useEffect, useState } from "react";

export function LoanCountdown({ endDate }: { endDate: string | Date | null }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!endDate) return;
    const target = new Date(endDate).getTime();
    function update() {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) { setTimeLeft("Due now"); return; }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${days}d ${hours}h ${mins}m`);
    }
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (!endDate) return null;
  return (
    <div className="inline-flex items-center gap-2 rounded-lg bg-ink-900 px-3 py-1.5 text-xs text-jade-300">
      <span className="h-1.5 w-1.5 rounded-full bg-jade-400 animate-pulse-jade" />
      <span>Due in: <strong>{timeLeft || "Calculating…"}</strong></span>
    </div>
  );
}
