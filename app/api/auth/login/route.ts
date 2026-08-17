import { NextRequest, NextResponse } from "next/server";
import { comparePassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { findUserByEmailForAuth } from "@/lib/data";
import { isDemoMode } from "@/lib/mongodb";
import { rateLimit, requestKey } from "@/lib/rate-limit";
import { forbiddenResponse, isSameOrigin } from "@/lib/security";
import { loginSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return forbiddenResponse();
  const limit = rateLimit(requestKey(request, "login"), 12, 15 * 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many attempts.", code: "RATE_LIMITED" }, { status: 429 });
  }

  try {
    const body = loginSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid credentials.", code: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const record = await findUserByEmailForAuth(body.data.email);
    const valid = record && (await comparePassword(body.data.password, record.passwordHash));
    if (!record || !valid) {
      return NextResponse.json({ error: "Invalid credentials.", code: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const user = {
      id: record.id,
      name: record.name,
      email: record.email,
      language: record.language,
      createdAt: record.createdAt,
    };
    const response = NextResponse.json({ user, demo: isDemoMode() });
    setSessionCookie(response, createSessionToken(user));
    response.cookies.set("chatcraft_language", user.language, {
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json({ error: "Unable to log in.", code: "SERVER_ERROR" }, { status: 500 });
  }
}
