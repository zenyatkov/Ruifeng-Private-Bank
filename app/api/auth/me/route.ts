import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { seedIfNeeded } from "@/lib/seed";

export async function GET() {
  try {
    await seedIfNeeded();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (err) {
    console.error("Auth me error:", err);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
