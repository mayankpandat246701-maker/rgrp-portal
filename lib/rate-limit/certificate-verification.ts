import "server-only";

import { createHash } from "node:crypto";
import { InMemoryRateLimiter } from "@/lib/rate-limit/in-memory-provider";
import {
  consumeSharedRateLimit,
  isUpstashRateLimitAvailable,
} from "@/lib/rate-limit/upstash-provider";
import type { RateLimitResult } from "@/lib/rate-limit/types";

const limiter = new InMemoryRateLimiter(10, 15 * 60 * 1000);

export function isCertificateVerificationRateLimitAvailable(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    (process.env.RATE_LIMIT_PROVIDER?.trim().toLowerCase() === "upstash" &&
      isUpstashRateLimitAvailable())
  );
}

export async function checkCertificateVerificationLimit(
  clientKey: string,
): Promise<RateLimitResult> {
  if (process.env.RATE_LIMIT_PROVIDER?.trim().toLowerCase() === "upstash") {
    if (!isUpstashRateLimitAvailable()) {
      return { allowed: false, retryAfterSeconds: 60 };
    }
    const clientHash = createHash("sha256").update(clientKey).digest("hex");
    return consumeSharedRateLimit(`verify-certificate:${clientHash}`, 10);
  }
  if (process.env.NODE_ENV === "production") {
    return { allowed: false, retryAfterSeconds: 60 };
  }
  return limiter.consume(clientKey);
}
