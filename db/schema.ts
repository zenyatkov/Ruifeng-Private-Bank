import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  numeric,
  integer,
  boolean,
  pgEnum,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["client", "admin", "relationship_manager"]);
export const accountTypeEnum = pgEnum("account_type", [
  "checking",
  "savings",
  "private_wealth",
  "multi_currency",
  "fixed_deposit",
]);
export const accountStatusEnum = pgEnum("account_status", ["active", "frozen", "closed", "pending"]);
export const txTypeEnum = pgEnum("tx_type", [
  "transfer",
  "deposit",
  "withdrawal",
  "payment",
  "fx",
  "investment",
  "fee",
  "interest",
  "loan_disbursement",
  "loan_repayment",
]);
export const txStatusEnum = pgEnum("tx_status", ["pending", "completed", "failed", "cancelled", "flagged"]);
export const cardTypeEnum = pgEnum("card_type", ["debit", "credit", "platinum", "black"]);
export const cardStatusEnum = pgEnum("card_status", ["active", "blocked", "expired", "pending"]);
export const loanStatusEnum = pgEnum("loan_status", ["pending", "approved", "active", "paid_off", "rejected", "defaulted"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "resolved", "closed"]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "medium", "high", "urgent"]);
export const kycStatusEnum = pgEnum("kyc_status", ["pending", "verified", "rejected", "review"]);
export const beneficiaryStatusEnum = pgEnum("beneficiary_status", ["active", "pending", "blocked"]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 40 }),
    role: userRoleEnum("role").notNull().default("client"),
    country: varchar("country", { length: 100 }).default("Singapore"),
    city: varchar("city", { length: 100 }),
    address: text("address"),
    nationality: varchar("nationality", { length: 100 }),
    dateOfBirth: varchar("date_of_birth", { length: 20 }),
    kycStatus: kycStatusEnum("kyc_status").notNull().default("pending"),
    clientTier: varchar("client_tier", { length: 50 }).default("Private"),
    preferredCurrency: varchar("preferred_currency", { length: 5 }).default("SGD"),
    preferredLanguage: varchar("preferred_language", { length: 10 }).default("en"),
    transactionPin: varchar("transaction_pin", { length: 255 }),
    kycDocumentType: varchar("kyc_document_type", { length: 80 }),
    kycDocumentNumber: varchar("kyc_document_number", { length: 100 }),
    kycSelfieUrl: text("kyc_selfie_url"),
    kycFullName: varchar("kyc_full_name", { length: 200 }),
    kycDateOfBirth: varchar("kyc_dob", { length: 20 }),
    kycAddress: text("kyc_address"),
    kycEmployer: varchar("kyc_employer", { length: 200 }),
    kycOccupation: varchar("kyc_occupation", { length: 200 }),
    kycSourceOfFunds: varchar("kyc_source_of_funds", { length: 200 }),
    kycAnnualIncome: varchar("kyc_annual_income", { length: 80 }),
    kycPepStatus: varchar("kyc_pep_status", { length: 10 }),
    profilePicture: text("profile_picture"),
    emailVerified: boolean("email_verified").notNull().default(false),
    emailOtp: varchar("email_otp", { length: 10 }),
    emailOtpExpiry: timestamp("email_otp_expiry"),
    totpSecret: varchar("totp_secret", { length: 64 }),
    totpEnabled: boolean("totp_enabled").notNull().default(false),
    passwordResetToken: varchar("password_reset_token", { length: 255 }),
    passwordResetExpiry: timestamp("password_reset_expiry"),
    kycDocumentFile: text("kyc_document_file"),
    cryptoWalletBtc: varchar("crypto_wallet_btc", { length: 120 }),
    cryptoWalletEth: varchar("crypto_wallet_eth", { length: 120 }),
    cryptoWalletUsdt: varchar("crypto_wallet_usdt", { length: 120 }),
    relationshipManagerId: integer("relationship_manager_id"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("users_email_idx").on(t.email), index("users_role_idx").on(t.role)]
);

