import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, supportTickets, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";

const KNOWLEDGE: { keywords: string[]; answer: string }[] = [
  { keywords: ["transfer","send","wire","swift","payment"], answer: "To send money:\n1. Go to Transfers\n2. Choose: Own Accounts, Same Bank User, or External Bank\n3. For same-bank: search by email or account number\n4. For external: select country → bank → enter beneficiary details\n5. Enter amount and reference\n6. Verify with your PIN\n\nYou'll receive a receipt upon completion." },
  { keywords: ["card","apply","credit card","debit card","platinum","black"], answer: "To apply for a card:\n1. Go to Cards → Apply\n2. Choose tier: Debit, Credit, Platinum, or Black\n3. Select your preferred card design\n4. Link to your account\n5. Submit application\n\nYou can fund your card from any linked account and customize the design anytime." },
  { keywords: ["loan","borrow","credit","lending","facility"], answer: "To apply for a loan:\n1. Go to Lending\n2. Select product and disbursement account\n3. Enter principal and term\n4. Submit\n\nUpon processing, funds are credited to your selected account with monthly auto-debit set up." },
  { keywords: ["kyc","verify","identity","document","passport"], answer: "KYC verification:\n1. Go to KYC page\n2. Select document type\n3. Enter document number and details\n4. Submit\n\nVerification is typically processed within 24-48 hours." },
  { keywords: ["pin","security","password"], answer: "Transaction PIN:\n• Set a 4-6 digit PIN on your first transaction\n• Required for all transfers, investments, and FX\n• Reset available in Profile → Security\n• Never share your PIN" },
  { keywords: ["fx","exchange","currency","convert"], answer: "Foreign Exchange:\n1. Go to FX Desk\n2. Select sell and buy currency accounts\n3. Enter amount\n4. Review the live rate\n5. Authorize with PIN\n\nLive rates with competitive spreads." },
  { keywords: ["invest","stock","etf","bond","fund","buy","sell","portfolio"], answer: "Investments:\n• Buy: Select instrument from market board → enter quantity → confirm\n• Sell: Click 'Sell' on any holding → enter quantity → proceeds credited\n• Real-time prices and P&L tracking available" },
  { keywords: ["bill","utility","pay bill","electric","phone"], answer: "Bill Payments:\n1. Go to Bill Payments\n2. Select biller from your country\n3. Enter reference and amount\n4. Confirm with PIN" },
  { keywords: ["crypto","bitcoin","btc","ethereum","eth","usdt"], answer: "Crypto Funding:\n1. Go to Crypto Funding\n2. View your assigned wallet addresses\n3. Send crypto to the displayed address\n4. Funds credit after network confirmation" },
  { keywords: ["receipt","proof","record"], answer: "Receipts are saved automatically for every transaction. Visit the Receipts page to view or review any past receipt." },
  { keywords: ["complaint","problem","issue","wrong","error","dispute"], answer: "I'm sorry to hear you're experiencing an issue. Let me escalate this to our support team right away. Could you describe the problem in detail? I'll create a support ticket for immediate attention." },
  { keywords: ["speak","human","agent","real person","manager"], answer: "I'll connect you with our support team. A ticket has been created and your Relationship Manager will be notified. For urgent matters, please use the Concierge tab." },
  { keywords: ["fee","charge","cost"], answer: "Fee schedule:\n• Transfers < $1,000: $5\n• Transfers $1,000-$9,999: $15\n• Transfers $10,000+: $35\n• FX: 15bps spread\n• Investment transactions: No commission" },
  { keywords: ["limit","maximum"], answer: "Transfer limits by tier:\n• Private: up to $50,000/day\n• Priority: up to $200,000/day\n• Prestige: up to $500,000/day\n• UHNW: Custom limits\n\nContact your RM for limit changes." },
  { keywords: ["hours","time","available"], answer: "Digital banking: 24/7\nRelationship Managers: Mon-Fri, 9AM-6PM (SGT)\nAI Assistant: Always available\nFX Desk: 24/5" },
  { keywords: ["close","closure","terminate"], answer: "To request account closure:\n1. Go to Accounts\n2. Select the account\n3. Submit a closure request through Concierge\n\nClosure requests are processed within 48 hours." },
  { keywords: ["notification","alert"], answer: "View notifications in the Notifications tab. Click to expand and read. You can mark as read/unread." },
  { keywords: ["language","currency","settings"], answer: "Change language and currency using the dropdown menus in the top header bar. Changes apply immediately across the platform." },
];

const ESCALATION_KEYWORDS = ["complaint","problem","issue","wrong","error","dispute","speak","human","agent","real person","manager","escalate","help me","urgent","fraud","stolen","unauthorized"];

function findAnswer(message: string): { reply: string; shouldEscalate: boolean } {
  const lower = message.toLowerCase();

  const shouldEscalate = ESCALATION_KEYWORDS.some(kw => lower.includes(kw));

  for (const item of KNOWLEDGE) {
    if (item.keywords.some(kw => lower.includes(kw))) return { reply: item.answer, shouldEscalate };
  }
  if (lower.match(/hello|hi|hey|good|greet/)) {
    return { reply: "Welcome to 瑞峯 RuiFeng! I can help with transfers, cards, loans, investments, FX, bills, crypto, accounts, KYC, and more. What would you like to know?", shouldEscalate: false };
  }
  if (lower.match(/thank/)) return { reply: "You're welcome! Anything else I can help with?", shouldEscalate: false };
  return { reply: "I can help with: transfers, cards, loans, investments, FX, bills, crypto, accounts, KYC, receipts, and more. Please ask about any topic.", shouldEscalate: false };
}

export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });
  const body = await request.json();
  const message = String(body.message || "").trim();
  if (!message) return NextResponse.json({ error: "Message required" }, { status: 400 });

  const { reply, shouldEscalate } = findAnswer(message);

  // Escalate to admin via support ticket + admin notification
  if (shouldEscalate) {
    await db.insert(supportTickets).values({
      userId: user.id,
      subject: `AI Escalation: ${message.substring(0, 80)}`,
      message: `User message via AI chat: "${message}"\n\nAI response: "${reply}"`,
      category: "AI Escalation",
      priority: "high",
      status: "open",
    });

    // Notify all admins
    const admins = await db.select().from(users).where(eq(users.role, "admin"));
    for (const admin of admins) {
      await db.insert(notifications).values({
        userId: admin.id,
        title: `AI Escalation: ${user.firstName} ${user.lastName}`,
        body: `Client issue: "${message.substring(0, 150)}". Review in Support Desk.`,
        type: "alert",
      });
    }

    return NextResponse.json({
      reply: reply + "\n\n✅ A support ticket has been created and your Relationship Manager has been notified. Ticket reference will appear in your Concierge tab.",
      timestamp: new Date().toISOString(),
      escalated: true,
    });
  }

  return NextResponse.json({ reply, timestamp: new Date().toISOString() });
}
