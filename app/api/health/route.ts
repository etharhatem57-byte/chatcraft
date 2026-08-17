import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/mongodb";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    mode: isDemoMode() ? "demo" : "production",
    groq: Boolean(process.env.GROQ_API_KEY),
    timestamp: new Date().toISOString(),
  });
}
