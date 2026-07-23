import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, fxRates } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader, Panel } from "@/components/ui";
import { FxForm } from "@/components/forms/fx-form";
import { t } from "@/lib/i18n";

export default async function FxPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const lang = user.preferredLanguage || "en";

  const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, user.id));
  const rates = await db.select().from(fxRates);

  return (
    <div>
      <PageHeader
        title={t(lang, "fxDesk")}
        subtitle={t(lang, "fxSubtitle")}
      />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title={t(lang, "convertCurrency")}>
          <FxForm accounts={userAccounts} rates={rates} />
        </Panel>
        <Panel title={t(lang, "liveBoard")}>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t(lang, "pair")}</th>
                  <th>{t(lang, "fxRate")}</th>
                  <th>{t(lang, "updated")}</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => (
                  <tr key={rate.id}>
                    <td className="font-semibold">
                      {rate.baseCurrency}/{rate.quoteCurrency}
                    </td>
                    <td>{parseFloat(rate.rate).toFixed(6)}</td>
                    <td>{rate.updatedAt ? new Date(rate.updatedAt).toLocaleString("en-SG") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
