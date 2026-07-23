import { describe, it, expect, beforeEach } from "vitest";
import { loginSchema, registerSchema, transferSchema } from "@/lib/validation";
import { ValidationError } from "@/lib/api-error";

describe("Validation Schemas", () => {
  describe("loginSchema", () => {
    it("should validate correct login data", () => {
      const data = { email: "user@example.com", password: "Password123!" };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const data = { email: "invalid", password: "Password123!" };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject short password", () => {
      const data = { email: "user@example.com", password: "short" };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("should validate correct registration data", () => {
      const data = {
        email: "user@example.com",
        password: "Password123!",
        firstName: "John",
        lastName: "Doe",
      };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should apply default values", () => {
      const data = {
        email: "user@example.com",
        password: "Password123!",
        firstName: "John",
        lastName: "Doe",
      };
      const result = registerSchema.safeParse(data);
      if (result.success) {
        expect(result.data.country).toBe("Singapore");
        expect(result.data.preferredCurrency).toBe("USD");
      }
    });
  });

  describe("transferSchema", () => {
    it("should validate correct transfer data", () => {
      const data = {
        recipientAccountId: 123,
        amount: "1000.50",
        pin: "1234",
      };
      const result = transferSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject invalid amount format", () => {
      const data = {
        recipientAccountId: 123,
        amount: "invalid",
        pin: "1234",
      };
      const result = transferSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject invalid PIN length", () => {
      const data = {
        recipientAccountId: 123,
        amount: "1000.50",
        pin: "12345",
      };
      const result = transferSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
