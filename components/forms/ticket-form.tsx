"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Alert, Button, Input, Label, Select, Textarea } from "@/components/ui";

export function TicketForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    subject: "",
    message: "",
    category: "General",
    priority: "medium",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed to submit");
      return;
    }
    setSuccess("Your concierge request has been received.");
    setForm({ subject: "", message: "", category: "General", priority: "medium" });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <Alert>{error}</Alert> : null}
      {success ? <Alert type="success">{success}</Alert> : null}
      <div>
        <Label>Subject</Label>
        <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Category</Label>
          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option>General</option>
            <option>Transfers</option>
            <option>Cards</option>
            <option>Limits</option>
            <option>Investments</option>
            <option>Lending</option>
            <option>Lifestyle</option>
          </Select>
        </div>
        <div>
          <Label>Priority</Label>
          <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
        </div>
      </div>
      <div>
        <Label>Message</Label>
        <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Sending…" : "Contact concierge"}
      </Button>
    </form>
  );
}
