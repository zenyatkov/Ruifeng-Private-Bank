import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  accounts,
  beneficiaries,
  cards,
  fxRates,
  investments,
  loans,
  notifications,
  supportTickets,
  systemSettings,
  transactions,
  users,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { generateAccountNumber, generateLoanNumber, generateReference, maskCardNumber } from "@/lib/utils";

export async function ensureSeedData() {
  const [existing] = await db.select({ value: count() }).from(users);
  if (existing.value > 0) return { seeded: false };

  const passwordHash = await hashPassword("Password123!");

  const [admin] = await db
    .insert(users)
    .values({
      email: "admin@axorabank.com",
      passwordHash,
      firstName: "Amelia",
      lastName: "Chen",
      phone: "+65 9000 1000",
      role: "admin",
      country: "Singapore",
      city: "Singapore",
      address: "1 Raffles Place, #40-01",
      nationality: "Singaporean",
      dateOfBirth: "1985-03-12",
      kycStatus: "verified",
      clientTier: "Ultra High Net Worth",
      isActive: true,
    })
    .returning();

  const [rm] = await db
    .insert(users)
    .values({
      email: "rm@axorabank.com",
      passwordHash,
      firstName: "Hiroshi",
      lastName: "Tanaka",
      phone: "+81 3 5555 0100",
      role: "relationship_manager",
      country: "Japan",
      city: "Tokyo",
      address: "Marunouchi 1-1-1",
      nationality: "Japanese",
      dateOfBirth: "1980-07-22",
      kycStatus: "verified",
      clientTier: "Prestige",
      isActive: true,
    })
    .returning();

  const clientSeeds = [
    {
      email: "client@axorabank.com",
      firstName: "Priya",
      lastName: "Sharma",
      phone: "+91 98 1000 2000",
      country: "India",
      city: "Mumbai",
      address: "Bandra Kurla Complex",
      nationality: "Indian",
      dateOfBirth: "1990-11-05",
      clientTier: "Ultra High Net Worth",
    },
    {
      email: "li.wei@example.com",
      firstName: "Wei",
      lastName: "Li",
      phone: "+852 9123 4567",
      country: "Hong Kong",
      city: "Central",
      address: "Two IFC, 8 Finance Street",
      nationality: "Hong Kong",
      dateOfBirth: "1982-04-18",
      clientTier: "Prestige",
    },
    {
      email: "siti.rahman@example.com",
      firstName: "Siti",
      lastName: "Rahman",
      phone: "+60 12 345 6789",
      country: "Malaysia",
      city: "Kuala Lumpur",
      address: "TRX Exchange 106",
      nationality: "Malaysian",
      dateOfBirth: "1988-09-30",
      clientTier: "Priority",
    },
  ];

  const createdClients = [];
  for (const c of clientSeeds) {
    const [client] = await db
      .insert(users)
      .values({
        ...c,
        passwordHash,
        role: "client",
        kycStatus: "verified",
        relationshipManagerId: rm.id,
        isActive: true,
      })
      .returning();
    createdClients.push(client);
  }

  const primary = createdClients[0];

  const accountDefs = [
    { type: "private_wealth" as const, currency: "USD", balance: "2845000.00", nickname: "Family Office USD" },
    { type: "multi_currency" as const, currency: "SGD", balance: "920450.55", nickname: "SGD Liquidity" },
    { type: "savings" as const, currency: "HKD", balance: "1580000.00", nickname: "HK Wealth Saver" },
    { type: "checking" as const, currency: "JPY", balance: "45200000.00", nickname: "Tokyo Operating" },
    { type: "fixed_deposit" as const, currency: "USD", balance: "500000.00", nickname: "12M Fixed Deposit", interestRate: "4.250" },
  ];

  const createdAccounts = [];
  for (const a of accountDefs) {
    const num = generateAccountNumber();
    const [acc] = await db
      .insert(accounts)
      .values({
        userId: primary.id,
        accountNumber: num,
        iban: `SG89RFPB${num}`,
        type: a.type,
        currency: a.currency,
        balance: a.balance,
        availableBalance: a.balance,
        status: "active",
        nickname: a.nickname,
        interestRate: a.interestRate ?? (a.type === "savings" ? "2.150" : "0.500"),
      })
      .returning();
    createdAccounts.push(acc);
  }

  // Secondary clients accounts
  for (const client of createdClients.slice(1)) {
    const num = generateAccountNumber();
    await db.insert(accounts).values({
      userId: client.id,
      accountNumber: num,
      iban: `SG89RFPB${num}`,
      type: "private_wealth",
      currency: "USD",
      balance: "750000.00",
      availableBalance: "750000.00",
      status: "active",
      nickname: "Primary Wealth",
      interestRate: "1.250",
    });
  }

  const usdAccount = createdAccounts[0];
  const sgdAccount = createdAccounts[1];

  const txSeeds = [
    {
      accountId: usdAccount.id,
      type: "deposit" as const,
      status: "completed" as const,
      amount: "250000.00",
      currency: "USD",
      description: "Capital injection — Family Trust",
      counterpartyName: "瑞峯 RuiFeng Trust",
      category: "Income",
    },
    {
      accountId: usdAccount.id,
      type: "transfer" as const,
      status: "completed" as const,
      amount: "45000.00",
      currency: "USD",
      description: "Wire to Hong Kong property SPV",
      counterpartyName: "Harbour View Holdings",
      counterpartyAccount: "HK mon 44882100",
      category: "Transfer",
    },
    {
      accountId: usdAccount.id,
      type: "investment" as const,
      status: "completed" as const,
      amount: "120000.00",
      currency: "USD",
      description: "Asia Tech Equity Fund subscription",
      counterpartyName: "瑞峯 RuiFeng Asset Management",
      category: "Investment",
    },
    {
      accountId: sgdAccount.id,
      type: "fx" as const,
      status: "completed" as const,
      amount: "85000.00",
      currency: "SGD",
      description: "USD/SGD conversion",
      counterpartyName: "瑞峯 RuiFeng FX Desk",
      category: "FX",
    },
    {
      accountId: usdAccount.id,
      type: "payment" as const,
      status: "completed" as const,
      amount: "12800.00",
      currency: "USD",
      description: "Private jet charter — NetJets Asia",
      counterpartyName: "NetJets Asia",
      category: "Lifestyle",
    },
    {
      accountId: usdAccount.id,
      type: "interest" as const,
      status: "completed" as const,
      amount: "3240.55",
      currency: "USD",
      description: "Monthly private wealth interest credit",
      counterpartyName: "瑞峯 RuiFeng Private Bank",
      category: "Interest",
    },
    {
      accountId: usdAccount.id,
      type: "transfer" as const,
      status: "pending" as const,
      amount: "75000.00",
      currency: "USD",
      description: "Pending SWIFT to Tokyo brokerage",
      counterpartyName: "Nomura Securities",
      category: "Transfer",
    },
    {
      accountId: sgdAccount.id,
      type: "withdrawal" as const,
      status: "completed" as const,
      amount: "15000.00",
      currency: "SGD",
      description: "Branch cash withdrawal — Marina Bay",
      counterpartyName: "瑞峯 RuiFeng Branch SG",
      category: "Cash",
    },
  ];

  for (const t of txSeeds) {
    await db.insert(transactions).values({
      ...t,
      fee: t.type === "transfer" || t.type === "fx" ? "25.00" : "0",
      reference: generateReference(),
      processedAt: t.status === "completed" ? new Date() : null,
    });
  }

  await db.insert(beneficiaries).values([
    {
      userId: primary.id,
      name: "Harbour View Holdings Ltd",
      bankName: "HSBC Hong Kong",
      accountNumber: "004-123-456789-001",
      swiftCode: "HSBCHKHH",
      currency: "HKD",
      country: "Hong Kong",
      nickname: "HK Property SPV",
      status: "active",
    },
    {
      userId: primary.id,
      name: "Sharma Family Trust",
      bankName: "DBS Bank",
      accountNumber: "072-9876543-01",
      swiftCode: "DBSSSGSG",
      currency: "SGD",
      country: "Singapore",
      nickname: "Family Trust",
      status: "active",
    },
    {
      userId: primary.id,
      name: "Tokyo Equity Desk",
      bankName: "MUFG Bank",
      accountNumber: "JP90 0001 0000 1234",
      swiftCode: "BOTKJPJT",
      currency: "JPY",
      country: "Japan",
      nickname: "Brokerage",
      status: "active",
    },
  ]);

  await db.insert(cards).values([
    {
      userId: primary.id,
      accountId: usdAccount.id,
      cardNumberMasked: maskCardNumber(),
      cardholderName: "PRIYA SHARMA",
      type: "black",
      status: "active",
      expiryMonth: 9,
      expiryYear: 2029,
      creditLimit: "250000.00",
      spentThisMonth: "18420.00",
      network: "Mastercard World Elite",
    },
    {
      userId: primary.id,
      accountId: sgdAccount.id,
      cardNumberMasked: maskCardNumber(),
      cardholderName: "PRIYA SHARMA",
      type: "platinum",
      status: "active",
      expiryMonth: 3,
      expiryYear: 2028,
      creditLimit: "80000.00",
      spentThisMonth: "4200.00",
      network: "Visa Infinite",
    },
  ]);

  await db.insert(loans).values([
    {
      userId: primary.id,
      accountId: usdAccount.id,
      loanNumber: generateLoanNumber(),
      productName: "Secured Wealth Credit Line",
      principal: "1000000.00",
      outstanding: "620000.00",
      interestRate: "3.850",
      termMonths: 60,
      monthlyPayment: "18450.00",
      currency: "USD",
      status: "active",
      purpose: "Liquidity against securities portfolio",
      startDate: new Date("2024-01-15"),
      endDate: new Date("2029-01-15"),
    },
    {
      userId: primary.id,
      loanNumber: generateLoanNumber(),
      productName: "Asia Property Financing",
      principal: "2500000.00",
      outstanding: "2500000.00",
      interestRate: "4.100",
      termMonths: 120,
      monthlyPayment: null,
      currency: "SGD",
      status: "pending",
      purpose: "Singapore residential acquisition",
    },
  ]);

  await db.insert(investments).values([
    {
      userId: primary.id,
      accountId: usdAccount.id,
      name: "瑞峯 Asia Growth Fund",
      assetClass: "Equities",
      symbol: "AXAGF",
      quantity: "12500.000000",
      avgCost: "42.5000",
      currentPrice: "48.7500",
      currency: "USD",
      region: "Asia Pacific",
    },
    {
      userId: primary.id,
      accountId: usdAccount.id,
      name: "Singapore Government Bonds 2032",
      assetClass: "Fixed Income",
      symbol: "SGS32",
      quantity: "500000.000000",
      avgCost: "98.2000",
      currentPrice: "99.4500",
      currency: "SGD",
      region: "Singapore",
    },
    {
      userId: primary.id,
      accountId: usdAccount.id,
      name: "Nikkei 225 ETF",
      assetClass: "ETF",
      symbol: "1321.T",
      quantity: "800.000000",
      avgCost: "32000.0000",
      currentPrice: "38500.0000",
      currency: "JPY",
      region: "Japan",
    },
    {
      userId: primary.id,
      accountId: usdAccount.id,
      name: "Private Credit Asia Opportunities",
      assetClass: "Alternatives",
      symbol: "PC-ASIA",
      quantity: "200.000000",
      avgCost: "1000.0000",
      currentPrice: "1085.5000",
      currency: "USD",
      region: "Asia Pacific",
    },
    {
      userId: primary.id,
      accountId: usdAccount.id,
      name: "Gold Bullion Allocation",
      assetClass: "Commodities",
      symbol: "XAU",
      quantity: "45.500000",
      avgCost: "1950.0000",
      currentPrice: "2340.0000",
      currency: "USD",
      region: "Global",
    },
  ]);

  await db.insert(supportTickets).values([
    {
      userId: primary.id,
      subject: "Increase SWIFT daily limit",
      message: "Please raise my international transfer limit to USD 500,000 for Q2 property closings.",
      status: "in_progress",
      priority: "high",
      category: "Limits",
      assignedTo: admin.id,
      adminReply: "Under compliance review. Expected clearance within 24 hours.",
    },
    {
      userId: primary.id,
      subject: "Request physical black card",
      message: "I would like a metal World Elite card shipped to my Singapore residence.",
      status: "open",
      priority: "medium",
      category: "Cards",
    },
  ]);

  await db.insert(notifications).values([
    {
      userId: primary.id,
      title: "Transfer completed",
      body: "Your USD 45,000 wire to Harbour View Holdings has been completed.",
      type: "success",
      isRead: false,
    },
    {
      userId: primary.id,
      title: "FX rate alert",
      body: "USD/SGD reached your target rate of 1.3450.",
      type: "info",
      isRead: false,
    },
    {
      userId: primary.id,
      title: "Loan application received",
      body: "Your Asia Property Financing application is under credit review.",
      type: "info",
      isRead: true,
    },
    {
      userId: admin.id,
      title: "New high-value transfer pending",
      body: "Client Priya Sharma has a pending USD 75,000 SWIFT transfer requiring review.",
      type: "alert",
      isRead: false,
    },
  ]);

  const fxPairs = [
    ["USD", "SGD", "1.34520000"],
    ["USD", "HKD", "7.81250000"],
    ["USD", "JPY", "151.24000000"],
    ["USD", "CNY", "7.24500000"],
    ["USD", "INR", "83.12000000"],
    ["USD", "KRW", "1358.50000000"],
    ["USD", "THB", "35.68000000"],
    ["USD", "MYR", "4.47200000"],
    ["USD", "IDR", "15850.00000000"],
    ["USD", "AUD", "1.52800000"],
    ["USD", "EUR", "0.92150000"],
    ["USD", "GBP", "0.78540000"],
    ["SGD", "USD", "0.74340000"],
    ["SGD", "MYR", "3.32500000"],
    ["HKD", "USD", "0.12800000"],
  ];

  await db.insert(fxRates).values(
    fxPairs.map(([base, quote, rate]) => ({
      baseCurrency: base,
      quoteCurrency: quote,
      rate,
    }))
  );

  // Seed system settings (all services enabled by default)
  const systemSettingDefaults = [
    { key: "transfers_enabled", value: "true" },
    { key: "withdrawals_enabled", value: "true" },
    { key: "cards_enabled", value: "true" },
    { key: "fx_enabled", value: "true" },
    { key: "loans_enabled", value: "true" },
    { key: "bills_enabled", value: "true" },
    { key: "investments_enabled", value: "true" },
    { key: "crypto_enabled", value: "true" },
    { key: "notifications_enabled", value: "true" },
  ];

  await db.insert(systemSettings).values(systemSettingDefaults);

  return { seeded: true, adminId: admin.id, clientId: primary.id };
}

export async function seedIfNeeded() {
  try {
    const result = await ensureSeedData();
    // Also ensure system settings exist even if DB was already seeded
    await ensureSystemSettings();
    return result;
  } catch (error) {
    console.error("Seed error:", error);
    return { seeded: false, error };
  }
}

export async function ensureSystemSettings() {
  try {
    const existing = await db.select().from(systemSettings);
    const defaults = [
      { key: "transfers_enabled", value: "true" },
      { key: "withdrawals_enabled", value: "true" },
      { key: "cards_enabled", value: "true" },
      { key: "fx_enabled", value: "true" },
      { key: "loans_enabled", value: "true" },
      { key: "bills_enabled", value: "true" },
      { key: "investments_enabled", value: "true" },
      { key: "crypto_enabled", value: "true" },
      { key: "notifications_enabled", value: "true" },
    ];
    // Only insert settings that don't already exist
    const missing = defaults.filter(d => !existing.find(e => e.key === d.key));
    if (missing.length > 0) {
      await db.insert(systemSettings).values(missing);
    }
  } catch (error) {
    console.error("System settings seed error:", error);
  }
}
