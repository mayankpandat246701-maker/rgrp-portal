import "server-only";

import type { RateLimitResult, RateLimiter } from "@/lib/rate-limit/types";

type AttemptWindow = {
  attempts: number;
  expiresAt: number;
};

export class InMemoryRateLimiter implements RateLimiter {
  private readonly attempts = new Map<string, AttemptWindow>();

  constructor(
    private readonly maxAttempts: number,
    private readonly windowDurationMs: number,
    private readonly maxTrackedKeys = 10_000,
  ) {}

  check(key: string): RateLimitResult {
    const now = Date.now();
    this.removeExpired(now);
    const window = this.attempts.get(key);
    if (window && window.attempts >= this.maxAttempts) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((window.expiresAt - now) / 1000),
        ),
      };
    }
    return { allowed: true, retryAfterSeconds: 0 };
  }

  consume(key: string): RateLimitResult {
    const result = this.check(key);
    if (result.allowed) this.recordFailure(key);
    return result;
  }

  recordFailure(key: string): void {
    const now = Date.now();
    this.removeExpired(now);
    const window = this.attempts.get(key);
    if (window) {
      window.attempts += 1;
      return;
    }

    if (this.attempts.size >= this.maxTrackedKeys) {
      const oldestKey = this.attempts.keys().next().value;
      if (oldestKey !== undefined) this.attempts.delete(oldestKey);
    }
    this.attempts.set(key, {
      attempts: 1,
      expiresAt: now + this.windowDurationMs,
    });
  }

  clear(key: string): void {
    this.attempts.delete(key);
  }

  private removeExpired(now: number): void {
    for (const [key, window] of this.attempts) {
      if (window.expiresAt <= now) this.attempts.delete(key);
    }
  }
}
