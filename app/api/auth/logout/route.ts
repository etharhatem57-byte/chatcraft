import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { forbiddenResponse, isSameOrigin } from "@/lib/security";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return forbiddenResponse();
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}
