"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BellOff, X } from "lucide-react";
import { Button } from "@/components/ui";

export function NotificationActions() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markAllRead() {
    setLoading(true);
    await fetch("/api/notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setLoading(false); router.refresh();
  }

  return (
    <Button variant="secondary" onClick={markAllRead} disabled={loading}>
      <BellOff className="h-4 w-4" />{loading ? "Marking…" : "Mark all read"}
    </Button>
  );
}

export function NotificationItem({ notification }: {
  notification: { id: number; title: string; body: string; type: string | null; isRead: boolean; createdAt: Date };
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [read, setRead] = useState(notification.isRead);

  async function toggleRead() {
    const newState = !read;
    setRead(newState);
    await fetch("/api/notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: notification.id, isRead: newState }),
    });
    router.refresh();
  }

  const typeColors: Record<string, string> = {
    success: "border-l-jade-500 bg-jade-500/5",
    alert: "border-l-vermillion-500 bg-vermillion-500/5",
    info: "border-l-sky-500 bg-sky-50",
  };

  return (
    <div className={`rounded-xl border-l-4 transition ${typeColors[notification.type || "info"] || "border-l-sky-500 bg-sky-50"} ${read ? "opacity-60" : ""}`}>
      <button onClick={() => { setExpanded(!expanded); if (!read) toggleRead(); }} className="w-full text-left p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink-900">{notification.title}</p>
            <p className="mt-0.5 text-xs text-ink-600/50">{new Date(notification.createdAt).toLocaleString()}</p>
          </div>
          {!read && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-jade-500 animate-pulse-jade" />}
        </div>
        {expanded && (
          <div className="mt-3 border-t border-ink-900/5 pt-3">
            <p className="text-sm text-ink-700">{notification.body}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={(e) => { e.stopPropagation(); toggleRead(); }}
                className="text-xs font-semibold text-jade-600 hover:text-jade-700">
                {read ? "Mark unread" : "Mark read"}
              </button>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}

export function playNotificationSound(type: "success" | "error" | "info" = "success") {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    gain.gain.value = 0.08;
    if (type === "success") {
      osc.frequency.value = 880; osc.type = "sine"; osc.start();
      setTimeout(() => { osc.frequency.value = 1100; }, 100);
      setTimeout(() => { osc.frequency.value = 1320; }, 200);
      setTimeout(() => { gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5); }, 300);
      setTimeout(() => { osc.stop(); ctx.close(); }, 600);
    } else if (type === "error") {
      osc.frequency.value = 400; osc.type = "square"; osc.start();
      setTimeout(() => { osc.frequency.value = 300; }, 150);
      setTimeout(() => { gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4); }, 300);
      setTimeout(() => { osc.stop(); ctx.close(); }, 500);
    } else {
      osc.frequency.value = 660; osc.type = "sine"; osc.start();
      setTimeout(() => { gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3); }, 200);
      setTimeout(() => { osc.stop(); ctx.close(); }, 400);
    }
  } catch { /* silent */ }
}
