"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Alert, Button, Input, Label, Select } from "@/components/ui";
import { ASIAN_COUNTRIES, CLIENT_TIERS } from "@/lib/utils";

export function CreateUserForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "client",
    country: "Singapore",
    clientTier: "Private",
    kycStatus: "pending",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Add user
      </Button>
      {open ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/50 p-4">
          <div className="card-shadow max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6">
            <h3 className="font-display text-xl font-semibold">Create user</h3>
            <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
              {error ? (
                <div className="sm:col-span-2">
                  <Alert>{error}</Alert>
                </div>
              ) : null}
              <div>
                <Label>First name</Label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              </div>
              <div>
                <Label>Last name</Label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              </div>
              <div className="sm:col-span-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="client">Client</option>
                  <option value="relationship_manager">Relationship Manager</option>
                  <option value="admin">Admin</option>
                </Select>
              </div>
              <div>
                <Label>Tier</Label>
                <Select value={form.clientTier} onChange={(e) => setForm({ ...form, clientTier: e.target.value })}>
                  {CLIENT_TIERS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Country</Label>
                <Select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                  {ASIAN_COUNTRIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>KYC</Label>
                <Select value={form.kycStatus} onChange={(e) => setForm({ ...form, kycStatus: e.target.value })}>
                  <option value="pending">Pending</option>
                  <option value="review">Review</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Temp password</Label>
                <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div className="flex gap-3 sm:col-span-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Creating…" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function UserRowActions({
  user,
}: {
  user: {
    id: number;
    kycStatus: string;
    clientTier: string | null;
    isActive: boolean;
    role: string;
  };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, ...body }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Select
        className="min-w-28 py-1.5 text-xs"
        disabled={busy}
        value={user.kycStatus}
        onChange={(e) => patch({ kycStatus: e.target.value })}
      >
        <option value="pending">Pending</option>
        <option value="review">Review</option>
        <option value="verified">Verified</option>
        <option value="rejected">Rejected</option>
      </Select>
      <Select
        className="min-w-28 py-1.5 text-xs"
        disabled={busy}
        value={user.clientTier || "Private"}
        onChange={(e) => patch({ clientTier: e.target.value })}
      >
        {CLIENT_TIERS.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </Select>
      <Button
        type="button"
        variant={user.isActive ? "danger" : "secondary"}
        className="px-3 py-1.5 text-xs"
        disabled={busy}
        onClick={() => patch({ isActive: !user.isActive })}
      >
        {user.isActive ? "Deactivate" : "Activate"}
      </Button>
      <DeleteUserButton userId={user.id} userEmail={""} />
    </div>
  );
}

export function DeleteUserButton({ userId, userEmail }: { userId: number; userEmail: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function doDelete() {
    setDeleting(true);
    const res = await fetch("/api/admin/users/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setDeleting(false);
    if (res.ok) {
      setConfirming(false);
      router.refresh();
    }
  }

  return (
    <>
      <button type="button" onClick={() => setConfirming(true)} className="px-3 py-1.5 text-xs rounded-full border border-vermillion-500/30 bg-vermillion-500/5 text-vermillion-600 font-semibold hover:bg-vermillion-500/10 transition">
        Delete
      </button>
      {confirming && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/50 p-4">
          <div className="card-shadow w-full max-w-md rounded-3xl bg-white p-6 text-center">
            <p className="text-lg font-semibold text-vermillion-600">⚠ Delete User?</p>
            <p className="mt-2 text-sm text-ink-600/70">This is permanent. All data, accounts, transactions, cards, and loans will be erased.</p>
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={() => setConfirming(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="button" onClick={doDelete} disabled={deleting} className="flex-1 rounded-full bg-vermillion-500 text-white font-semibold py-2 px-4 hover:bg-vermillion-600 transition">
                {deleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
