import "server-only";

type LoginAttemptWindow = {
  attempts: number;
  expiresAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_DURATION_MS = 15 * 60 * 1000;
const MAX_TRACKED_IPS = 10_000;
const loginAttempts = new Map<string, LoginAttemptWindow>();

function removeExpiredAttempts(now: number): void {
  for (const [ip, attemptWindow] of loginAttempts) {
    if (attemptWindow.expiresAt <= now) {
      loginAttempts.delete(ip);
    }
  }
}

export function checkAdminLoginRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  removeExpiredAttempts(now);

  const attemptWindow = loginAttempts.get(ip);
  if (!attemptWindow || attemptWindow.attempts < MAX_FAILED_ATTEMPTS) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return {
    allowed: false,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((attemptWindow.expiresAt - now) / 1000),
    ),
  };
}

export function recordAdminLoginFailure(ip: string): void {
  const now = Date.now();
  removeExpiredAttempts(now);

  const attemptWindow = loginAttempts.get(ip);
  if (attemptWindow) {
    attemptWindow.attempts += 1;
    return;
  }

  if (loginAttempts.size >= MAX_TRACKED_IPS) {
    const oldestIp = loginAttempts.keys().next().value;
    if (oldestIp !== undefined) loginAttempts.delete(oldestIp);
  }

  loginAttempts.set(ip, {
    attempts: 1,
    expiresAt: now + WINDOW_DURATION_MS,
  });
}

export function clearAdminLoginFailures(ip: string): void {
  loginAttempts.delete(ip);
}
