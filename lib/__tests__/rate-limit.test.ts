import { describe, it, expect } from "vitest";
import { checkRateLimit, rateLimitByIp } from "@/lib/rate-limit";

describe("Rate Limiting", () => {
  describe("checkRateLimit", () => {
    it("should allow requests within limit", () => {
      const result = checkRateLimit("test-key", 5, 60000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("should reject requests over limit", () => {
      const key = "test-key-limit";
      for (let i = 0; i < 5; i++) {
        checkRateLimit(key, 5, 60000);
      }
      const result = checkRateLimit(key, 5, 60000);
      expect(result.allowed).toBe(false);
    });

    it("should track remaining count", () => {
      const key = "test-key-count";
      const r1 = checkRateLimit(key, 10, 60000);
      const r2 = checkRateLimit(key, 10, 60000);
      expect(r1.remaining).toBe(9);
      expect(r2.remaining).toBe(8);
    });
  });
});
