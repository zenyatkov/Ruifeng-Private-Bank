"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { Eye, EyeOff, Lock, Wallet } from "lucide-react";
import { Button, Label, Select, Input } from "@/components/ui";
import { PinEntry } from "@/components/pin-entry";
import { playNotificationSound } from "@/components/notifications-client";

const CARD_ARTS = [
  { id: "jade-dragon", label: "Jade Dragon", css: "card-art-jade-dragon" },
  { id: "crimson-wave", label: "Crimson Wave", css: "card-art-crimson-wave" },
  { id: "ink-gold", label: "Ink & Gold", css: "card-art-ink-gold" },
  { id: "ocean-pearl", label: "Ocean Pearl", css: "card-art-ocean-pearl" },
  { id: "sakura", label: "Sakura", css: "card-art-sakura" },
  { id: "midnight", label: "Midnight", css: "card-art-midnight" },
];

export function IssueCardForm({ accounts }: { accounts: Array<{ id: number; nickname: string | null; accountNumber: string; currency: string }> }) {
  const router = useRouter();
  const [accountId, setAccountId] = useState(accounts[0]?.id?.toString() || "");
  const [type, setType] = useState("platinum");
  const [cardArt, setCardArt] = useState("jade-dragon");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function apply() {
    setLoading(true); setMessage("");
    const res = await fetch("/api/cards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId: Number(accountId), type, cardArt }) });
    setLoading(false);
    if (!res.ok) { const d = await res.json(); setMessage(d.error || "Failed"); return; }
    setMessage("Application submitted."); router.refresh();
  }

  if (accounts.length === 0) return <p className="text-sm text-ink-600/70">Open an account first.</p>;

  return (
    <div className="space-y-4">
      <div><Label>Linked account</Label><Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
        {accounts.map(a => <option key={a.id} value={a.id}>{a.nickname || a.accountNumber} ({a.currency})</option>)}
      </Select></div>
      <div><Label>Card tier</Label><Select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="debit">Debit</option><option value="credit">Credit</option><option value="platinum">Platinum Infinite</option><option value="black">Black World Elite</option>
      </Select></div>
      <div><Label>Card design</Label>
        <div className="grid grid-cols-3 gap-2">{CARD_ARTS.map(art => (
          <button key={art.id} type="button" onClick={() => setCardArt(art.id)} className={`rounded-xl p-2 h-12 text-[9px] text-white font-semibold ${art.css} ring-2 transition ${cardArt === art.id ? "ring-jade-400 scale-105" : "ring-transparent"}`}>{art.label}</button>
        ))}</div>
      </div>
      {message && <p className="text-sm font-semibold text-jade-600">{message}</p>}
      <Button type="button" onClick={apply} disabled={loading} className="w-full">{loading ? "..." : "Apply"}</Button>
    </div>
  );
}

export function CardDisplay({ card, accounts }: {
  card: {
    id: number; cardNumberMasked: string; cardholderName: string; type: string; status: string;
    expiryMonth: number; expiryYear: number; cvv: string | null; fullCardNumber: string | null;
    creditLimit: string | null; spentThisMonth: string | null; network: string | null; cardArt: string | null;
    accountBalance?: string; accountCurrency?: string;
  };
  accounts?: Array<{ id: number; nickname: string | null; accountNumber: string; currency: string; balance: string }>;
}) {
  const router = useRouter();
  const [numberVisible, setNumberVisible] = useState(false);
  const [cvvVisible, setCvvVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showFund, setShowFund] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [fundAccount, setFundAccount] = useState(accounts?.[0]?.id?.toString() || "");
  const [showPin, setShowPin] = useState(false);
  const [fundMsg, setFundMsg] = useState("");

  const artClass = CARD_ARTS.find(a => a.id === card.cardArt)?.css || "card-art-jade-dragon";

  async function blockCard() {
    setBusy(true);
    await fetch("/api/cards", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: card.id, status: "blocked" }) });
    setBusy(false); router.refresh();
  }

  async function fundCard() {
    setShowPin(false); setBusy(true); setFundMsg("");
    const res = await fetch("/api/cards/fund", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cardId: card.id, fromAccountId: Number(fundAccount), amount: fundAmount }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setFundMsg(data.error || "Failed"); playNotificationSound("error"); return; }
    playNotificationSound("success"); setFundMsg(`Funded! Card balance: ${data.cardBalance || "updated"}`); setFundAmount(""); router.refresh();
  }

  if (card.status === "pending") {
    return (
      <div className={`relative overflow-hidden rounded-3xl p-6 text-white/60 ${artClass}`}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center"><Lock className="h-8 w-8 mx-auto mb-2 text-white/50" /><p className="text-sm font-semibold text-white/70">Processing</p><p className="text-xs text-white/40 mt-1">{card.type} · {card.network}</p></div>
        </div>
        <p className="text-xs opacity-20">•••• •••• •••• ••••</p><p className="mt-16 text-sm opacity-20">{card.cardholderName}</p>
      </div>
    );
  }

  const num = card.fullCardNumber || "4580000000001234";
  const displayNum = numberVisible ? num.replace(/(.{4})/g, "$1 ").trim() : `•••• •••• •••• ${num.slice(-4)}`;
  const bal = card.accountBalance || "0";
  const ccy = card.accountCurrency || "USD";

  return (
    <div className="space-y-2">
      {showPin && <PinEntry onVerified={fundCard} onCancel={() => setShowPin(false)} />}
      <div className={`relative overflow-hidden rounded-3xl p-5 text-white ${artClass}`}>
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5" />
        {/* Header with balance */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">{card.network}</p>
            <p className="mt-1 font-display text-lg font-bold">{ccy} {parseFloat(bal).toLocaleString(undefined,{minimumFractionDigits:2})}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.status==="active"?"bg-white/15":"bg-red-500/30"}`}>{card.status}</span>
        </div>
        {/* Card number */}
        <div className="mt-5 flex items-center gap-2">
          <p className="font-mono text-lg tracking-[0.10em] flex-1">{displayNum}</p>
          <button type="button" onClick={() => setNumberVisible(v=>!v)} className="rounded-lg bg-white/15 p-1.5 hover:bg-white/25"><Eye className={`h-4 w-4 ${numberVisible?"hidden":""}`}/><EyeOff className={`h-4 w-4 ${numberVisible?"":"hidden"}`}/></button>
        </div>
        {/* Details */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-[10px]">
          <div><p className="text-white/40 uppercase">Cardholder</p><p className="mt-0.5 text-xs font-semibold">{numberVisible?card.cardholderName:"•••••••"}</p></div>
          <div><p className="text-white/40 uppercase">Expiry</p><p className="mt-0.5 text-xs font-semibold">{numberVisible?`${String(card.expiryMonth).padStart(2,"0")}/${card.expiryYear}`:"••/••"}</p></div>
          <div><p className="text-white/40 uppercase">CVV</p>
            <div className="flex items-center gap-1 mt-0.5">
              <p className="text-xs font-semibold font-mono">{cvvVisible?(card.cvv||"***"):"•••"}</p>
              <button type="button" onClick={()=>setCvvVisible(v=>!v)} className="rounded bg-white/15 p-0.5 hover:bg-white/25"><Eye className={`h-3 w-3 ${cvvVisible?"hidden":""}`}/><EyeOff className={`h-3 w-3 ${cvvVisible?"":"hidden"}`}/></button>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px]">
          <div>
            <span className="text-white/40">Limit: </span>
            <span>{card.creditLimit?parseFloat(card.creditLimit).toLocaleString():"Linked"}</span>
            <span className="text-white/30 mx-1">·</span>
            <span className="text-white/40">Spent: </span>
            <span>{parseFloat(card.spentThisMonth||"0").toLocaleString()}</span>
          </div>
          <div className="flex gap-1">
            {accounts && accounts.length>0 && <button type="button" onClick={()=>setShowFund(v=>!v)} className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold hover:bg-white/25 flex items-center gap-1"><Wallet className="h-3 w-3"/>Fund</button>}
            {card.status==="active" && <Button type="button" variant="danger" className="px-2 py-1 text-[10px]" disabled={busy} onClick={blockCard}>Block</Button>}
          </div>
        </div>
      </div>
      {/* Fund panel */}
      {showFund && accounts && (
        <div className="rounded-2xl border border-jade-500/20 bg-jade-500/5 p-3 space-y-2">
          <Select className="text-xs py-1.5" value={fundAccount} onChange={(e)=>setFundAccount(e.target.value)}>
            {accounts.map(a=><option key={a.id} value={a.id}>{a.nickname||a.accountNumber} · {a.currency} {a.balance}</option>)}
          </Select>
          <Input type="number" min="1" step="0.01" value={fundAmount} onChange={(e)=>setFundAmount(e.target.value)} placeholder="Amount" className="text-xs py-1.5"/>
          {fundMsg && <p className="text-xs text-jade-600 font-semibold">{fundMsg}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="text-xs py-1 flex-1" onClick={()=>setShowFund(false)}>Cancel</Button>
            <Button type="button" className="text-xs py-1 flex-1" disabled={busy||!fundAmount} onClick={()=>setShowPin(true)}>🔒 Fund</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CreditCardApplicationForm() {
  const router = useRouter();
  const [cardArt, setCardArt] = useState("jade-dragon");
  const [creditLimit, setCreditLimit] = useState("10000");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  async function apply() {
    setLoading(true); setMessage("");
    const res = await fetch("/api/cards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "credit", cardArt, creditLimit }) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setMessage(data.error || data.data?.error || "Failed"); return; }
    // Auto-close form: show submitted state
    setSubmitted(true);
    router.refresh();
  }

  // After submission — show processing spinner (form auto-closed)
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-jade-500/10 animate-bounce-slow">
          <Lock className="h-8 w-8 text-jade-600" />
        </div>
        <p className="mt-4 font-display text-lg font-semibold text-ink-900">✅ Application submitted!</p>
        <p className="mt-2 text-sm text-ink-600/70">Your credit card is being processed. You'll be notified upon approval.</p>
        <div className="mt-4 flex gap-1">
          <span className="h-2 w-8 rounded-full bg-jade-500" />
          <span className="h-2 w-6 rounded-full bg-jade-400 progress-animate" />
          <span className="h-2 w-6 rounded-full bg-ink-900/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-jade-500/20 bg-gradient-to-br from-jade-500/10 to-emerald-500/5 p-4 text-center mb-2">
        <p className="text-lg font-display font-bold text-ink-900">✨ Credit Card</p>
        <p className="text-xs text-ink-600/70 mt-1">Dedicated credit facility — a separate credit account will be created upon approval.</p>
      </div>
      <div><Label>Credit limit (SGD)</Label>
        <Select value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)}>
          <option value="5000">5,000</option><option value="10000">10,000</option><option value="25000">25,000</option><option value="50000">50,000</option><option value="100000">100,000</option>
        </Select>
      </div>
      <div><Label>Card design</Label>
        <div className="grid grid-cols-3 gap-2">{CARD_ARTS.map(art => (
          <button key={art.id} type="button" onClick={() => setCardArt(art.id)} className={`rounded-xl p-2 h-12 text-[9px] text-white font-semibold ${art.css} ring-2 transition ${cardArt === art.id ? "ring-jade-400 scale-105" : "ring-transparent"}`}>{art.label}</button>
        ))}</div>
      </div>
      {message && <p className={`text-sm font-semibold ${message.startsWith("✅") ? "text-jade-600" : "text-vermillion-500"}`}>{message}</p>}
      <Button type="button" onClick={apply} disabled={loading} className="w-full">{loading ? "Processing..." : "✨ Apply for Credit Card"}</Button>
    </div>
  );
}

export function CardArtChanger({ cardId, currentArt }: { cardId: number; currentArt: string | null }) {
  const router = useRouter();
  const [art, setArt] = useState(currentArt || "jade-dragon");
  const [saving, setSaving] = useState(false);
  async function save() { setSaving(true); await fetch("/api/cards",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:cardId,cardArt:art})}); setSaving(false); router.refresh(); }
  return (
    <div className="mt-2 flex gap-1 items-center flex-wrap">
      {CARD_ARTS.map(a=><button key={a.id} type="button" onClick={()=>setArt(a.id)} className={`rounded-lg h-6 w-10 ${a.css} ring-1 ${art===a.id?"ring-jade-400":"ring-transparent"}`} title={a.label}/>)}
      {art!==(currentArt||"jade-dragon") && <Button type="button" variant="secondary" className="text-[10px] py-0.5 px-2 ml-1" onClick={save} disabled={saving}>{saving?"...":"Apply"}</Button>}
    </div>
  );
}
