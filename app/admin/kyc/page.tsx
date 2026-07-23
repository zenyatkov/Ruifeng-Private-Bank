import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { formatDateTime } from "@/lib/utils";
import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { KycAdminActions, KycDownloadButton, KycDocumentDownload } from "@/components/admin/kyc-admin";

export default async function AdminKycPage() {
  const allClients = await db.select().from(users).where(eq(users.role, "client")).orderBy(desc(users.createdAt));
  const pendingKyc = allClients.filter(u => u.kycStatus === "pending" || u.kycStatus === "review");

  return (
    <div>
      <PageHeader title="KYC Verification" subtitle={`${pendingKyc.length} pending review`} />

      {pendingKyc.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-bronze-500 mb-3">Pending Review</h3>
          <div className="grid gap-4">
            {pendingKyc.map(u => (
              <Panel key={u.id}>
                <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-display text-lg font-semibold text-ink-900">{u.firstName} {u.lastName}</p>
                        <p className="text-sm text-ink-600/70">{u.email} · {u.phone || "No phone"}</p>
                      </div>
                      <StatusBadge status={u.kycStatus} />
                    </div>

                    {/* Identity document */}
                    <div className="mt-4 rounded-xl bg-rice-100 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-jade-600 mb-2">Identity Document</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><p className="text-xs text-ink-600/50">Type</p><p className="font-semibold">{u.kycDocumentType || "Not submitted"}</p></div>
                        <div><p className="text-xs text-ink-600/50">Number</p><p className="font-mono font-semibold">{u.kycDocumentNumber || "—"}</p></div>
                        <div><p className="text-xs text-ink-600/50">Legal Name</p><p className="font-semibold">{u.kycFullName || u.firstName + " " + u.lastName}</p></div>
                        <div><p className="text-xs text-ink-600/50">DOB</p><p className="font-semibold">{u.kycDateOfBirth || u.dateOfBirth || "—"}</p></div>
                      </div>
                    </div>

                    {/* Address & Employment */}
                    <div className="mt-3 rounded-xl bg-rice-100 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-jade-600 mb-2">Personal & Financial</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><p className="text-xs text-ink-600/50">Address</p><p className="font-semibold">{u.kycAddress || u.address || "—"}</p></div>
                        <div><p className="text-xs text-ink-600/50">Country</p><p className="font-semibold">{u.country || "—"}</p></div>
                        <div><p className="text-xs text-ink-600/50">Employer</p><p className="font-semibold">{u.kycEmployer || "—"}</p></div>
                        <div><p className="text-xs text-ink-600/50">Occupation</p><p className="font-semibold">{u.kycOccupation || "—"}</p></div>
                        <div><p className="text-xs text-ink-600/50">Source of Funds</p><p className="font-semibold">{u.kycSourceOfFunds || "—"}</p></div>
                        <div><p className="text-xs text-ink-600/50">Annual Income</p><p className="font-semibold">{u.kycAnnualIncome || "—"}</p></div>
                        <div><p className="text-xs text-ink-600/50">PEP Status</p><p className="font-semibold">{u.kycPepStatus || "—"}</p></div>
                        <div><p className="text-xs text-ink-600/50">Registered</p><p className="font-semibold">{formatDateTime(u.createdAt)}</p></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <KycAdminActions userId={u.id} currentStatus={u.kycStatus} />
                    <KycDocumentDownload documentFile={u.kycDocumentFile || u.kycSelfieUrl || null} userName={`${u.firstName} ${u.lastName}`} />
                    <KycDownloadButton user={u} />
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </div>
      )}

      <Panel title={`All Clients (${allClients.length})`}>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Client</th><th>Document</th><th>Employment</th><th>KYC</th><th>Actions</th></tr></thead>
            <tbody>
              {allClients.map(u => (
                <tr key={u.id}>
                  <td>
                    <p className="font-semibold">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-ink-600/60">{u.email}</p>
                  </td>
                  <td><p className="text-sm">{u.kycDocumentType || "—"}</p><p className="text-xs font-mono text-ink-600/60">{u.kycDocumentNumber || ""}</p></td>
                  <td><p className="text-sm">{u.kycOccupation || "—"}</p><p className="text-xs text-ink-600/60">{u.kycEmployer || ""}</p></td>
                  <td><StatusBadge status={u.kycStatus} /></td>
                  <td><KycAdminActions userId={u.id} currentStatus={u.kycStatus} compact /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
