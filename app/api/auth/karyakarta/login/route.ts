import { z } from "zod";
import { createKaryakartaSession } from "@/lib/auth/karyakarta-session";
import { isSameIndianMobile, normalizeIndianMobile } from "@/lib/karyakarta-mobile";
import { prisma } from "@/lib/prisma";
import {
  checkKaryakartaLoginRateLimit,
  clearKaryakartaLoginFailures,
  recordKaryakartaLoginFailure,
} from "@/lib/rate-limit/karyakarta-login";
import {
  isRateLimitProviderAvailable,
  rateLimitProviderUnavailableResponse,
} from "@/lib/rate-limit/types";

const loginSchema = z
  .object({
    regNo: z.string().trim().min(1).max(64),
    mobile: z.string().trim().min(1).max(24),
  })
  .strict();

const INVALID_CREDENTIALS_MESSAGE = "पंजीकरण संख्या या मोबाइल नंबर गलत है।";

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: { message: "अनुरोध अमान्य है।" } },
      { status: 400 },
    );
  }

  const result = loginSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { success: false, error: { message: "अनुरोध अमान्य है।" } },
      { status: 400 },
    );
  }

  const regNo = result.data.regNo.trim();
  const normalizedMobile = normalizeIndianMobile(result.data.mobile);
  if (!normalizedMobile) {
    return Response.json(
      { success: false, error: { message: "कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।" } },
      { status: 400 },
    );
  }

  const ip = getRequestIp(request);
  const rateLimit = await checkKaryakartaLoginRateLimit(ip, regNo);
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

  const karyakarta = await prisma.karyakarta.findUnique({
    where: { regNo },
    select: {
      id: true,
      regNo: true,
      phone: true,
      profileStatus: true,
      status: true,
      archivedAt: true,
    },
  });

  const credentialsMatch =
    karyakarta !== null &&
    karyakarta.profileStatus === "ACTIVE" &&
    karyakarta.status === "APPROVED" &&
    karyakarta.archivedAt === null &&
    isSameIndianMobile(normalizedMobile, karyakarta.phone);

  if (!credentialsMatch) {
    await recordKaryakartaLoginFailure(ip, regNo);
    return Response.json(
      {
        success: false,
        error: { message: INVALID_CREDENTIALS_MESSAGE },
      },
      { status: 401 },
    );
  }

  await clearKaryakartaLoginFailures(ip, regNo);
  await prisma.karyakarta.update({
    where: { id: karyakarta.id },
    data: { lastLoginAt: new Date() },
  });
  await createKaryakartaSession({ regNo: karyakarta.regNo });

  return Response.json({ success: true });
}
