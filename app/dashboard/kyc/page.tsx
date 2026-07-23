"use client";

import { FormEvent, useRef, useState } from "react";
import { ShieldCheck, Upload, FileCheck } from "lucide-react";
import { Alert, Button, Input, Label, Select, Textarea } from "@/components/ui";

export default function KycPage() {
  const [form, setForm] = useState({
    documentType: "Passport", documentNumber: "", fullName: "", dateOfBirth: "",
    address: "", employer: "", occupation: "", sourceOfFunds: "Employment",
    annualIncome: "", pepStatus: "No",
  });
  const [idFile, setIdFile] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("File must be under 5MB"); return; }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setIdFile(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!idFile) { setError("Please upload your ID document"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/kyc", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, documentFile: idFile }),
    });
    setLoading(false);
    if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); return; }
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md text-center animate-fade-in">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-jade-500/10 animate-bounce-slow"><ShieldCheck className="h-10 w-10 text-jade-600" /></div>
          <h2 className="mt-6 font-display text-2xl font-semibold text-ink-900">KYC Under Review</h2>
          <p className="mt-3 text-ink-600/70">Your documents have been submitted successfully. Verification typically takes 24-48 hours.</p>
          <div className="mt-6 flex gap-1 justify-center">
            <span className="h-2 w-8 rounded-full bg-jade-500" /><span className="h-2 w-6 rounded-full bg-jade-400 progress-animate" /><span className="h-2 w-6 rounded-full bg-ink-900/10" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="text-center mb-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-900 text-jade-300"><ShieldCheck className="h-8 w-8" /></div>
        <h2 className="mt-4 font-display text-2xl font-semibold text-ink-900">Identity Verification (KYC)</h2>
        <p className="mt-2 text-sm text-ink-600/70">Complete all fields and upload your ID to unlock full banking access.</p>
      </div>
      <form onSubmit={onSubmit} className="card-shadow rounded-3xl bg-white p-6 space-y-4">
        {error && <Alert>{error}</Alert>}

        {/* ID Upload — MANDATORY */}
        <div className="rounded-2xl border-2 border-dashed border-ink-900/15 bg-rice-50 p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-jade-600 mb-3">ID Document Upload (Required)</p>
          {idFile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-jade-700"><FileCheck className="h-5 w-5" /><span className="text-sm font-semibold">{fileName}</span></div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={idFile} alt="ID Preview" className="mx-auto max-h-40 rounded-xl border border-ink-900/10 object-contain" />
              <button type="button" onClick={() => { setIdFile(null); setFileName(""); }} className="text-xs text-vermillion-500 font-semibold">Remove & re-upload</button>
            </div>
          ) : (
            <div>
              <Upload className="h-10 w-10 mx-auto text-ink-600/30 mb-3" />
              <p className="text-sm text-ink-600/70">Upload a clear photo or scan of your ID</p>
              <p className="text-xs text-ink-600/40 mt-1">Passport, National ID, or Driver&apos;s License · Max 5MB · JPG/PNG/PDF</p>
              <Button type="button" variant="secondary" className="mt-3" onClick={() => fileRef.current?.click()}>Choose file</Button>
              <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
            </div>
          )}
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider text-jade-600">Identity Document</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Document type</Label><Select value={form.documentType} onChange={e => setForm({...form, documentType: e.target.value})}><option>Passport</option><option>National ID</option><option>Driving License</option><option>Residence Permit</option></Select></div>
          <div><Label>Document number</Label><Input value={form.documentNumber} onChange={e => setForm({...form, documentNumber: e.target.value})} required placeholder="e.g. E12345678" /></div>
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider text-jade-600 pt-2">Personal Information</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Full legal name</Label><Input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required /></div>
          <div><Label>Date of birth</Label><Input type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} required /></div>
        </div>
        <div><Label>Residential address</Label><Textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} required placeholder="Full address including postal code" /></div>

        <p className="text-xs font-semibold uppercase tracking-wider text-jade-600 pt-2">Employment & Financial</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Employer</Label><Input value={form.employer} onChange={e => setForm({...form, employer: e.target.value})} required /></div>
          <div><Label>Occupation</Label><Input value={form.occupation} onChange={e => setForm({...form, occupation: e.target.value})} required /></div>
          <div><Label>Source of funds</Label><Select value={form.sourceOfFunds} onChange={e => setForm({...form, sourceOfFunds: e.target.value})}><option>Employment</option><option>Business Income</option><option>Investments</option><option>Inheritance</option><option>Property Sale</option><option>Savings</option><option>Other</option></Select></div>
          <div><Label>Annual income</Label><Select value={form.annualIncome} onChange={e => setForm({...form, annualIncome: e.target.value})} required><option value="">Select...</option><option>Below $50,000</option><option>$50,000 - $100,000</option><option>$100,000 - $500,000</option><option>$500,000 - $1,000,000</option><option>$1,000,000 - $5,000,000</option><option>Above $5,000,000</option></Select></div>
        </div>
        <div><Label>PEP status</Label><Select value={form.pepStatus} onChange={e => setForm({...form, pepStatus: e.target.value})}><option>No</option><option>Yes</option><option>Related to PEP</option></Select></div>

        <div className="rounded-xl bg-rice-100 p-3 text-xs text-ink-600/60">
          By submitting, I confirm all information is accurate and consent to identity verification under applicable AML/KYC regulations.
        </div>
        <Button type="submit" className="w-full" disabled={loading || !idFile}>{loading ? "Submitting..." : "Submit KYC verification"}</Button>
      </form>
    </div>
  );
}
