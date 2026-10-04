import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkApplicationStatusLookup } from "@/lib/rate-limit/application-status";
import {
  isRateLimitProviderAvailable,
  rateLimitProviderUnavailableResponse,
} from "@/lib/rate-limit/types";

const lookupSchema = z
  .object({
    applicationReference: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^RGRP-\d{8}-\d{5}$/),
    mobile: z.preprocess(
      (value) => {
        if (typeof value !== "string") return value;
        let digits = value.trim().replace(/\D/g, "");
        if (digits.length === 12 && digits.startsWith("91")) {
          digits = digits.slice(2);
        }
        return digits;
      },
      z.string().regex(/^[6-9]\d{9}$/),
    ),
  })
  .strict();

const NOT_FOUND_RESPONSE = {
  success: false,
  error: {
    message: "आवेदन विवरण सत्यापित नहीं हो सके। कृपया जानकारी जाँचें।",
  },
};

function getRequestIp(request: Request): string {
  const forwardedIp = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  return (
    forwardedIp ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function POST(request: Request) {
  if (!isRateLimitProviderAvailable()) {
    return rateLimitProviderUnavailableResponse();
  }

  const rateLimit = await checkApplicationStatusLookup(getRequestIp(request));
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
      { success: false, error: { message: "कृपया संदर्भ संख्या और मोबाइल दर्ज करें।" } },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      },
    );
  }

  const parsed = lookupSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { success: false, error: { message: "कृपया संदर्भ संख्या और मोबाइल दर्ज करें।" } },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      },
    );
  }

  const application = await prisma.karyakartaApplication.findFirst({
    where: {
      applicationReference: parsed.data.applicationReference,
      mobile: parsed.data.mobile,
    },
    select: {
      applicationReference: true,
      fullName: true,
      status: true,
      createdAt: true,
    },
  });

  if (!application) {
    return Response.json(NOT_FOUND_RESPONSE, {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  return Response.json(
    { success: true, data: application },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
