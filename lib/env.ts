// Environment validation - runs at startup
function validateEnv() {
  const required = ["DATABASE_URL", "AUTH_SECRET"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  // Validate AUTH_SECRET length
  if ((process.env.AUTH_SECRET || "").length < 32) {
    console.warn(
      "⚠️  AUTH_SECRET is less than 32 characters. This is not secure for production."
    );
  }

  // Warn if using development defaults
  if (process.env.NODE_ENV === "production" && process.env.AUTH_SECRET?.includes("dev")) {
    throw new Error("Cannot use development AUTH_SECRET in production");
  }

  return {
    databaseUrl: process.env.DATABASE_URL!,
    authSecret: process.env.AUTH_SECRET!,
    resendApiKey: process.env.RESEND_API_KEY || "",
    nodeEnv: (process.env.NODE_ENV || "development") as "development" | "production",
    logLevel: (process.env.LOG_LEVEL || "info") as
      | "debug"
      | "info"
      | "warn"
      | "error",
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || "5", 10),
    loginAttemptWindowMs: parseInt(process.env.LOGIN_ATTEMPT_WINDOW_MS || "900000", 10),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  };
}

let env: ReturnType<typeof validateEnv> | null = null;

export function getEnv() {
  if (!env) {
    env = validateEnv();
  }
  return env;
}

// Validate on import in development
if (process.env.NODE_ENV !== "test") {
  getEnv();
}
