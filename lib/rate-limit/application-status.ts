import "server-only";

import { InMemoryRateLimiter } from "@/lib/rate-limit/in-memory-provider";
import {
  consumeSharedRateLimit,
  isUpstashRateLimitAvailable,
} from "@/lib/rate-limit/upstash-provider";
import type { RateLimitResult } from "@/lib/rate-limit/types";

const lookupLimiter = new InMemoryRateLimiter(10, 15 * 60 * 1000);

function shouldUseUpstash(): boolean {
  return process.env.RATE_LIMIT_PROVIDER?.trim().toLowerCase() === "upstash";
}

export async function checkApplicationStatusLookup(
  ip: string,
): Promise<RateLimitResult> {
  if (shouldUseUpstash()) {
    if (!isUpstashRateLimitAvailable()) {
      return { allowed: false, retryAfterSeconds: 60 };
    }

    return consumeSharedRateLimit(`status:${ip}`, 10);
  }

  if (process.env.NODE_ENV === "production") {
    return { allowed: false, retryAfterSeconds: 60 };
  }

  return lookupLimiter.consume(ip);
}