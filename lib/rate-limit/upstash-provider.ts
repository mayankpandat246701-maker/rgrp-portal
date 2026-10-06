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

const LOGIN_FAILURE_KEY_PREFIX = "rgrp";
const ADMIN_LOGIN_FAILURE_NAMESPACE = "admin-login";
const LOGIN_FAILURE_LIMIT = 5;
const LOGIN_FAILURE_WINDOW_SECONDS = 15 * 60;

/**
 * Builds the counter key for a namespace. The admin namespace keeps the exact
 * historical key (`rgrp:admin-login-failures:<subject>`) so existing admin
 * counters, limits and responses are unaffected by the namespace parameter.
 */
function loginFailureKey(namespace: string, subject: string): string {
  return `${LOGIN_FAILURE_KEY_PREFIX}:${namespace}-failures:${subject}`;
}

async function checkSharedFailures(
  namespace: string,
  subject: string,
  limit: number = LOGIN_FAILURE_LIMIT,
): Promise<SharedRateLimitResult> {
  const redis = getRedis();
  const key = loginFailureKey(namespace, subject);
  const attempts = await redis.get<number>(key);

  if (typeof attempts !== "number" || attempts < limit) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const ttl = await redis.ttl(key);
  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, ttl > 0 ? ttl : 1),
  };
}

async function recordSharedFailure(
  namespace: string,
  subject: string,
): Promise<void> {
  const redis = getRedis();
  const key = loginFailureKey(namespace, subject);
  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(key, LOGIN_FAILURE_WINDOW_SECONDS);
  }
}

async function clearSharedFailures(
  namespace: string,
  subject: string,
): Promise<void> {
  await getRedis().del(loginFailureKey(namespace, subject));
}

/**
 * Namespaced failure counters for panels other than the admin login. Only
 * FAILED attempts are counted, so a caller checks before verifying
 * credentials and records afterwards.
 *
 * `limit` defaults to the shared login-failure limit; a looser per-IP bucket
 * can be requested without affecting any other namespace.
 */
export async function checkLoginFailures(
  namespace: string,
  subject: string,
  limit?: number,
): Promise<SharedRateLimitResult> {
  return checkSharedFailures(namespace, subject, limit);
}

export async function recordLoginFailure(
  namespace: string,
  subject: string,
): Promise<void> {
  return recordSharedFailure(namespace, subject);
}

export async function clearLoginFailures(
  namespace: string,
  subject: string,
): Promise<void> {
  return clearSharedFailures(namespace, subject);
}

export async function checkSharedLoginFailures(
  ip: string,
): Promise<SharedRateLimitResult> {
  return checkSharedFailures(ADMIN_LOGIN_FAILURE_NAMESPACE, ip);
}

export async function recordSharedLoginFailure(ip: string): Promise<void> {
  return recordSharedFailure(ADMIN_LOGIN_FAILURE_NAMESPACE, ip);
}

export async function clearSharedLoginFailures(ip: string): Promise<void> {
  return clearSharedFailures(ADMIN_LOGIN_FAILURE_NAMESPACE, ip);
}