export const receipts = pgTable("receipts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  transactionId: integer("transaction_id"),
  type: varchar("type", { length: 40 }).notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const billPayments = pgTable("bill_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  billerName: varchar("biller_name", { length: 200 }).notNull(),
  billerCategory: varchar("biller_category", { length: 80 }).notNull(),
  referenceNumber: varchar("reference_number", { length: 100 }),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const scheduledPayments = pgTable("scheduled_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: integer("account_id").notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  recipientName: varchar("recipient_name", { length: 200 }).notNull(),
  recipientAccount: varchar("recipient_account", { length: 100 }),
  recipientBank: varchar("recipient_bank", { length: 200 }),
  frequency: varchar("frequency", { length: 20 }).notNull().default("monthly"),
  nextRunDate: timestamp("next_run_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountNumber: varchar("account_number", { length: 34 }).notNull().unique(),
    iban: varchar("iban", { length: 34 }),
    type: accountTypeEnum("type").notNull().default("checking"),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    balance: numeric("balance", { precision: 18, scale: 2 }).notNull().default("0"),
    availableBalance: numeric("available_balance", { precision: 18, scale: 2 }).notNull().default("0"),
    status: accountStatusEnum("status").notNull().default("active"),
    nickname: varchar("nickname", { length: 100 }),
    interestRate: numeric("interest_rate", { precision: 6, scale: 3 }).default("0"),
    openedAt: timestamp("opened_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("accounts_user_idx").on(t.userId), index("accounts_number_idx").on(t.accountNumber)]
);

export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    counterpartyAccountId: integer("counterparty_account_id"),
    type: txTypeEnum("type").notNull(),
    status: txStatusEnum("status").notNull().default("pending"),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    fee: numeric("fee", { precision: 18, scale: 2 }).default("0"),
    description: text("description"),
    reference: varchar("reference", { length: 64 }).notNull(),
    counterpartyName: varchar("counterparty_name", { length: 200 }),
    counterpartyAccount: varchar("counterparty_account", { length: 64 }),
    category: varchar("category", { length: 80 }),
    metadata: jsonb("metadata"),
    processedAt: timestamp("processed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("tx_account_idx").on(t.accountId),
    index("tx_status_idx").on(t.status),
    index("tx_created_idx").on(t.createdAt),
  ]
);

export const beneficiaries = pgTable("beneficiaries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  bankName: varchar("bank_name", { length: 200 }).notNull(),
  accountNumber: varchar("account_number", { length: 64 }).notNull(),
  swiftCode: varchar("swift_code", { length: 20 }),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  country: varchar("country", { length: 100 }),
  nickname: varchar("nickname", { length: 100 }),
  status: beneficiaryStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  cardNumberMasked: varchar("card_number_masked", { length: 24 }).notNull(),
    cardholderName: varchar("cardholder_name", { length: 200 }).notNull(),
    type: cardTypeEnum("type").notNull().default("debit"),
    status: cardStatusEnum("status").notNull().default("active"),
    expiryMonth: integer("expiry_month").notNull(),
    expiryYear: integer("expiry_year").notNull(),
    cvv: varchar("cvv", { length: 4 }).default("***"),
    fullCardNumber: varchar("full_card_number", { length: 20 }),
    creditLimit: numeric("credit_limit", { precision: 18, scale: 2 }),
    spentThisMonth: numeric("spent_this_month", { precision: 18, scale: 2 }).default("0"),
    network: varchar("network", { length: 40 }).default("Visa Infinite"),
    cardArt: varchar("card_art", { length: 40 }).default("jade-dragon"),
    cryptoWallet: varchar("crypto_wallet", { length: 100 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: integer("account_id").references(() => accounts.id),
  loanNumber: varchar("loan_number", { length: 40 }).notNull().unique(),
  productName: varchar("product_name", { length: 150 }).notNull(),
  principal: numeric("principal", { precision: 18, scale: 2 }).notNull(),
  outstanding: numeric("outstanding", { precision: 18, scale: 2 }).notNull(),
  interestRate: numeric("interest_rate", { precision: 6, scale: 3 }).notNull(),
  termMonths: integer("term_months").notNull(),
  monthlyPayment: numeric("monthly_payment", { precision: 18, scale: 2 }),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  status: loanStatusEnum("status").notNull().default("pending"),
  purpose: text("purpose"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: integer("account_id").references(() => accounts.id),
  name: varchar("name", { length: 200 }).notNull(),
  assetClass: varchar("asset_class", { length: 80 }).notNull(),
  symbol: varchar("symbol", { length: 30 }),
  quantity: numeric("quantity", { precision: 18, scale: 6 }).notNull(),
  avgCost: numeric("avg_cost", { precision: 18, scale: 4 }).notNull(),
  currentPrice: numeric("current_price", { precision: 18, scale: 4 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  region: varchar("region", { length: 80 }).default("Asia Pacific"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subject: varchar("subject", { length: 250 }).notNull(),
  message: text("message").notNull(),
  status: ticketStatusEnum("status").notNull().default("open"),
  priority: ticketPriorityEnum("priority").notNull().default("medium"),
  category: varchar("category", { length: 80 }).default("General"),
  adminReply: text("admin_reply"),
    userReply: text("user_reply"),
    assignedTo: integer("assigned_to"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const adminLogs = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 150 }).notNull(),
  targetType: varchar("target_type", { length: 80 }),
  targetId: integer("target_id"),
  details: text("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const fxRates = pgTable("fx_rates", {
  id: serial("id").primaryKey(),
  baseCurrency: varchar("base_currency", { length: 3 }).notNull(),
  quoteCurrency: varchar("quote_currency", { length: 3 }).notNull(),
  rate: numeric("rate", { precision: 18, scale: 8 }).notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  type: varchar("type", { length: 50 }).default("info"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  cards: many(cards),
  loans: many(loans),
  investments: many(investments),
  beneficiaries: many(beneficiaries),
  tickets: many(supportTickets),
  notifications: many(notifications),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
  transactions: many(transactions),
  cards: many(cards),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, { fields: [transactions.accountId], references: [accounts.id] }),
}));
