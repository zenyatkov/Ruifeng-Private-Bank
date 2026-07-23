import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, cards } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { EmptyState, PageHeader, Panel } from "@/components/ui";
import { CardDisplay, IssueCardForm, CreditCardApplicationForm, CardArtChanger } from "@/components/forms/card-actions";

export default async function CardsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const lang = user.preferredLanguage || "en";
  const userCards = await db.select().from(cards).where(eq(cards.userId, user.id));
  const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, user.id));

  // Attach linked account balance to each card
  const cardsWithBalance = userCards.map(card => {
    const linkedAccount = userAccounts.find(a => a.id === card.accountId);
    return {
      ...card,
      accountBalance: linkedAccount ? linkedAccount.balance : "0",
      accountCurrency: linkedAccount ? linkedAccount.currency : "USD",
    };
  });

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
        </div>
        <div className="space-y-6">
          <Panel title={t(lang, "buyPositions") || "Apply for card"}>
            <IssueCardForm accounts={userAccounts} />
          </Panel>
          <Panel title="✨ Credit Card Application">
            <CreditCardApplicationForm accounts={userAccounts} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
