import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAdminSession } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";
import {
  checkAdminLoginRateLimit,
  clearAdminLoginFailures,
  recordAdminLoginFailure,
} from "@/lib/rate-limit/admin-login";
import {
  isRateLimitProviderAvailable,
  rateLimitProviderUnavailableResponse,
} from "@/lib/rate-limit/types";

const loginSchema = z
  .object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(1024),
  })
  .strict();

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";

function getRequestIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const forwardedIp = forwardedFor?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  return forwardedIp || realIp || "unknown";
}

export async function POST(request: Request) {
  if (!isRateLimitProviderAvailable()) {
    return rateLimitProviderUnavailableResponse();
  }

  const ip = getRequestIp(request);
 const rateLimit = await checkAdminLoginRateLimit(ip);
  if (!rateLimit.allowed) {
    return Response.json(
      {
        success: false,
        error: {
          message: "बहुत अधिक प्रयास किए गए। कृपया कुछ देर बाद फिर प्रयास करें।",
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: { message: "Invalid request." } },
      { status: 400 },
    );
  }

  const result = loginSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { success: false, error: { message: "Invalid request." } },
      { status: 400 },
    );
  }

  const email = result.data.email.toLowerCase();
  const admin = await prisma.admin.findFirst({
    where: { email, isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      role: true,
    },
  });

  const passwordMatches = admin
    ? await bcrypt.compare(result.data.password, admin.passwordHash)
    : false;

  if (!admin || !passwordMatches) {
    await recordAdminLoginFailure(ip);
    return Response.json(
      {
        success: false,
        error: { message: INVALID_CREDENTIALS_MESSAGE },
      },
      { status: 401 },
    );
  }

  await clearAdminLoginFailures(ip);
  await createAdminSession({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  });

  return Response.json({ success: true });
}
