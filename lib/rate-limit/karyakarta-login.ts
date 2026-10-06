import "server-only";

import { createHash } from "node:crypto";
import { InMemoryRateLimiter } from "@/lib/rate-limit/in-memory-provider";
import {
  checkLoginFailures,
  clearLoginFailures,
  isUpstashRateLimitAvailable,
  recordLoginFailure,
} from "@/lib/rate-limit/upstash-provider";
import type { RateLimitResult } from "@/lib/rate-limit/types";

/**
 * Two independent buckets guard the karyakarta login. Both count FAILED
 * attempts only, so the caller checks before verifying credentials and
 * records afterwards.
 *
 * - Per account (`regNo`): tight, because one account is the thing an
 *   attacker actually wants. This is the bucket that stops credential
 *   grinding against a single registration number.
 * - Per client IP: equally tight. A single host spraying many accounts is
 *   the distributed-guessing pattern this bucket exists to blunt.
 */
const IDENTITY_FAILURE_LIMIT = 5;
const IP_FAILURE_LIMIT = 5;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const UNAVAILABLE_RETRY_AFTER_SECONDS = 60;

const IP_NAMESPACE = "karyakarta-login";
const IDENTITY_NAMESPACE = "karyakarta-login-identity";

const ipLimiter = new InMemoryRateLimiter(IP_FAILURE_LIMIT, FAILURE_WINDOW_MS);
const identityLimiter = new InMemoryRateLimiter(
  IDENTITY_FAILURE_LIMIT,
  FAILURE_WINDOW_MS,
);

function shouldUseUpstash(): boolean {
  return process.env.RATE_LIMIT_PROVIDER?.trim().toLowerCase() === "upstash";
}

/**
 * Production without a working shared limiter must fail closed, exactly as the
 * admin login and document upload do, rather than silently allow unlimited
 * credential guessing.
 */
function unavailableResult(): RateLimitResult {
  return {
    allowed: false,
    retryAfterSeconds: UNAVAILABLE_RETRY_AFTER_SECONDS,
  };
}

/**
 * The registration number is the account identifier, so it is hashed before it
 * can reach a shared key store. Uppercasing first keeps `rgrp-2026-001` and
 * `RGRP-2026-001` in the same bucket instead of granting an attacker a fresh
 * allowance per letter case.
 */
function identityBucketKey(identity: string): string {
  return createHash("sha256")
    .update(identity.trim().toUpperCase())
    .digest("hex");
}

export async function checkKaryakartaLoginRateLimit(
  ip: string,
  identity: string,
): Promise<RateLimitResult> {
  if (shouldUseUpstash()) {
    if (!isUpstashRateLimitAvailable()) {
      return unavailableResult();
    }

    const ipResult = await checkLoginFailures(IP_NAMESPACE, ip, IP_FAILURE_LIMIT);
    if (!ipResult.allowed) return ipResult;

    return checkLoginFailures(IDENTITY_NAMESPACE, identityBucketKey(identity));
  }

  if (process.env.NODE_ENV === "production") {
    return unavailableResult();
  }

  const ipResult = ipLimiter.check(ip);
  if (!ipResult.allowed) return ipResult;

  return identityLimiter.check(identityBucketKey(identity));
}

export async function recordKaryakartaLoginFailure(
  ip: string,
  identity: string,
): Promise<void> {
  if (shouldUseUpstash()) {
    if (isUpstashRateLimitAvailable()) {
      await recordLoginFailure(IP_NAMESPACE, ip);
      await recordLoginFailure(IDENTITY_NAMESPACE, identityBucketKey(identity));
    }
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    ipLimiter.recordFailure(ip);
    identityLimiter.recordFailure(identityBucketKey(identity));
  }
}

/**
 * Clears ONLY the per-account (regNo) failure bucket after a successful
 * login. The per-IP bucket is deliberately left untouched: a host that has
 * been spraying many accounts must not earn a clean slate for every other
 * account just because one login succeeded.
 */
export async function clearKaryakartaLoginFailures(
  ip: string,
  identity: string,
): Promise<void> {
  void ip;
  if (shouldUseUpstash()) {
    if (isUpstashRateLimitAvailable()) {
      await clearLoginFailures(IDENTITY_NAMESPACE, identityBucketKey(identity));
    }
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    identityLimiter.clear(identityBucketKey(identity));
  }
}
