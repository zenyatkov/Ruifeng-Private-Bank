import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Resend free tier (onboarding@resend.dev) can only send to the API key owner's email.
// For production, you'd use a verified custom domain like "noreply@ruifeng.bank"
// For now, we try Resend and if it fails (because the recipient isn't verified),
// we log the OTP to console so the developer can see it, and return false.
// The frontend shows OTP via in-app notification as a fallback.
const FROM = process.env.EMAIL_FROM || "瑞峯 RuiFeng Bank <onboarding@resend.dev>";

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error("Email send error:", error);
      console.log(`[EMAIL FALLBACK] OTP/Email for ${to}: Check server logs or in-app notifications`);
      return false;
    }
    console.log(`✅ Email sent successfully to ${to}, id: ${data?.id}`);
    return true;
  } catch (err) {
    console.error("Email send failed:", err);
    console.log(`[EMAIL FALLBACK] Email for ${to} could not be sent. Check in-app notifications.`);
    return false;
  }
}

export function welcomeEmailHtml(firstName: string) {
  return `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#FAFAF9;">
    <div style="text-align:center;margin-bottom:30px;">
      <h1 style="color:#0F1629;margin:0;font-size:28px;">瑞峯 RuiFeng</h1>
      <p style="color:#16A34A;font-size:11px;letter-spacing:4px;margin:5px 0;">PRIVATE BANK</p>
    </div>
    <div style="background:white;border-radius:16px;padding:32px;border:1px solid #E7E5E4;">
      <h2 style="color:#0F1629;margin-top:0;">Welcome, ${firstName}</h2>
      <p style="color:#2E3F66;line-height:1.8;">Thank you for choosing 瑞峯 RuiFeng Private Bank. Your private banking relationship has been initiated.</p>
      <p style="color:#2E3F66;line-height:1.8;">To complete your onboarding:</p>
      <ol style="color:#2E3F66;line-height:2.2;">
        <li>Complete your <strong>KYC identity verification</strong></li>
        <li>Set up your <strong>transaction PIN</strong></li>
        <li>Explore your accounts and wealth management tools</li>
      </ol>
      <div style="background:#0F1629;color:white;padding:20px;border-radius:12px;margin:24px 0;text-align:center;">
        <p style="margin:0;font-size:14px;color:#86EFAC;">Your account is being set up</p>
        <p style="margin:8px 0 0;font-size:12px;color:rgba(255,255,255,0.6);">Complete KYC to unlock full access</p>
      </div>
      <p style="color:#2E3F66;">With distinction,<br/><strong>瑞峯 RuiFeng Private Bank</strong></p>
    </div>
    <p style="color:#A8A29E;font-size:11px;text-align:center;margin-top:24px;">
      © ${new Date().getFullYear()} 瑞峯 RuiFeng Private Bank Ltd. MAS Regulated.<br/>
      This is an automated message. Do not reply.
    </p>
  </div>`;
}

export function otpEmailHtml(otp: string) {
  return `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#FAFAF9;">
    <div style="text-align:center;margin-bottom:30px;">
      <h1 style="color:#0F1629;margin:0;font-size:28px;">瑞峯 RuiFeng</h1>
      <p style="color:#16A34A;font-size:11px;letter-spacing:4px;margin:5px 0;">PRIVATE BANK</p>
    </div>
    <div style="background:white;border-radius:16px;padding:32px;border:1px solid #E7E5E4;text-align:center;">
      <h2 style="color:#0F1629;margin-top:0;">Email Verification</h2>
      <p style="color:#2E3F66;">Your verification code is:</p>
      <div style="background:#0F1629;color:#86EFAC;padding:20px;border-radius:12px;margin:20px 0;font-size:32px;font-weight:bold;letter-spacing:8px;">${otp}</div>
      <p style="color:#A8A29E;font-size:13px;">This code expires in 10 minutes. Do not share it with anyone.</p>
      <p style="color:#A8A29E;font-size:12px;margin-top:16px;">💡 If you don't receive this email, check your in-app notifications for the verification code.</p>
    </div>
    <p style="color:#A8A29E;font-size:11px;text-align:center;margin-top:24px;">
      If you did not request this, please ignore this email.<br/>
      瑞峯 RuiFeng Private Bank Ltd.
    </p>
  </div>`;
}

export function resetPasswordEmailHtml(token: string) {
  return `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#FAFAF9;">
    <div style="text-align:center;margin-bottom:30px;">
      <h1 style="color:#0F1629;margin:0;font-size:28px;">瑞峯 RuiFeng</h1>
      <p style="color:#16A34A;font-size:11px;letter-spacing:4px;margin:5px 0;">PRIVATE BANK</p>
    </div>
    <div style="background:white;border-radius:16px;padding:32px;border:1px solid #E7E5E4;">
      <h2 style="color:#0F1629;margin-top:0;">Password Reset</h2>
      <p style="color:#2E3F66;">You requested a password reset. Use this code on the reset page:</p>
      <div style="background:#0F1629;color:white;padding:16px;border-radius:12px;margin:20px 0;font-family:monospace;font-size:14px;word-break:break-all;text-align:center;">${token}</div>
      <p style="color:#A8A29E;font-size:13px;">This code expires in 30 minutes. If you did not request this, please ignore this email or contact support.</p>
    </div>
    <p style="color:#A8A29E;font-size:11px;text-align:center;margin-top:24px;">瑞峯 RuiFeng Private Bank Ltd.</p>
  </div>`;
}

export function transactionEmailHtml(type: string, details: Record<string, string>) {
  const rows = Object.entries(details).map(([k, v]) =>
    `<tr><td style="padding:8px 0;color:#666;border-bottom:1px solid #f0f0f0;">${k}</td><td style="padding:8px 0;font-weight:600;color:#0F1629;text-align:right;border-bottom:1px solid #f0f0f0;">${v}</td></tr>`
  ).join("");
  return `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#FAFAF9;">
    <div style="text-align:center;margin-bottom:20px;">
      <h1 style="color:#0F1629;margin:0;font-size:24px;">瑞峯 RuiFeng</h1>
      <p style="color:#16A34A;font-size:10px;letter-spacing:3px;">PRIVATE BANK</p>
    </div>
    <div style="background:white;border-radius:16px;padding:24px;border:1px solid #E7E5E4;">
      <h3 style="color:#0F1629;margin-top:0;text-transform:capitalize;">${type} Notification</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}</table>
    </div>
    <p style="color:#A8A29E;font-size:10px;text-align:center;margin-top:16px;">瑞峯 RuiFeng Private Bank Ltd. · Confidential</p>
  </div>`;
}
