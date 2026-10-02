import "server-only";

type AttemptWindow = {
  attempts: number;
  expiresAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const MAX_UPLOAD_ATTEMPTS = 8;
const WINDOW_DURATION_MS = 15 * 60 * 1000;
const MAX_TRACKED_IPS = 10_000;
const uploadAttempts = new Map<string, AttemptWindow>();

export function checkDocumentUploadRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  for (const [trackedIp, window] of uploadAttempts) {
    if (window.expiresAt <= now) uploadAttempts.delete(trackedIp);
  }

  const window = uploadAttempts.get(ip);
  if (window && window.attempts >= MAX_UPLOAD_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((window.expiresAt - now) / 1000),
      ),
    };
  }

  if (window) {
    window.attempts += 1;
  } else {
    if (uploadAttempts.size >= MAX_TRACKED_IPS) {
      const oldestIp = uploadAttempts.keys().next().value;
      if (oldestIp !== undefined) uploadAttempts.delete(oldestIp);
    }
    uploadAttempts.set(ip, {
      attempts: 1,
      expiresAt: now + WINDOW_DURATION_MS,
    });
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
