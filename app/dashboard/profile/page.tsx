import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime, initials } from "@/lib/utils";
import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { ProfileForm } from "@/components/forms/profile-form";
import { ProfilePicture } from "@/components/forms/profile-picture";
import { LANGUAGE_LABELS, CURRENCY_LABELS, type SupportedLanguage, type SupportedCurrency, t } from "@/lib/i18n";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const [profile] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!profile) return null;
  const lang = (profile.preferredLanguage || "en") as SupportedLanguage;
  const ccy = (profile.preferredCurrency || "SGD") as SupportedCurrency;

  return (
    <div>
      <PageHeader title={t(lang, "profile")} subtitle={t(lang, "profileSubtitle")} />
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <Panel>
            <div className="flex flex-col items-center py-4">
              <ProfilePicture currentPicture={profile.profilePicture} initials={initials(profile.firstName, profile.lastName)} />
              <p className="mt-4 font-display text-xl font-semibold text-ink-900">{profile.firstName} {profile.lastName}</p>
              <p className="text-sm text-ink-600/70">{profile.email}</p>
              <div className="mt-2"><StatusBadge status={profile.kycStatus} /></div>
            </div>
          </Panel>
          <Panel title={t(lang, "details")}>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-ink-600/50">{t(lang, "tier")}</span><span className="font-medium">{profile.clientTier}</span></div>
              <div className="flex justify-between"><span className="text-ink-600/50">{t(lang, "language")}</span><span className="font-medium">{LANGUAGE_LABELS[lang]}</span></div>
              <div className="flex justify-between"><span className="text-ink-600/50">{t(lang, "currency")}</span><span className="font-medium">{CURRENCY_LABELS[ccy]}</span></div>
              <div className="flex justify-between"><span className="text-ink-600/50">{t(lang, "country")}</span><span className="font-medium">{profile.country || "—"}</span></div>
              <div className="flex justify-between"><span className="text-ink-600/50">{t(lang, "emailVerified")}</span><span className="font-medium">{profile.emailVerified ? `✓ ${t(lang, "yes")}` : `✗ ${t(lang, "no")}`}</span></div>
              <div className="flex justify-between"><span className="text-ink-600/50">{t(lang, "lastLogin")}</span><span className="font-medium">{formatDateTime(profile.lastLoginAt)}</span></div>
              <div className="flex justify-between"><span className="text-ink-600/50">{t(lang, "memberSince")}</span><span className="font-medium">{formatDateTime(profile.createdAt)}</span></div>
            </div>
          </Panel>
        </div>
        <Panel title={t(lang, "editProfile")}>
          <ProfileForm profile={{
            firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone,
            city: profile.city, address: profile.address, country: profile.country,
            preferredCurrency: profile.preferredCurrency || "SGD",
            preferredLanguage: profile.preferredLanguage || "en",
          }} />
        </Panel>
      </div>
    </div>
  );
}
