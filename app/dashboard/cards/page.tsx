import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, cards } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { EmptyState, PageHeader, Panel } from "@/components/ui";
import { CardDisplay, IssueCardForm, CreditCardApplicationForm, CardArtChanger } from "@/components/forms/card-actions";

export default async function CardsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const lang = user.preferredLanguage || "en";
  const userCards = await db.select().from(cards).where(eq(cards.userId, user.id));
  const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, user.id));

  // Attach linked account balance to each debit/platinum card
  const cardsWithBalance = userCards.map(card => {
    if (card.type === "credit") {
      // Credit cards show their own credit limit, not linked account
      const creditLimit = parseFloat(card.creditLimit || "0");
      const spent = parseFloat(card.spentThisMonth || "0");
      return {
        ...card,
        accountBalance: String(creditLimit - spent), // available credit
        accountCurrency: "SGD", // credit cards always in SGD
      };
    }
    const linkedAccount = userAccounts.find(a => a.id === card.accountId);
    return {
      ...card,
      accountBalance: linkedAccount ? linkedAccount.balance : "0",
      accountCurrency: linkedAccount ? linkedAccount.currency : "SGD",
    };
  });

  // Check if user already has a credit card (active or pending)
  const hasCreditCard = userCards.some(c => c.type === "credit" && ["active", "pending"].includes(c.status));
  // Check if user has outstanding credit card debt
  const hasCreditDebt = userCards.some(c => c.type === "credit" && c.status === "active" && parseFloat(c.spentThisMonth || "0") > 0);

  const activeCards = cardsWithBalance.filter(c => c.status === "active");
  const pendingCards = cardsWithBalance.filter(c => c.status === "pending");
  const otherCards = cardsWithBalance.filter(c => !["active", "pending"].includes(c.status));

  return (
    <div>
      <PageHeader title={t(lang, "cards")} subtitle={t(lang, "cardServices") || "Manage and fund your cards."} />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {pendingCards.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-bronze-500">{t(lang, "pending") || "Pending"}</h3>
              <div className="grid gap-4 md:grid-cols-2">{pendingCards.map(c => <CardDisplay key={c.id} card={c} />)}</div>
            </div>
          )}
          {activeCards.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-jade-600">{t(lang, "active") || "Active"}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {activeCards.map(c => (
                  <div key={c.id}>
                    <CardDisplay card={c} accounts={userAccounts} />
                    <CardArtChanger cardId={c.id} currentArt={c.cardArt} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {otherCards.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-600/50">{t(lang, "blocked") || "Blocked / Expired"}</h3>
              <div className="grid gap-4 md:grid-cols-2">{otherCards.map(c => <CardDisplay key={c.id} card={c} />)}</div>
            </div>
          )}
          {userCards.length === 0 && <EmptyState title={t(lang, "noPositions") || "No cards yet"} />}

          {/* Credit History panel for credit card users */}
          {userCards.some(c => c.type === "credit" && c.status === "active") && (
            <Panel title={t(lang, "creditHistory") || "Credit History"}>
              <div className="space-y-3">
                {userCards.filter(c => c.type === "credit" && c.status === "active").map(cc => {
                  const limit = parseFloat(cc.creditLimit || "0");
                  const spent = parseFloat(cc.spentThisMonth || "0");
                  const available = limit - spent;
                  const serviceRate = 0.025; // 2.5% monthly service
                  const monthlyService = spent * serviceRate;
                  return (
                    <div key={cc.id} className="rounded-2xl border border-ink-900/5 bg-white p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div><p className="text-xs text-ink-600/50">{t(lang, "creditLimit")}</p><p className="font-semibold">{formatCurrency(limit, "SGD")}</p></div>
                        <div><p className="text-xs text-ink-600/50">{t(lang, "creditDebt")}</p><p className="font-semibold text-vermillion-500">{formatCurrency(spent, "SGD")}</p></div>
                        <div><p className="text-xs text-ink-600/50">{t(lang, "creditBalance")}</p><p className="font-semibold text-jade-600">{formatCurrency(available, "SGD")}</p></div>
                        <div><p className="text-xs text-ink-600/50">{t(lang, "creditService")}</p><p className="font-semibold">{formatCurrency(monthlyService, "SGD")}/mo</p></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}
        </div>
        <div className="space-y-6">
          <Panel title="Get Card">
            <IssueCardForm accounts={userAccounts} />
          </Panel>
          {!hasCreditCard ? (
            <Panel title="✨ Credit Card Application">
              <CreditCardApplicationForm />
            </Panel>
          ) : hasCreditDebt ? (
            <Panel title="✨ Credit Card">
              <div className="rounded-2xl border border-vermillion-500/20 bg-vermillion-500/5 p-4 text-center">
                <p className="text-sm font-semibold text-vermillion-600">{t(lang, "cantApplyWithDebt") || "You cannot apply for a new credit card while you have outstanding credit card debt."}</p>
              </div>
            </Panel>
          ) : (
            <Panel title="✨ Credit Card">
              <div className="rounded-2xl border border-bronze-400/20 bg-bronze-400/5 p-4 text-center">
                <p className="text-sm font-semibold text-bronze-600">{t(lang, "pendingApplication") || "Your credit card application is being processed."}</p>
                <p className="text-xs text-ink-600/60 mt-2">{t(lang, "cantApplyMultiple") || "You cannot apply for multiple credit cards at once."}</p>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
