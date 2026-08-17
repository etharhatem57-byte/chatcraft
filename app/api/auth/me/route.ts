import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, unauthorizedResponse } from "@/lib/auth";
import { isDemoMode } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return unauthorizedResponse();
  return NextResponse.json({ user, demo: isDemoMode() });
}
