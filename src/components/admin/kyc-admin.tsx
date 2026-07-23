"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui";

export function KycAdminActions({ userId, currentStatus, compact }: { userId: number; currentStatus: string; compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setKyc(status: string) {
    setBusy(true);
    await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: userId, kycStatus: status }) });
    setBusy(false); router.refresh();
  }

  if (compact) {
    return (
      <div className="flex gap-1">
        {currentStatus !== "verified" && <Button type="button" className="px-2 py-1 text-[10px]" disabled={busy} onClick={() => setKyc("verified")}>Verify</Button>}
        {currentStatus !== "rejected" && <Button type="button" variant="danger" className="px-2 py-1 text-[10px]" disabled={busy} onClick={() => setKyc("rejected")}>Reject</Button>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-600/70">Actions</p>
      <Button type="button" className="w-full" disabled={busy} onClick={() => setKyc("verified")}>✓ Approve & Verify</Button>
      <Button type="button" variant="danger" className="w-full" disabled={busy} onClick={() => setKyc("rejected")}>✗ Reject KYC</Button>
      <Button type="button" variant="secondary" className="w-full" disabled={busy} onClick={() => setKyc("review")}>Flag for review</Button>
    </div>
  );
}

export function KycDocumentDownload({ documentFile, userName }: { documentFile: string | null; userName: string }) {
  if (!documentFile) return <p className="text-xs text-ink-600/50">No document uploaded</p>;
  return (
    <a href={documentFile} download={`KYC_Doc_${userName.replace(/\s/g, "_")}.jpg`} className="btn-secondary w-full text-xs flex items-center justify-center gap-2">
      <Download className="h-4 w-4" /> Download ID Document
    </a>
  );
}

export function KycDownloadButton({ user }: { user: Record<string, unknown> }) {
  function download() {
    const content = `瑞峯 RuiFeng Private Bank — KYC Report
${"=".repeat(50)}
Generated: ${new Date().toISOString()}

CLIENT INFORMATION
Name: ${user.firstName} ${user.lastName}
Email: ${user.email}
Phone: ${user.phone || "N/A"}
Country: ${user.country || "N/A"}
City: ${user.city || "N/A"}
Nationality: ${user.nationality || "N/A"}
Date of Birth: ${user.dateOfBirth || "N/A"}
Address: ${user.address || "N/A"}
Client Tier: ${user.clientTier || "N/A"}

IDENTITY DOCUMENT
Type: ${user.kycDocumentType || "Not submitted"}
Number: ${user.kycDocumentNumber || "N/A"}
Legal Name on Document: ${user.kycFullName || "N/A"}
DOB on Document: ${user.kycDateOfBirth || "N/A"}

RESIDENTIAL ADDRESS (KYC)
${user.kycAddress || "N/A"}

EMPLOYMENT & FINANCIAL
Employer: ${user.kycEmployer || "N/A"}
Occupation: ${user.kycOccupation || "N/A"}
Source of Funds: ${user.kycSourceOfFunds || "N/A"}
Annual Income: ${user.kycAnnualIncome || "N/A"}
PEP Status: ${user.kycPepStatus || "N/A"}

KYC STATUS: ${user.kycStatus}
Account Created: ${user.createdAt}
Last Login: ${user.lastLoginAt || "Never"}

${"=".repeat(50)}
CONFIDENTIAL — For internal compliance use only.
瑞峯 RuiFeng Private Bank Ltd. MAS Regulated.
`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `KYC_${user.firstName}_${user.lastName}_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="secondary" className="w-full" onClick={download}>
      <Download className="h-4 w-4" /> Download KYC Report
    </Button>
  );
}
