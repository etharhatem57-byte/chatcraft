import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/data";
import { isDemoMode } from "@/lib/mongodb";
import type { PublicUser } from "@/types";

export const AUTH_COOKIE = "chatcraft_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

interface SessionPayload extends jwt.JwtPayload {
  sub: string;
  email: string;
}

function secret() {
  const value = process.env.JWT_SECRET;
  if (value && value !== "replace-with-at-least-32-random-characters") return value;
  if (isDemoMode() || process.env.NODE_ENV !== "production") return "chatcraft-local-demo-secret-not-for-production";
  if (value) return value;
  throw new Error("JWT_SECRET must be configured in production.");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function createSessionToken(user: PublicUser) {
  return jwt.sign({ email: user.email }, secret(), {
    subject: user.id,
    expiresIn: SESSION_MAX_AGE,
    issuer: "chatcraft",
    audience: "chatcraft-web",
  });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, secret(), {
      issuer: "chatcraft",
      audience: "chatcraft-web",
    }) as SessionPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getRequestUser(request: NextRequest): Promise<PublicUser | null> {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const session = verifySessionToken(token);
  if (!session?.sub) return null;
  return getUserById(session.sub);
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const session = verifySessionToken(token);
  if (!session?.sub) return null;
  return getUserById(session.sub);
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Authentication required.", code: "UNAUTHORIZED" }, { status: 401 });
}
