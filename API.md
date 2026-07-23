# 瑞峯 RuiFeng Private Bank - API Documentation

## Overview

This API provides comprehensive banking services for private clients including accounts, transfers, cards, lending, and wealth management.

## Authentication

All protected endpoints require a valid session cookie (`rf_session`).

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}

Response:
{
  "ok": true,
  "code": "SUCCESS",
  "data": {
    "user": { ... },
    "redirectTo": "/dashboard"
  }
}
```

### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe"
}

Response:
{
  "ok": true,
  "code": "SUCCESS",
  "data": {
    "user": { ... },
    "redirectTo": "/dashboard/kyc"
  }
}
```

## API Response Format

### Success Response
```json
{
  "ok": true,
  "code": "SUCCESS",
  "data": { ... },
  "requestId": "request-id-for-tracing",
  "timestamp": "2026-07-23T10:30:00.000Z"
}
```

### Error Response
```json
{
  "ok": false,
  "code": "ERROR_CODE",
  "error": "Error message",
  "requestId": "request-id-for-tracing",
  "timestamp": "2026-07-23T10:30:00.000Z"
}
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `AUTHENTICATION_ERROR` | 401 | Missing or invalid authentication |
| `AUTHORIZATION_ERROR` | 403 | User lacks permission |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate email) |
| `RATE_LIMIT` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Endpoints

### Accounts
- `GET /api/accounts` - List user accounts
- `POST /api/accounts` - Create new account
- `GET /api/accounts/:id` - Get account details
- `PUT /api/accounts/:id` - Update account

### Transfers
- `POST /api/transfers` - Create transfer
- `GET /api/transfers` - List transfers
- `GET /api/transfers/:id` - Get transfer details

### Cards
- `GET /api/cards` - List cards
- `POST /api/cards` - Create card
- `PUT /api/cards/:id` - Update card

### Transactions
- `GET /api/transactions` - List transactions
- `GET /api/transactions/:id` - Get transaction details

### Loans
- `GET /api/loans` - List loans
- `POST /api/loans` - Apply for loan
- `GET /api/loans/:id` - Get loan details

## Rate Limiting

Rate limits are applied per IP address and user:

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| General API | 100 requests | 60 seconds |
| Login | 5 attempts | 15 minutes |
| Register | 3 attempts | 1 hour |

Headers included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-Request-Id: request-id-for-tracing
```

## Request Headers

```
X-Request-Id: request-id (optional, generated if not provided)
Content-Type: application/json
Cookie: rf_session=...
```

## Examples

### Create Transfer
```bash
curl -X POST http://localhost:3000/api/transfers \
  -H "Content-Type: application/json" \
  -H "Cookie: rf_session=..." \
  -d '{
    "recipientAccountId": 2,
    "amount": "1000.00",
    "narration": "Payment",
    "pin": "1234"
  }'
```

### List Transactions
```bash
curl http://localhost:3000/api/transactions \
  -H "Cookie: rf_session=..."
```

## Development

- Environment variables: See `.env.example`
- Tests: `npm test`
- Type checking: `npm run typecheck`
- Linting: `npm run lint`
