"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

type DeleteType = "receipt" | "loan" | "account" | "bill_payment" | "notification" | "transaction" | "card" | "investment" | "beneficiary" | "ticket";

export function AdminDeleteButton({
  type,
  id,
  label,
  onSuccess,
}: {
  type: DeleteType;
  id: number;
  label?: string;
  onSuccess?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || data.message || "Failed to delete");
        return;
      }
      setConfirming(false);
      onSuccess?.();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-vermillion-600 font-medium">Confirm?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="rounded-lg bg-vermillion-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-vermillion-700 transition disabled:opacity-50"
        >
          {loading ? "Deleting..." : "Yes, delete"}
        </button>
        <button
          onClick={() => { setConfirming(false); setError(""); }}
          className="rounded-lg border border-ink-900/15 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700 hover:bg-rice-100 transition"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-vermillion-500">{error}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-lg border border-vermillion-500/20 bg-vermillion-50 px-2 py-1 text-xs font-semibold text-vermillion-600 hover:bg-vermillion-100 transition flex items-center gap-1"
      title={`Delete ${type} #${id}`}
    >
      <Trash2 className="h-3 w-3" />
      {label || "Delete"}
    </button>
  );
}
