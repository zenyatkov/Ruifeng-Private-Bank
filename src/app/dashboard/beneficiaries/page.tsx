import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { beneficiaries } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { EmptyState, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { BeneficiaryForm } from "@/components/forms/beneficiary-form";
import { DeleteBeneficiaryButton } from "@/components/forms/delete-beneficiary-button";

export default async function BeneficiariesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const rows = await db
    .select()
    .from(beneficiaries)
    .where(eq(beneficiaries.userId, user.id))
    .orderBy(desc(beneficiaries.createdAt));

  return (
    <div>
      <PageHeader
        title="Beneficiaries"
        subtitle="Trusted payees across Asia and global correspondent banks."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Add beneficiary">
          <BeneficiaryForm />
        </Panel>
        <Panel title="Saved payees">
          {rows.length === 0 ? (
            <EmptyState title="No beneficiaries" description="Add your first trusted counterparty." />
          ) : (
            <div className="space-y-3">
              {rows.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-col gap-3 rounded-2xl border border-ink-900/5 bg-rice-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-ink-900">{b.nickname || b.name}</p>
                    <p className="mt-1 text-sm text-ink-600/75">{b.bankName}</p>
                    <p className="mt-1 text-xs text-ink-600/60">
                      {b.accountNumber}
                      {b.swiftCode ? ` · ${b.swiftCode}` : ""} · {b.currency} · {b.country}
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                  <DeleteBeneficiaryButton id={b.id} />
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
