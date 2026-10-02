import "server-only";

type AttemptWindow = {
  count: number;
  expiresAt: number;
};

type LookupLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const MAX_LOOKUPS = 10;
const WINDOW_DURATION_MS = 15 * 60 * 1000;
const MAX_TRACKED_IPS = 10_000;
const attemptsByIp = new Map<string, AttemptWindow>();

function removeExpiredWindows(now: number): void {
  for (const [ip, window] of attemptsByIp) {
    if (window.expiresAt <= now) attemptsByIp.delete(ip);
  }
}

export function checkApplicationStatusLookup(
  ip: string,
): LookupLimitResult {
  const now = Date.now();
  removeExpiredWindows(now);

  const window = attemptsByIp.get(ip);
  if (window && window.count >= MAX_LOOKUPS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((window.expiresAt - now) / 1000),
      ),
    };
  }

  if (window) {
    window.count += 1;
  } else {
    if (attemptsByIp.size >= MAX_TRACKED_IPS) {
      const oldestIp = attemptsByIp.keys().next().value;
      if (oldestIp !== undefined) attemptsByIp.delete(oldestIp);
    }
    attemptsByIp.set(ip, {
      count: 1,
      expiresAt: now + WINDOW_DURATION_MS,
    });
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
