import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, hashPassword, setSessionCookie } from "@/lib/auth";
import { createUser } from "@/lib/data";
import { isDemoMode } from "@/lib/mongodb";
import { rateLimit, requestKey } from "@/lib/rate-limit";
import { forbiddenResponse, isSameOrigin } from "@/lib/security";
import { registerSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return forbiddenResponse();

  const limit = rateLimit(requestKey(request, "register"), 8, 15 * 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many attempts.", code: "RATE_LIMITED" }, { status: 429 });
  }

  try {
    const body = registerSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid registration details.", code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const passwordHash = await hashPassword(body.data.password);
    const user = await createUser({
      name: body.data.name,
      email: body.data.email,
      passwordHash,
      language: body.data.language,
    });

    const response = NextResponse.json({ user, demo: isDemoMode() }, { status: 201 });
    setSessionCookie(response, createSessionToken(user));
    response.cookies.set("chatcraft_language", user.language, {
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "Email already registered.", code: "EMAIL_EXISTS" }, { status: 409 });
    }
    console.error("Registration failed", error);
    return NextResponse.json({ error: "Unable to create account.", code: "SERVER_ERROR" }, { status: 500 });
  }
}
