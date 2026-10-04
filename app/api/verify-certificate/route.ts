import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import {
  checkCertificateVerificationLimit,
  isCertificateVerificationRateLimitAvailable,
} from "@/lib/rate-limit/certificate-verification";
import { isCertificateRegistrationEligible } from "@/lib/joining-certificate";
import { prisma } from "@/lib/prisma";

const notFound = {
  result: "not_found",
  message:
    "इस प्रमाणपत्र संख्या के लिए कोई सक्रिय सत्यापित रिकॉर्ड उपलब्ध नहीं है। कृपया राष्ट्रीय गौ रक्षा परिषद के आधिकारिक प्रशासन से संपर्क करें।",
};

function requestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 64) || "unknown";
}

export async function GET(request: Request) {
  const certificateNumber = new URL(request.url).searchParams
    .get("number")
    ?.trim()
    .toUpperCase() ?? "";
  if (!/^RGRP-CERT-\d{4}-[A-F0-9]{8}$/.test(certificateNumber)) {
    return NextResponse.json(
      { error: "कृपया मान्य प्रमाणपत्र संख्या दर्ज करें।" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!isCertificateVerificationRateLimitAvailable()) {
    return NextResponse.json(
      { error: "सत्यापन सेवा अभी उपलब्ध नहीं है। कृपया कुछ देर बाद फिर प्रयास करें।" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  let limit;
  try {
    limit = await checkCertificateVerificationLimit(requestIp(request));
  } catch {
    console.error("Certificate verification rate limit failed", {
      route: "/api/verify-certificate",
      code: "CERTIFICATE_RATE_LIMIT_FAILED",
    });
    return NextResponse.json(
      { error: "सत्यापन सेवा अभी उपलब्ध नहीं है। कृपया कुछ देर बाद फिर प्रयास करें।" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
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

  const certificateHash = createHash("sha256")
    .update(certificateNumber, "utf8")
    .digest("hex");
  try {
    const matches = await prisma.joiningCertificate.findMany({
      where: { certificateNumber: { equals: certificateNumber, mode: "insensitive" } },
      take: 2,
      select: {
        status: true,
        issueDate: true,
        certificateNumber: true,
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
        registrationCard: {
          select: {
            status: true,
            registrationNumber: true,
            expiryDate: true,
          },
        },
      },
    });
    const certificate = matches.length === 1 ? matches[0] : null;
    const member = certificate?.karyakarta;
    const registration = certificate?.registrationCard;
    const publicMember =
      member?.profileStatus === "ACTIVE" &&
      member.isPublicProfile &&
      !member.isEmergencyHidden &&
      member.archivedAt === null;
    let response: Record<string, unknown> = notFound;
    if (
      certificate?.status === "ACTIVE" &&
      member &&
      registration &&
      publicMember &&
      isCertificateRegistrationEligible({
        profileStatus: member.profileStatus,
        certificateStatus: certificate.status,
        registrationStatus: registration.status,
        registrationExpiryDate: registration.expiryDate,
      })
    ) {
      response = {
        result: "verified",
        certificate: {
          certificateNumber: certificate.certificateNumber,
          name: member.name,
          registrationNumber: registration.registrationNumber,
          daitva: member.daitva,
          state: member.state,
          district: member.district,
          issueDate: certificate.issueDate.toISOString(),
          expiryDate: registration.expiryDate?.toISOString() ?? null,
        },
      };
    } else if (
      certificate?.status === "ACTIVE" &&
      publicMember &&
      registration &&
      (registration.status === "EXPIRED" ||
        Boolean(
          registration.expiryDate &&
            registration.expiryDate <= new Date(),
        ))
    ) {
      response = {
        result: "expired",
        message: "यह पंजीकरण रिकॉर्ड उपलब्ध है, लेकिन वर्तमान में इसकी वैधता समाप्त हो चुकी है।",
      };
    } else if (
      certificate?.status === "ACTIVE" &&
      publicMember &&
      ["SUSPENDED", "REVOKED"].includes(registration?.status ?? "")
    ) {
      response = {
        result: "not_valid",
        message:
          "यह प्रमाणपत्र वर्तमान में सक्रिय संगठनात्मक प्रतिनिधित्व के लिए मान्य नहीं है। कृपया आधिकारिक प्रशासन से संपर्क करें।",
      };
    }

    await prisma.certificateVerificationLog.create({
      data: { certificateHash, resultType: response.result as string },
    });
    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch {
    console.error("Certificate verification failed", {
      route: "/api/verify-certificate",
      code: "CERTIFICATE_VERIFICATION_FAILED",
    });
    return NextResponse.json(
      { error: "सत्यापन सेवा अभी उपलब्ध नहीं है। कृपया कुछ देर बाद फिर प्रयास करें।" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
