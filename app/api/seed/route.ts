import { NextResponse } from "next/server";
import { seedIfNeeded } from "@/lib/seed";

export async function POST() {
  try {
    const result = await seedIfNeeded();
    return NextResponse.json(result);
  } catch (err) {
    console.error("Seed POST error:", err);
    return NextResponse.json({ seeded: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await seedIfNeeded();
    return NextResponse.json(result);
  } catch (err) {
    console.error("Seed GET error:", err);
    return NextResponse.json({ seeded: false, error: "Internal server error" }, { status: 500 });
  }
}
