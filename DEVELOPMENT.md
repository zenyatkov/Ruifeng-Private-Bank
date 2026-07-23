# Development Guide

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or pnpm

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database URL and secrets
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   Application runs at `http://localhost:3000`

## Project Structure

```
src/
├── app/              # Next.js app router pages and layouts
├── components/       # React components
├── db/              # Database schema and migrations
├── lib/             # Utilities and helpers
│   ├── auth.ts      # Authentication logic
│   ├── api-error.ts # Error handling
│   ├── logger.ts    # Logging utilities
│   ├── env.ts       # Environment validation
│   ├── validation.ts# Zod schemas
│   └── ...
└── middleware.ts    # Next.js middleware
```

## Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
npm test             # Run tests
npm test:ui          # Run tests with UI
npm test:coverage    # Generate coverage report
```

## Database

### Migrations

Database schema is defined in `src/db/schema.ts` using Drizzle ORM.

Auto-seed runs on first application boot via `src/lib/seed.ts`.

### Querying

```typescript
import { db } from "@/db";
import { users, accounts } from "@/db/schema";
import { eq } from "drizzle-orm";

// Select
const user = await db.select().from(users).where(eq(users.id, 1));

// Insert
const [newUser] = await db.insert(users).values({ ... }).returning();

// Update
await db.update(users).set({ name: "John" }).where(eq(users.id, 1));

// Delete
await db.delete(users).where(eq(users.id, 1));
```

## API Development

### Creating an API Endpoint

1. **Define validation schema** in `src/lib/validation.ts`
   ```typescript
   export const mySchema = z.object({
     field: z.string(),
   });
   ```

2. **Create route handler** in `src/app/api/route-name/route.ts`
   ```typescript
   import { NextResponse, NextRequest } from "next/server";
   import { createValidatedApiHandler } from "@/lib/api-handler";
   import { mySchema } from "@/lib/validation";

   export const POST = createValidatedApiHandler(
     mySchema,
     async (req, data, { requestId }) => {
       // Your logic here
       return NextResponse.json({ ok: true });
     }
   );
   ```

3. **Use error classes** for consistency
   ```typescript
   import { ValidationError, NotFoundError } from "@/lib/api-error";

   if (!found) throw new NotFoundError("User not found");
   ```

## Testing

### Running Tests

```bash
npm test                  # Watch mode
npm test:ui             # Interactive UI
npm test:coverage       # Coverage report
```

### Writing Tests

```typescript
import { describe, it, expect } from "vitest";
import { loginSchema } from "@/lib/validation";

describe("Auth", () => {
  it("validates login data", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "Password123!"
    });
    expect(result.success).toBe(true);
  });
});
```

## Logging

```typescript
import { logger } from "@/lib/logger";

logger.info("User logged in", { userId: 1, email: "user@example.com" });
logger.warn("High memory usage", { memory: 500 });
logger.error("Database connection failed", error, { attempt: 1 });
```

## Security

### Environment Variables
- Never commit `.env.local`
- Store secrets in `.env.local` during development
- Deploy secrets via platform environment variables

### Authentication
- Session-based with JWT tokens
- Passwords hashed with bcrypt
- HTTP-only session cookies

### Rate Limiting
- 100 requests per minute (general)
- 5 login attempts per 15 minutes
- Configured in `src/lib/rate-limit.ts`

## Performance

### Caching
- Static routes cached at build time
- Dynamic routes use Next.js caching headers
- Database queries optimized with indexes

### Monitoring
- All requests logged with duration
- Unique request IDs for tracing
- Error tracking and alerting ready

## Common Tasks

### Add a New Entity

1. Add schema to `src/db/schema.ts`
2. Create API routes in `src/app/api/entity-name/`
3. Create validation schemas in `src/lib/validation.ts`
4. Add tests in `src/lib/__tests__/`
5. Create UI components as needed

### Add Authentication to Route

```typescript
import { withAuth } from "@/lib/api-error";

export const GET = withAuth(async (req, userId) => {
  // userId is guaranteed to exist
});
```

### Add Rate Limiting

```typescript
import { rateLimitByIp, rateLimitByUserId } from "@/lib/rate-limit";

// In route handler
const limit = await rateLimitByIp(10, 60000); // 10 per minute
if (!limit.allowed) {
  return errorResponse(new RateLimitError());
}
```

## Troubleshooting

### Port 3000 already in use
```bash
lsof -i :3000
kill -9 <PID>
```

### Database connection failed
- Check `DATABASE_URL` in `.env.local`
- Verify PostgreSQL is running
- Check database credentials

### Tests failing
```bash
npm test -- --reporter=verbose
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Zod Validation](https://zod.dev)
- [Vitest](https://vitest.dev)
