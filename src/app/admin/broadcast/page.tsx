"use client";

import { FormEvent, useState } from "react";
import { Megaphone } from "lucide-react";
import { Alert, Button, Input, Label, Select, Textarea, PageHeader, Panel } from "@/components/ui";

export default function BroadcastPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setResult("");
    const res = await fetch("/api/admin/broadcast", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message, type }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) { setResult(`✓ Broadcast sent to ${data.sentTo} users.`); setTitle(""); setMessage(""); }
    else setResult(data.error || "Failed");
  }

  const templates = [
    { t: "Scheduled Maintenance", m: "瑞峯 RuiFeng Private Bank will undergo scheduled maintenance on [DATE] from [TIME] to [TIME] SGT. Online banking may be temporarily unavailable. We apologize for the inconvenience." },
    { t: "New Feature Available", m: "We're pleased to announce [FEATURE] is now available in your dashboard. Log in to explore the new capabilities." },
    { t: "Security Advisory", m: "For your security, please be aware of phishing attempts. 瑞峯 RuiFeng will never request your password or PIN via email or phone." },
    { t: "Rate Update", m: "Interest rates have been updated. Please check your account for the latest rates effective [DATE]." },
  ];

  return (
    <div>
      <PageHeader title="Broadcast Messages" subtitle="Send notifications to all users." />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Compose broadcast">
          <form onSubmit={onSubmit} className="space-y-4">
            <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Notification title" /></div>
            <div><Label>Message</Label><Textarea value={message} onChange={e => setMessage(e.target.value)} required placeholder="Message to all users..." className="min-h-32" /></div>
            <div><Label>Type</Label>
              <Select value={type} onChange={e => setType(e.target.value)}>
                <option value="info">Info</option><option value="alert">Alert</option><option value="success">Success</option>
              </Select>
            </div>
            {result && <p className={`text-sm font-semibold ${result.startsWith("✓") ? "text-jade-600" : "text-vermillion-500"}`}>{result}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              <Megaphone className="h-4 w-4" />{loading ? "Sending..." : "Send broadcast to all users"}
            </Button>
          </form>
        </Panel>
        <Panel title="Quick templates">
          <div className="space-y-2">
            {templates.map((tpl, i) => (
              <button key={i} type="button" onClick={() => { setTitle(tpl.t); setMessage(tpl.m); }}
                className="w-full rounded-xl border border-ink-900/5 bg-rice-50 p-3 text-left hover:border-jade-500/20 transition">
                <p className="text-sm font-semibold text-ink-900">{tpl.t}</p>
                <p className="text-xs text-ink-600/60 mt-1 line-clamp-2">{tpl.m}</p>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
