import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { SharedRateLimitResult } from "@/lib/rate-limit/types";

type Window = "15 m";

function getUpstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    return null;
  }

  return { url, token };
}

function getRedis(): Redis {
  const config = getUpstashConfig();

  if (!config) {
    throw new Error("Shared rate limiting is not configured.");
  }

  return new Redis({
    url: config.url,
    token: config.token,
  });
}

function createSlidingWindowLimiter(
  limit: number,
  window: Window = "15 m",
): Ratelimit {
  return new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix: "rgrp-rate-limit",
    analytics: false,
  });
}

function toResult(result: {
  success: boolean;
  reset: number;
}): SharedRateLimitResult {
  return {
    allowed: result.success,
    retryAfterSeconds: result.success
      ? 0
      : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
  };
}

export function isUpstashRateLimitAvailable(): boolean {
  return getUpstashConfig() !== null;
}

export async function consumeSharedRateLimit(
  key: string,
  limit: number,
  window: Window = "15 m",
): Promise<SharedRateLimitResult> {
  const limiter = createSlidingWindowLimiter(limit, window);
  return toResult(await limiter.limit(key));
}

function loginFailureKey(ip: string): string {
  return `rgrp:admin-login-failures:${ip}`;
}

export async function checkSharedLoginFailures(
  ip: string,
): Promise<SharedRateLimitResult> {
  const redis = getRedis();
  const key = loginFailureKey(ip);
  const attempts = await redis.get<number>(key);

  if (typeof attempts !== "number" || attempts < 5) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const ttl = await redis.ttl(key);
  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, ttl > 0 ? ttl : 1),
  };
}

export async function recordSharedLoginFailure(ip: string): Promise<void> {
  const redis = getRedis();
  const key = loginFailureKey(ip);
  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(key, 15 * 60);
  }
}

export async function clearSharedLoginFailures(ip: string): Promise<void> {
  await getRedis().del(loginFailureKey(ip));
}