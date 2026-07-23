"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Alert, Button, Input, Label, Select, Textarea } from "@/components/ui";
import { TransactionReceipt } from "@/components/receipt";
import { PinEntry } from "@/components/pin-entry";
import { playNotificationSound } from "@/components/notifications-client";
import { ASIAN_BANKS, type BankInfo } from "@/lib/asian-banks";
import { ASIAN_COUNTRIES } from "@/lib/utils";

type Acct = { id: number; nickname: string | null; accountNumber: string; currency: string; balance: string };
type ReceiptData = {
  reference: string; status: string; type: string;
  fromAccount: { number: string; nickname: string | null; currency: string };
  toName: string; toAccount: string; toBank?: string; toCountry?: string; toSwift?: string;
  amount: string; fee: string; total: string; currency: string; description: string;
  timestamp: string; newBalance: string;
};

type UserResult = { id: number; firstName: string; lastName: string; email: string; accounts: { id: number; accountNumber: string; currency: string; nickname: string | null }[] };

export function TransferForm({ accounts }: { accounts: Acct[] }) {
  const router = useRouter();
  const [transferType, setTransferType] = useState<"own" | "samebank" | "external">("own");
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id?.toString() || "");
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id?.toString() || "");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  // Same-bank user search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [selectedUserAccountId, setSelectedUserAccountId] = useState("");

  // External beneficiary
  const [benCountry, setBenCountry] = useState("Singapore");
  const [benBank, setBenBank] = useState("");
  const [benSwift, setBenSwift] = useState("");
  const [benName, setBenName] = useState("");
  const [benAccount, setBenAccount] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState("");
  const [recentRecipients, setRecentRecipients] = useState<{ name: string; account: string; bank?: string; country?: string }[]>([]);
  const [recipientsLoaded, setRecipientsLoaded] = useState(false);

  const banksForCountry: BankInfo[] = useMemo(() => ASIAN_BANKS[benCountry] || [], [benCountry]);

  // Load recent recipients on first render
  if (!recipientsLoaded) {
    setRecipientsLoaded(true);
    fetch("/api/recent-recipients").then(r => r.json()).then(d => setRecentRecipients(d.recipients || [])).catch(() => {});
  }

  function useRecipient(r: { name: string; account: string; bank?: string; country?: string }) {
    setTransferType("external");
    setBenName(r.name);
    setBenAccount(r.account);
    if (r.country) setBenCountry(r.country);
    if (r.bank) setBenBank(r.bank);
    const banks = ASIAN_BANKS[r.country || "Singapore"] || [];
    const b = banks.find(x => x.name === r.bank);
    if (b) setBenSwift(b.swift);
  }

  async function searchUsers(q: string) {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setSearchResults(data.results || []);
  }

  function initiateTransfer() {
    setShowPin(true);
  }

  async function executeTransfer() {
    setShowPin(false);
    setLoading(true);
    setError("");

    const body: Record<string, unknown> = {
      fromAccountId: Number(fromAccountId), amount, description: description || "Transfer",
    };

    if (transferType === "own") {
      body.transferType = "internal";
      body.toAccountId = Number(toAccountId);
    } else if (transferType === "samebank" && selectedUser) {
      body.transferType = "internal";
      body.toAccountId = Number(selectedUserAccountId);
      body.beneficiaryName = `${selectedUser.firstName} ${selectedUser.lastName}`;
    } else {
      body.transferType = "external";
      body.beneficiaryName = benName;
      body.beneficiaryBank = benBank;
      body.beneficiaryAccount = benAccount;
      body.beneficiarySwift = benSwift;
      body.beneficiaryCountry = benCountry;
    }

    const res = await fetch("/api/transfers", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (data.maintenanceMode) {
        setError(""); // Clear normal error
        setReceipt(null);
        setMaintenanceMsg(data.error);
        playNotificationSound("error");
        return;
      }
      setError(data.error || "Transfer failed"); playNotificationSound("error"); return;
    }
    setReceipt(data.receipt);
    playNotificationSound("success");
    setAmount(""); setDescription(""); setBenName(""); setBenAccount("");
    setSelectedUser(null); setSearchQuery("");
    router.refresh();
  }

  if (accounts.length === 0) return <Alert type="info">Open an account first.</Alert>;

  if (receipt) {
    const lines = [
      { label: "Reference", value: receipt.reference },
      { label: "Type", value: receipt.type === "internal" ? "Internal" : "External" },
      { label: "From", value: receipt.fromAccount.nickname || receipt.fromAccount.number },
      { label: "To", value: receipt.toName },
      ...(receipt.toBank ? [{ label: "Bank", value: `${receipt.toBank} (${receipt.toCountry || ""})` }] : []),
      ...(receipt.toSwift ? [{ label: "SWIFT", value: receipt.toSwift }] : []),
      ...(receipt.toAccount ? [{ label: "Account", value: receipt.toAccount }] : []),
      { label: "Amount", value: `${receipt.currency} ${receipt.amount}` },
      { label: "Fee", value: `${receipt.currency} ${receipt.fee}` },
      { label: "Total", value: `${receipt.currency} ${receipt.total}` },
      { label: "New Balance", value: `${receipt.currency} ${receipt.newBalance}` },
      { label: "Date", value: new Date(receipt.timestamp).toLocaleString() },
    ];
    return <TransactionReceipt type="debit" lines={lines} status={receipt.status} onClose={() => setReceipt(null)} />;
  }

  return (
    <>
      {showPin && <PinEntry onVerified={executeTransfer} onCancel={() => setShowPin(false)} />}

      <form onSubmit={(e: FormEvent) => { e.preventDefault(); initiateTransfer(); }} className="space-y-4">
      {error && <Alert>{error}</Alert>}

      {/* Maintenance mode message */}
      {maintenanceMsg && (
        <div className="rounded-2xl border border-vermillion-500/20 bg-vermillion-500/5 p-5 animate-fade-in">
          <p className="font-semibold text-vermillion-600">⚠ {maintenanceMsg}</p>
          <div className="mt-3 rounded-xl bg-white border border-ink-900/5 p-3">
            <p className="text-xs font-semibold text-jade-600 uppercase tracking-wider">Alternative: Crypto Funding</p>
            <p className="mt-1 text-sm text-ink-600/70">Fund your account using BTC, ETH, or USDT.</p>
            <a href="/dashboard/crypto" className="mt-2 btn-primary text-xs inline-flex">Go to Crypto Funding →</a>
          </div>
          <button onClick={() => setMaintenanceMsg("")} className="mt-3 text-xs text-ink-600/50 hover:text-ink-600">Dismiss</button>
        </div>
      )}

      {/* Recent recipients */}
      {recentRecipients.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-ink-600/60 mb-1.5">Recent recipients</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {recentRecipients.map((r, i) => (
              <button key={i} type="button" onClick={() => useRecipient(r)}
                className="shrink-0 rounded-xl border border-ink-900/8 bg-white px-3 py-2 text-left hover:border-jade-500/30 transition">
                <p className="text-xs font-semibold text-ink-900 truncate max-w-[140px]">{r.name}</p>
                <p className="text-[10px] text-ink-600/50 truncate max-w-[140px]">{r.bank || r.account}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Transfer type tabs */}
        <div className="flex gap-1 rounded-xl bg-rice-100 p-1 text-xs">
          {([["own", "Own Accounts"], ["samebank", "Same Bank User"], ["external", "External Bank"]] as const).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setTransferType(key)}
              className={`flex-1 rounded-lg px-2 py-2 font-semibold transition ${transferType === key ? "bg-white text-ink-900 shadow" : "text-ink-600"}`}>
              {label}
            </button>
          ))}
        </div>

        <div>
          <Label>From account</Label>
          <Select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} required>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.nickname || a.accountNumber} · {a.currency} {a.balance}</option>)}
          </Select>
        </div>

        {/* Own accounts */}
        {transferType === "own" && (
          <div>
            <Label>To account</Label>
            <Select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} required>
              {accounts.filter(a => a.id !== Number(fromAccountId)).map(a => <option key={a.id} value={a.id}>{a.nickname || a.accountNumber} · {a.currency} {a.balance}</option>)}
            </Select>
          </div>
        )}

        {/* Same bank user */}
        {transferType === "samebank" && (
          <div className="space-y-3 rounded-2xl border border-jade-500/15 bg-jade-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-jade-600">🔍 Find 瑞峯 RuiFeng user</p>
            <div className="relative">
              <Input value={searchQuery} onChange={(e) => searchUsers(e.target.value)} placeholder="Search by email or account number…" />
              <Search className="absolute right-3 top-3 h-4 w-4 text-ink-600/40" />
            </div>
            {searchResults.length > 0 && !selectedUser && (
              <div className="max-h-40 overflow-y-auto space-y-1 rounded-xl bg-white p-2">
                {searchResults.map(u => (
                  <button key={u.id} type="button" onClick={() => { setSelectedUser(u); setSelectedUserAccountId(u.accounts[0]?.id?.toString() || ""); }}
                    className="w-full rounded-lg px-3 py-2 text-left hover:bg-rice-50 transition">
                    <p className="text-sm font-semibold text-ink-900">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-ink-600/60">{u.email}</p>
                  </button>
                ))}
              </div>
            )}
            {selectedUser && (
              <div className="rounded-xl bg-white p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{selectedUser.firstName} {selectedUser.lastName}</p>
                    <p className="text-xs text-ink-600/60">{selectedUser.email}</p>
                  </div>
                  <button type="button" className="text-xs text-vermillion-500 font-semibold" onClick={() => { setSelectedUser(null); setSearchQuery(""); }}>Change</button>
                </div>
                {selectedUser.accounts.length > 1 && (
                  <Select className="mt-2" value={selectedUserAccountId} onChange={(e) => setSelectedUserAccountId(e.target.value)}>
                    {selectedUser.accounts.map(a => <option key={a.id} value={a.id}>{a.nickname || a.accountNumber} · {a.currency}</option>)}
                  </Select>
                )}
              </div>
            )}
          </div>
        )}

        {/* External */}
        {transferType === "external" && (
          <div className="space-y-3 rounded-2xl border border-ink-900/8 bg-rice-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-jade-600">Beneficiary · 收款人</p>
            <div><Label>Name</Label><Input value={benName} onChange={(e) => setBenName(e.target.value)} placeholder="Full legal name" required /></div>
            <div><Label>Country</Label>
              <Select value={benCountry} onChange={(e) => { setBenCountry(e.target.value); setBenBank(""); setBenSwift(""); }}>
                {ASIAN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div><Label>Bank</Label>
              <Select value={benBank} onChange={(e) => { setBenBank(e.target.value); const b = banksForCountry.find(x => x.name === e.target.value); setBenSwift(b?.swift || ""); }} required>
                <option value="">Select bank…</option>
                {banksForCountry.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
              </Select>
            </div>
            {benSwift && <div className="rounded-lg bg-white px-3 py-2 text-xs text-ink-600">SWIFT: <span className="font-mono font-bold text-ink-900">{benSwift}</span></div>}
            <div><Label>Account / IBAN</Label><Input value={benAccount} onChange={(e) => setBenAccount(e.target.value)} placeholder="Account number" required /></div>
          </div>
        )}

        <div><Label>Amount · 金额</Label><Input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" /></div>
        <div><Label>Reference</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Payment details" /></div>

        <Button type="submit" className="w-full" disabled={loading || (transferType === "samebank" && !selectedUser) || (transferType === "external" && (!benName || !benBank || !benAccount))}>
          {loading ? "Processing…" : "🔒 Authorize transfer"}
        </Button>
        <p className="text-xs text-ink-600/60">Transfers require PIN verification.</p>
      </form>
    </>
  );
}
