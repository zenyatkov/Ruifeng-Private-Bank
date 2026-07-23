import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { COOKIE_NAME, clearSessionCookie, getSessionToken } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function POST() {
  try {
    const token = await getSessionToken();
    if (token) {
      await db.delete(sessions).where(eq(sessions.token, token));
    }

    logger.info("User logged out");

    const response = NextResponse.json({ ok: true });
    clearSessionCookie(response);
    response.cookies.delete(COOKIE_NAME);
    return response;
  } catch (error) {
    logger.error("Logout error", error);
    return NextResponse.json({ ok: true }); // Always return success to clear client-side session
  }
}

