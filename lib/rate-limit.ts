interface Entry {
  count: number;
  resetAt: number;
}

const globalForRateLimit = globalThis as typeof globalThis & {
  chatcraftRateLimits?: Map<string, Entry>;
};

const limits = globalForRateLimit.chatcraftRateLimits ?? new Map<string, Entry>();
globalForRateLimit.chatcraftRateLimits = limits;

export function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const current = limits.get(key);

  if (!current || current.resetAt <= now) {
    limits.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (current.count >= limit) {
    return {
      success: false,
      remaining: 0,
      retryAfter: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  current.count += 1;
  return { success: true, remaining: limit - current.count, retryAfter: 0 };
}

export function requestKey(request: Request, scope: string, userId?: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  return `${scope}:${userId || ip}`;
}
