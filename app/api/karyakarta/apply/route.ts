import { randomInt } from "node:crypto";
import { KaryakartaApplicationStatus, Prisma } from "@prisma/client";
import { karyakartaApplicationSchema } from "@/lib/schemas/karyakarta-application";
import { prisma } from "@/lib/prisma";
import {
  checkJoinApplicationRateLimit,
  isJoinApplicationRateLimitAvailable,
} from "@/lib/rate-limit/join-application";
import type { RateLimitResult } from "@/lib/rate-limit/types";

const MAX_REQUEST_SIZE = 32 * 1024;
const INVALID_APPLICATION_MESSAGE = "कृपया सभी आवश्यक जानकारी सही भरें।";
const REFERENCE_ERROR_MESSAGE =
  "आवेदन संदर्भ बनाने में समस्या हुई। कृपया फिर प्रयास करें।";
const SERVICE_UNAVAILABLE_MESSAGE =
  "सेवा अस्थायी रूप से उपलब्ध नहीं है। कृपया थोड़ी देर बाद फिर प्रयास करें।";
const APPLICATION_ERROR_MESSAGE =
  "आवेदन जमा नहीं हो सका। कृपया बाद में फिर प्रयास करें।";
const MAX_REFERENCE_ATTEMPTS = 5;
const UNAVAILABLE_PRISMA_CODES = new Set([
  "P1001",
  "P1002",
  "P1008",
  "P1017",
  "P2024",
  "P2037",
]);

function requestIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 64) || "unknown";
}

function createApplicationReference(): string {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const randomNumber = randomInt(10_000, 100_000);
  return `RGRP-${date}-${randomNumber}`;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_SIZE) {
    return Response.json(
      { success: false, error: { message: INVALID_APPLICATION_MESSAGE } },
      { status: 400 },
    );
  }
  if (!isJoinApplicationRateLimitAvailable()) {
    return Response.json(
      { success: false, error: { message: SERVICE_UNAVAILABLE_MESSAGE } },
      { status: 503, headers: { "Retry-After": "60", "Cache-Control": "no-store" } },
    );
  }
  let rateLimit: RateLimitResult;
  try {
    rateLimit = await checkJoinApplicationRateLimit(requestIp(request));
  } catch {
    console.error(JSON.stringify({
      event: "karyakarta_application_rate_limit_failed",
      route: "/api/karyakarta/apply",
      code: "KARYAKARTA_APPLICATION_RATE_LIMIT_FAILED",
    }));
    return Response.json(
      { success: false, error: { message: SERVICE_UNAVAILABLE_MESSAGE } },
      { status: 503, headers: { "Retry-After": "60", "Cache-Control": "no-store" } },
    );
  }
  if (!rateLimit.allowed) {
    return Response.json(
      { success: false, error: { message: "बहुत अधिक आवेदन प्रयास हुए हैं। कृपया कुछ देर बाद फिर प्रयास करें।" } },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (rawBody.length > MAX_REQUEST_SIZE) {
      return Response.json(
        { success: false, error: { message: INVALID_APPLICATION_MESSAGE } },
        { status: 400 },
      );
    }
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return Response.json(
      { success: false, error: { message: INVALID_APPLICATION_MESSAGE } },
      { status: 400 },
    );
  }

  const parsed = karyakartaApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { success: false, error: { message: INVALID_APPLICATION_MESSAGE } },
      { status: 400 },
    );
  }

  if (parsed.data.website.trim()) {
    return Response.json(
      { success: false, error: { message: INVALID_APPLICATION_MESSAGE } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const application = { ...parsed.data };
  Reflect.deleteProperty(application, "consent");
  Reflect.deleteProperty(application, "website");
  const dateOfBirth = new Date(`${application.dateOfBirth}T00:00:00.000Z`);

  for (let attempt = 0; attempt < MAX_REFERENCE_ATTEMPTS; attempt += 1) {
    try {
      const savedApplication = await prisma.karyakartaApplication.create({
        data: {
          ...application,
          dateOfBirth,
          status: KaryakartaApplicationStatus.PENDING,
          applicationReference: createApplicationReference(),
        },
        select: {
          applicationReference: true,
          fullName: true,
          status: true,
        },
      });

      return Response.json(
        {
          success: true,
          data: savedApplication,
        },
        {
          status: 201,
          headers: { "Cache-Control": "no-store" },
        },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        attempt < MAX_REFERENCE_ATTEMPTS - 1
      ) {
        continue;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const code = /^[A-Z]\d{4}$/.test(error.code) ? error.code : undefined;
        const event = {
          event: "karyakarta_application_create_failed",
          category:
            code === "P2002" ? "reference_collision" : "prisma_known_request",
          ...(code ? { prismaCode: code } : {}),
        };
        console.error(JSON.stringify(event));

        if (code === "P2002") {
          return Response.json(
            { success: false, error: { message: REFERENCE_ERROR_MESSAGE } },
            { status: 409, headers: { "Cache-Control": "no-store" } },
          );
        }

        if (code && UNAVAILABLE_PRISMA_CODES.has(code)) {
          return Response.json(
            {
              success: false,
              error: { message: SERVICE_UNAVAILABLE_MESSAGE },
            },
            { status: 503, headers: { "Cache-Control": "no-store" } },
          );
        }

        return Response.json(
          { success: false, error: { message: APPLICATION_ERROR_MESSAGE } },
          { status: 500, headers: { "Cache-Control": "no-store" } },
        );
      }

      const category =
        error instanceof Prisma.PrismaClientValidationError
          ? "prisma_validation"
          : error instanceof Prisma.PrismaClientInitializationError
            ? "prisma_initialization"
            : error instanceof Prisma.PrismaClientUnknownRequestError
              ? "prisma_unknown_request"
              : error instanceof Prisma.PrismaClientRustPanicError
                ? "prisma_engine_panic"
                : "non_prisma_error";
      const initializationCode =
        error instanceof Prisma.PrismaClientInitializationError &&
        typeof error.errorCode === "string" &&
        /^[A-Z]\d{4}$/.test(error.errorCode)
          ? error.errorCode
          : undefined;
      console.error(
        JSON.stringify({
          event: "karyakarta_application_create_failed",
          category,
          ...(initializationCode ? { prismaCode: initializationCode } : {}),
        }),
      );

      if (
        initializationCode &&
        UNAVAILABLE_PRISMA_CODES.has(initializationCode)
      ) {
        return Response.json(
          { success: false, error: { message: SERVICE_UNAVAILABLE_MESSAGE } },
          { status: 503, headers: { "Cache-Control": "no-store" } },
        );
      }

      return Response.json(
        { success: false, error: { message: APPLICATION_ERROR_MESSAGE } },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  console.error(
    JSON.stringify({
      event: "karyakarta_application_create_failed",
      category: "reference_collision",
      prismaCode: "P2002",
    }),
  );
  return Response.json(
    { success: false, error: { message: REFERENCE_ERROR_MESSAGE } },
    { status: 409, headers: { "Cache-Control": "no-store" } },
  );
}
