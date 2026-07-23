import { NextResponse } from "next/server";
import { seedIfNeeded } from "@/lib/seed";

export async function POST() {
  const result = await seedIfNeeded();
  return NextResponse.json(result);
}

export async function GET() {
  const result = await seedIfNeeded();
  return NextResponse.json(result);
}
