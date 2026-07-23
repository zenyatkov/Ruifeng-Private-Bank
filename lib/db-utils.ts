import { db } from "@/db";

// Transaction wrapper for database operations
export async function withTransaction<T>(
  callback: () => Promise<T>
): Promise<T> {
  // Drizzle doesn't have built-in transactions yet, so we execute directly
  // For production, implement proper transaction support
  try {
    return await callback();
  } catch (error) {
    throw error;
  }
}

// Retry logic for transient errors
export async function withRetry<T>(
  callback: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await callback();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on validation errors
      if (lastError.message.includes("validation")) {
        throw error;
      }

      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }

  throw lastError;
}

// Batch operations helper
export async function batchInsert<T>(
  items: T[],
  insertFn: (batch: T[]) => Promise<void>,
  batchSize: number = 100
) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await insertFn(batch);
  }
}
