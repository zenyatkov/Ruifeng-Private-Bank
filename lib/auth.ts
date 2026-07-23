import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { eq, and, gt } from "drizzle-orm";
import type { NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

export const COOKIE_NAME = "rf_session";
const SESSION_DAYS = 7;

function getSecret() {
  const secret = process.env.AUTH_SECRET || "ruifeng-private-bank-dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export type SessionUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: "client" | "admin" | "relationship_manager";
  clientTier: string | null;
  kycStatus: string;
  country: string | null;
  isActive: boolean;
  preferredCurrency: string;
  preferredLanguage: string;
};

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    // IMPORTANT: never set secure in sandbox so cookie works on both http and https
    secure: false,
    path: "/",
    expires: expiresAt,
  };
}

export async function hashPassword(password: string) { return bcrypt.hash(password, 10); }
export async function verifyPassword(password: string, hash: string) { return bcrypt.compare(password, hash); }

export async function createSessionToken(userId: number) {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .setIssuedAt()
    .sign(getSecret());
  await db.insert(sessions).values({ userId, token, expiresAt });
  return { token, expiresAt };
}

export function attachSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(COOKIE_NAME, token, sessionCookieOptions(expiresAt));
  return response;
}

export async function createSession(userId: number) {
  const { token, expiresAt } = await createSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, sessionCookieOptions(expiresAt));
  return token;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
    cookieStore.delete(COOKIE_NAME);
  }
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", { httpOnly: true, sameSite: "lax", secure: false, path: "/", expires: new Date(0) });
  return response;
}

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = Number(payload.userId);
    if (!Number.isFinite(userId)) return null;
    const [session] = await db.select().from(sessions).where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date()))).limit(1);
    if (!session) return null;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user || !user.isActive) return null;
    return {
      id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName,
      role: user.role, clientTier: user.clientTier, kycStatus: user.kycStatus, country: user.country,
      isActive: user.isActive, preferredCurrency: user.preferredCurrency || "USD", preferredLanguage: user.preferredLanguage || "en",
    };
  } catch { return null; }
}

export async function requireUser(roles?: Array<SessionUser["role"]>) {
  const user = await getCurrentUser();
  if (!user) return { user: null as SessionUser | null, error: "Unauthorized" as const };
  if (roles && !roles.includes(user.role)) return { user: null as SessionUser | null, error: "Forbidden" as const };
  return { user, error: null };
}

export async function updateLastLogin(userId: number) {
  await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, userId));
}
