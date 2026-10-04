import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { checkRegistrationVerificationLimit, isRegistrationVerificationRateLimitAvailable } from "@/lib/rate-limit/registration-verification";
import { resolveRegistrationVerificationStatus } from "@/lib/registration-verification";
import { prisma } from "@/lib/prisma";

function requestIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim().slice(0, 64) || "unknown";
}

const unknownResult = {
  result: "not_found",
  message:
    "इस पंजीकरण संख्या के लिए कोई सक्रिय सत्यापित रिकॉर्ड उपलब्ध नहीं है। कृपया इस कार्ड पर भरोसा करने से पहले राष्ट्रीय गौ रक्षा परिषद के आधिकारिक प्रशासन से संपर्क करें।",
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "कृपया मान्य पंजीकरण संख्या दर्ज करें।" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const registrationNumber =
    typeof body === "object" &&
    body !== null &&
    "registrationNumber" in body &&
    typeof body.registrationNumber === "string"
      ? body.registrationNumber.trim().toUpperCase()
      : "";
  if (
    registrationNumber.length < 12 ||
    registrationNumber.length > 60 ||
    !/^RGRP-[A-Z0-9-]+$/.test(registrationNumber)
  ) {
    return NextResponse.json(
      { error: "कृपया मान्य पंजीकरण संख्या दर्ज करें।" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!isRegistrationVerificationRateLimitAvailable()) {
    return NextResponse.json(
      { error: "सत्यापन अभी उपलब्ध नहीं है। कृपया कुछ देर बाद फिर प्रयास करें।" },
      { status: 503, headers: { "Retry-After": "60", "Cache-Control": "no-store" } },
    );
  }
  let limit: Awaited<ReturnType<typeof checkRegistrationVerificationLimit>>;
  try {
    limit = await checkRegistrationVerificationLimit(requestIp(request));
  } catch {
    console.error("Registration verification rate limit failed", {
      route: "/api/verify-id",
      code: "REGISTRATION_RATE_LIMIT_FAILED",
    });
    return NextResponse.json(
      { error: "सत्यापन अभी उपलब्ध नहीं है। कृपया कुछ देर बाद फिर प्रयास करें।" },
      { status: 503, headers: { "Retry-After": "60", "Cache-Control": "no-store" } },
    );
  }
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "बहुत अधिक सत्यापन प्रयास हुए हैं। कृपया कुछ देर बाद फिर प्रयास करें।" },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSeconds),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const registrationHash = createHash("sha256")
    .update(registrationNumber, "utf8")
    .digest("hex");
  try {
    const matches = await prisma.registrationCard.findMany({
      where: {
        registrationNumber: { equals: registrationNumber, mode: "insensitive" },
      },
      take: 2,
      select: {
        status: true,
        issueDate: true,
        expiryDate: true,
        registrationNumber: true,
        karyakarta: {
          select: {
            name: true,
            daitva: true,
            state: true,
            district: true,
            profileStatus: true,
            isPublicProfile: true,
            isEmergencyHidden: true,
            archivedAt: true,
          },
        },
      },
    });
    const registration = matches.length === 1 ? matches[0] : null;

    const member = registration?.karyakarta;
    const verificationStatus = resolveRegistrationVerificationStatus({
      registrationStatus: registration?.status ?? null,
      profileStatus: member?.profileStatus ?? null,
      isPublicProfile: member?.isPublicProfile ?? false,
      isEmergencyHidden: member?.isEmergencyHidden ?? false,
      archivedAt: member?.archivedAt ?? null,
      expiryDate: registration?.expiryDate ?? null,
    });
    const resultType = verificationStatus;
    let response: Record<string, unknown> = unknownResult;

    if (verificationStatus === "EXPIRED") {
      response = {
        result: "expired",
        message: "यह पंजीकरण रिकॉर्ड उपलब्ध है, लेकिन वर्तमान में इसकी वैधता समाप्त हो चुकी है।",
      };
    } else if (
      verificationStatus === "SUSPENDED" ||
      verificationStatus === "REVOKED"
    ) {
      response = {
        result: "not_valid",
        message:
          "यह पंजीकरण वर्तमान में सक्रिय संगठनात्मक प्रतिनिधित्व के लिए मान्य नहीं है। कृपया आधिकारिक प्रशासन से संपर्क करें।",
      };
    } else if (
      verificationStatus === "ACTIVE" &&
      registration?.status === "ACTIVE" &&
      member
    ) {
      response = {
        result: "verified",
        member: {
          name: member.name,
          registrationNumber: registration.registrationNumber,
          daitva: member.daitva,
          state: member.state,
          district: member.district,
          issueDate: registration.issueDate?.toISOString() ?? null,
          expiryDate: registration.expiryDate?.toISOString() ?? null,
        },
      };
    }

    await prisma.registrationVerificationLog.create({
      data: { registrationHash, resultType },
    });
    return NextResponse.json(response, {
      headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
    });
  } catch {
    console.error("Registration verification failed", {
      route: "/api/verify-id",
      code: "REGISTRATION_VERIFICATION_FAILED",
    });
    return NextResponse.json(
      { error: "सत्यापन अभी उपलब्ध नहीं है। कृपया कुछ देर बाद फिर प्रयास करें।" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
