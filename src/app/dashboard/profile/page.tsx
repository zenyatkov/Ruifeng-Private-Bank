import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime, initials } from "@/lib/utils";
import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { ProfileForm } from "@/components/forms/profile-form";
import { ProfilePicture } from "@/components/forms/profile-picture";
import { LANGUAGE_LABELS, CURRENCY_LABELS, type SupportedLanguage, type SupportedCurrency } from "@/lib/i18n";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const [profile] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!profile) return null;

  const lang = (profile.preferredLanguage || "en") as SupportedLanguage;
  const ccy = (profile.preferredCurrency || "SGD") as SupportedCurrency;

  return (
    <div>
      <PageHeader title="Profile & Settings" subtitle="Manage your details, preferences, and security." />
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
          <Panel title="Details">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-ink-600/50">Tier</span><span className="font-medium">{profile.clientTier}</span></div>
              <div className="flex justify-between"><span className="text-ink-600/50">Language</span><span className="font-medium">{LANGUAGE_LABELS[lang]}</span></div>
              <div className="flex justify-between"><span className="text-ink-600/50">Currency</span><span className="font-medium">{CURRENCY_LABELS[ccy]}</span></div>
              <div className="flex justify-between"><span className="text-ink-600/50">Country</span><span className="font-medium">{profile.country || "—"}</span></div>
              <div className="flex justify-between"><span className="text-ink-600/50">Email verified</span><span className="font-medium">{profile.emailVerified ? "✓ Yes" : "✗ No"}</span></div>
              <div className="flex justify-between"><span className="text-ink-600/50">Last login</span><span className="font-medium">{formatDateTime(profile.lastLoginAt)}</span></div>
              <div className="flex justify-between"><span className="text-ink-600/50">Member since</span><span className="font-medium">{formatDateTime(profile.createdAt)}</span></div>
            </div>
          </Panel>
        </div>
        <Panel title="Edit profile">
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
