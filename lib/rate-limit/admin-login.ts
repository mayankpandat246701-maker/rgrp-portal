import "server-only";

import { InMemoryRateLimiter } from "@/lib/rate-limit/in-memory-provider";
import {
  checkSharedLoginFailures,
  clearSharedLoginFailures,
  isUpstashRateLimitAvailable,
  recordSharedLoginFailure,
} from "@/lib/rate-limit/upstash-provider";
import type { RateLimitResult } from "@/lib/rate-limit/types";

const loginLimiter = new InMemoryRateLimiter(5, 15 * 60 * 1000);

function shouldUseUpstash(): boolean {
  return process.env.RATE_LIMIT_PROVIDER?.trim().toLowerCase() === "upstash";
}

export async function checkAdminLoginRateLimit(
  ip: string,
): Promise<RateLimitResult> {
  if (shouldUseUpstash()) {
    if (!isUpstashRateLimitAvailable()) {
      return { allowed: false, retryAfterSeconds: 60 };
    }

    return checkSharedLoginFailures(ip);
  }

  if (process.env.NODE_ENV === "production") {
    return { allowed: false, retryAfterSeconds: 60 };
  }

  return loginLimiter.check(ip);
}

export async function recordAdminLoginFailure(ip: string): Promise<void> {
  if (shouldUseUpstash()) {
    if (isUpstashRateLimitAvailable()) {
      await recordSharedLoginFailure(ip);
    }
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    loginLimiter.recordFailure(ip);
  }
}

export async function clearAdminLoginFailures(ip: string): Promise<void> {
  if (shouldUseUpstash()) {
    if (isUpstashRateLimitAvailable()) {
      await clearSharedLoginFailures(ip);
    }
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    loginLimiter.clear(ip);
  }
}