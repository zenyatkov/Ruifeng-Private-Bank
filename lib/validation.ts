import { z } from "zod";

// User validation schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phone: z.string().optional(),
  country: z.string().optional().default("Singapore"),
  city: z.string().optional(),
  nationality: z.string().optional(),
  preferredCurrency: z.string().optional().default("USD"),
  preferredLanguage: z.string().optional().default("en"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const setPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const verifyEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 characters"),
});

export const setup2FASchema = z.object({
  method: z.enum(["totp", "sms"]),
});

export const verify2FASchema = z.object({
  token: z.string(),
  code: z.string(),
});

// Account schemas
export const createAccountSchema = z.object({
  type: z.enum(["checking", "savings", "private_wealth", "multi_currency", "fixed_deposit"]),
  currency: z.string(),
  nickname: z.string().optional(),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  nationality: z.string().optional(),
  preferredCurrency: z.string().optional(),
  preferredLanguage: z.string().optional(),
});

// KYC schemas
export const submitKycSchema = z.object({
  fullName: z.string().min(1),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  documentType: z.enum(["passport", "driver_license", "national_id", "other"]),
  documentNumber: z.string().min(1),
  address: z.string().min(1),
  employer: z.string().optional(),
  occupation: z.string().optional(),
  sourceOfFunds: z.string().optional(),
  annualIncome: z.string().optional(),
  pepStatus: z.enum(["yes", "no"]).optional(),
});

// Transaction schemas
export const transferSchema = z.object({
  fromAccountId: z.number().int().positive(),
  toAccountId: z.number().int().positive().optional(),
  recipientAccountId: z.number().int().positive().optional(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  narration: z.string().optional(),
  description: z.string().optional(),
  transferType: z.enum(["internal", "external"]).optional().default("external"),
  pin: z.string().length(4),
  beneficiaryName: z.string().optional(),
  beneficiaryBank: z.string().optional(),
  beneficiaryAccount: z.string().optional(),
  beneficiarySwift: z.string().optional(),
  beneficiaryCountry: z.string().optional(),
});

export const cardTransactionSchema = z.object({
  cardId: z.number().int().positive(),
  pin: z.string().length(4),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
});

// Loan schemas
export const applyLoanSchema = z.object({
  principal: z.string().regex(/^\d+(\.\d{1,2})?$/),
  termMonths: z.number().int().min(1).max(84).optional().default(36),
  productName: z.string().optional().default("Private Credit Facility"),
  purpose: z.string().optional(),
  interestRate: z.string().optional().default("4.250"),
  accountId: z.number().int().positive().optional(),
  currency: z.string().optional().default("USD"),
  userId: z.number().int().positive().optional(),
});

// Bill payment schemas
export const payBillSchema = z.object({
  accountId: z.number().int().positive(),
  billerName: z.string().min(1),
  billerCategory: z.string().optional(),
  billerCode: z.string().optional(),
  referenceNumber: z.string().optional(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  pin: z.string().length(4),
});

// Card schemas
export const createCardSchema = z.object({
  accountId: z.number().int().positive(),
  type: z.enum(["debit", "credit", "platinum", "black"]).default("debit"),
  cardArt: z.string().optional().default("jade-dragon"),
  creditLimit: z.string().optional(),
});

// Generic validation helper
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { data: T | null; error: string | null } {
  try {
    const validated = schema.parse(data);
    return { data: validated as T, error: null };
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
      return { data: null, error: messages.join(", ") };
    }
    return { data: null, error: "Validation failed" };
  }
}

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type ApplyLoanInput = z.infer<typeof applyLoanSchema>;
