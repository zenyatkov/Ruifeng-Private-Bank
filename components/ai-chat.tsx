"use client";

import { FormEvent, useState, useRef, useEffect } from "react";
import { Bot, Send, X, MessageCircle } from "lucide-react";
import { useUserPrefs } from "@/components/user-context";

type Message = { role: "user" | "bot"; text: string; time: string };

export function AiChatWidget() {
  const { lang } = useUserPrefs();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Welcome to 瑞峯 RuiFeng AI Assistant! Ask me about transfers, cards, loans, investments, FX, bills, crypto, or anything else.", time: new Date().toLocaleTimeString() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { listRef.current?.scrollTo(0, listRef.current.scrollHeight); }, [messages]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", text: input, time: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, userMsg]);
    setInput(""); setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, lang }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "bot", text: data.reply || "I couldn't process that.", time: new Date().toLocaleTimeString() }]);
    } catch {
      setMessages(prev => [...prev, { role: "bot", text: "Connection error. Please try again.", time: new Date().toLocaleTimeString() }]);
    }
    setLoading(false);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-ink-900 text-jade-300 shadow-xl hover:bg-ink-800 transition glow-jade"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[60] w-[360px] max-w-[calc(100vw-3rem)] rounded-3xl border border-ink-900/10 bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-ink-900 px-4 py-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-jade-500/20"><Bot className="h-4 w-4 text-jade-300" /></div>
            <div><p className="text-sm font-semibold text-rice-50">瑞峯 AI Assistant</p><p className="text-[10px] text-jade-300">Online · Always available</p></div>
          </div>

          {/* Messages */}
          <div ref={listRef} className="h-72 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-jade-500 text-white rounded-br-md" : "bg-rice-100 text-ink-800 rounded-bl-md"}`}>
                  <p>{m.text}</p>
                  <p className={`text-[10px] mt-1 ${m.role === "user" ? "text-white/60" : "text-ink-600/40"}`}>{m.time}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start"><div className="rounded-2xl bg-rice-100 px-3 py-2 text-sm text-ink-600"><span className="animate-pulse">Typing…</span></div></div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={send} className="border-t border-ink-900/5 p-3 flex gap-2">
            <input
              value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything…"
              className="flex-1 rounded-xl bg-rice-50 px-3 py-2 text-sm outline-none focus:ring-1 ring-jade-500"
            />
            <button type="submit" disabled={loading || !input.trim()} className="rounded-xl bg-jade-500 p-2 text-white hover:bg-jade-600 disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
