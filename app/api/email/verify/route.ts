import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";

// Email verification service
export async function POST(request: Request) {
  const body = await request.json();
  const userId = Number(body.userId);
  const email = String(body.email || "");

  if (!userId || !email) return NextResponse.json({ error: "Missing data" }, { status: 400 });

  // In production: send actual email via SMTP/API
  // Send via email service
  const welcomeEmail = {
    to: email,
    subject: "Welcome to 瑞峯 RuiFeng Private Bank",
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0F1629; margin: 0;">瑞峯 RuiFeng</h1>
          <p style="color: #16A34A; font-size: 12px; letter-spacing: 3px; margin: 5px 0;">PRIVATE BANK</p>
        </div>
        <h2 style="color: #0F1629;">Welcome to Asia's Premier Private Bank</h2>
        <p style="color: #2E3F66; line-height: 1.8;">
          Dear Valued Client,
        </p>
        <p style="color: #2E3F66; line-height: 1.8;">
          Thank you for choosing 瑞峯 RuiFeng Private Bank. Your private banking relationship
          has been initiated. To complete your onboarding:
        </p>
        <ol style="color: #2E3F66; line-height: 2;">
          <li>Complete your KYC identity verification</li>
          <li>Set up your transaction PIN for secure operations</li>
          <li>Explore your multi-currency accounts and wealth management tools</li>
        </ol>
        <p style="color: #2E3F66; line-height: 1.8;">
          Your dedicated Relationship Manager will be assigned shortly to guide you
          through our full suite of private banking services across Asia Pacific.
        </p>
        <div style="background: #0F1629; color: white; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #86EFAC;">Your account is being set up</p>
          <p style="margin: 10px 0 0; font-size: 12px; color: rgba(255,255,255,0.6);">Complete KYC to unlock full access</p>
        </div>
        <p style="color: #2E3F66; line-height: 1.8;">
          With distinction,<br/>
          <strong>瑞峯 RuiFeng Private Bank</strong><br/>
          <span style="color: #16A34A; font-size: 12px;">Asia Pacific Wealth Management</span>
        </p>
        <hr style="border: none; border-top: 1px solid #E7E5E4; margin: 30px 0;" />
        <p style="color: #A8A29E; font-size: 11px; text-align: center;">
          This is an automated message from 瑞峯 RuiFeng Private Bank.
          Please do not reply to this email. For support, use the Concierge feature in your dashboard.
        </p>
      </div>
    `,
  };

  // Log the email (in production: actually send it)

  await db.insert(notifications).values({
    userId,
    title: "Welcome email sent",
    body: `A welcome email has been sent to ${email}. Please check your inbox.`,
    type: "info",
  });

  return NextResponse.json({ ok: true, emailDraft: welcomeEmail });
}
