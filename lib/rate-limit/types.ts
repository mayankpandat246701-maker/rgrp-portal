import "server-only";

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export interface RateLimiter {
  check(key: string): RateLimitResult;
  consume(key: string): RateLimitResult;
  recordFailure(key: string): void;
  clear(key: string): void;
}

export type SharedRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export function isRateLimitProviderAvailable(): boolean {
  const provider = process.env.RATE_LIMIT_PROVIDER?.trim().toLowerCase();

  if (provider === "upstash") {
    return Boolean(
      process.env.UPSTASH_REDIS_REST_URL?.trim() &&
        process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
    );
  }

  return process.env.NODE_ENV !== "production";
}

export function rateLimitProviderUnavailableResponse(): Response {
  return Response.json(
    {
      success: false,
      error: {
        message:
          "सेवा अस्थायी रूप से उपलब्ध नहीं है। कृपया थोड़ी देर बाद फिर प्रयास करें।",
      },
    },
    {
      status: 503,
      headers: {
        "Retry-After": "60",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}