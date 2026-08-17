import { NextRequest, NextResponse } from "next/server";

export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.host;
    const originHostname = originUrl.hostname;

    const requestHost =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      request.nextUrl.host;
    if (!requestHost) return true;

    if (originHost === requestHost || originHostname === requestHost) return true;
    if (originHost === request.nextUrl.host || originHostname === request.nextUrl.hostname) return true;

    const cleanRequestHost = requestHost.split(":")[0];
    if (originHostname === cleanRequestHost) return true;

    const isOriginLocal =
      originHostname === "localhost" ||
      originHostname === "127.0.0.1" ||
      originHostname === "0.0.0.0" ||
      originHostname === "::1";
    const isRequestLocal =
      cleanRequestHost === "localhost" ||
      cleanRequestHost === "127.0.0.1" ||
      cleanRequestHost === "0.0.0.0" ||
      cleanRequestHost === "::1";
    if (isOriginLocal && isRequestLocal) return true;

    return false;
  } catch {
    return false;
  }
}

export function forbiddenResponse() {
  return NextResponse.json(
    { error: "Request origin could not be verified.", code: "INVALID_ORIGIN" },
    { status: 403 }
  );
}

export function cleanPlainText(value: string, maxLength: number) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, maxLength);
}
