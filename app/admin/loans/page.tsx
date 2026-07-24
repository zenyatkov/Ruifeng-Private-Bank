import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { loans, users } from "@/db/schema";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { LoanActions } from "@/components/admin/loan-actions";
import { AdminDeleteButtonWrapper } from "@/components/admin/admin-delete-button-wrapper";

export default async function AdminLoansPage() {
  const rows = await db
    .select({
      id: loans.id,
      loanNumber: loans.loanNumber,
      productName: loans.productName,
      principal: loans.principal,
      outstanding: loans.outstanding,
      interestRate: loans.interestRate,
      termMonths: loans.termMonths,
      currency: loans.currency,
      status: loans.status,
      purpose: loans.purpose,
      createdAt: loans.createdAt,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(loans)
    .leftJoin(users, eq(loans.userId, users.id))
    .orderBy(desc(loans.createdAt));

  return (
    <div>
      <PageHeader title="Loan book" subtitle="Credit decisioning and portfolio monitoring for private lending." />
      <Panel>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Facility</th>
                <th>Client</th>
                <th>Principal</th>
                <th>Outstanding</th>
                <th>Rate</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((loan) => (
                <tr key={loan.id}>
                  <td>
                    <p className="font-semibold">{loan.productName}</p>
                    <p className="text-xs text-ink-600/60">
                      {loan.loanNumber} · {loan.termMonths}m · {formatDate(loan.createdAt)}
                    </p>
                  </td>
                  <td>
                    <p className="font-medium">
                      {loan.firstName} {loan.lastName}
                    </p>
                    <p className="text-xs text-ink-600/60">{loan.email}</p>
                  </td>
                  <td>{formatCurrency(loan.principal, loan.currency)}</td>
                  <td className="font-semibold">{formatCurrency(loan.outstanding, loan.currency)}</td>
                  <td>{loan.interestRate}%</td>
                  <td>
                    <StatusBadge status={loan.status} />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <LoanActions id={loan.id} status={loan.status} />
                      <AdminDeleteButtonWrapper type="loan" id={loan.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
