import "server-only";

import { createHash } from "node:crypto";
import { InMemoryRateLimiter } from "@/lib/rate-limit/in-memory-provider";
import {
  consumeSharedRateLimit,
  isUpstashRateLimitAvailable,
} from "@/lib/rate-limit/upstash-provider";
import type { RateLimitResult } from "@/lib/rate-limit/types";

const localLimiter = new InMemoryRateLimiter(20, 15 * 60 * 1000);

export function isIdCardRateLimitAvailable(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    (process.env.RATE_LIMIT_PROVIDER?.trim().toLowerCase() === "upstash" &&
      isUpstashRateLimitAvailable())
  );
}

export async function checkIdCardLimit(
  clientKey: string,
): Promise<RateLimitResult> {
  if (process.env.RATE_LIMIT_PROVIDER?.trim().toLowerCase() === "upstash") {
    if (!isUpstashRateLimitAvailable()) {
      return { allowed: false, retryAfterSeconds: 60 };
    }
    const clientHash = createHash("sha256").update(clientKey).digest("hex");
    return consumeSharedRateLimit(`id-cards:${clientHash}`, 20);
  }
  if (process.env.NODE_ENV === "production") {
    return { allowed: false, retryAfterSeconds: 60 };
  }
  return localLimiter.consume(clientKey);
}
