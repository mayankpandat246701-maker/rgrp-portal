import { AdminAuditAction } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  canManageKaryakarta,
  hasKaryakartaScope,
} from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isIdCardEligible } from "@/lib/id-card-eligibility";
import { isSameIndianMobile } from "@/lib/karyakarta-mobile";
import { prisma } from "@/lib/prisma";
import {
  checkIdCardLimit,
  isIdCardRateLimitAvailable,
} from "@/lib/rate-limit/id-cards";

const searchSchema = z
  .object({
    regNo: z.string().trim().min(1).max(64),
    mobile: z.string().trim().min(1).max(24),
  })
  .strict();

function requestIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim().slice(0, 64) || "unknown";
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: { message: "पहले प्रशासक के रूप में प्रवेश करें।" } },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!canManageKaryakarta(admin.role)) {
    return NextResponse.json(
      { success: false, error: { message: "आपको पहचान पत्र बनाने की अनुमति नहीं है।" } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!isIdCardRateLimitAvailable()) {
    return NextResponse.json(
      { success: false, error: { message: "सेवा अभी उपलब्ध नहीं है। कृपया कुछ देर बाद फिर प्रयास करें।" } },
      { status: 503, headers: { "Retry-After": "60", "Cache-Control": "no-store" } },
    );
  }
  const limit = await checkIdCardLimit(`search:${admin.id}:${requestIp(request)}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: { message: "बहुत अधिक प्रयास किए गए। कृपया कुछ देर बाद फिर प्रयास करें।" } },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSeconds),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: "अनुरोध अमान्य है।" } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const parsed = searchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { message: "अनुरोध अमान्य है।" } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const regNo = parsed.data.regNo.trim();
  const member = await prisma.karyakarta.findUnique({
    where: { regNo },
    select: {
      id: true,
      regNo: true,
      name: true,
      daitva: true,
      state: true,
      district: true,
      phone: true,
      profileStatus: true,
      archivedAt: true,
      idCardFrontPath: true,
      idCardBackPath: true,
      registrations: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          registrationNumber: true,
          status: true,
          issueDate: true,
          expiryDate: true,
        },
      },
    },
  });

  if (!member || !isSameIndianMobile(parsed.data.mobile, member.phone)) {
    return NextResponse.json(
      { success: false, error: { message: "पंजीकरण संख्या या मोबाइल नंबर गलत है।" } },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!hasKaryakartaScope(admin, member.state, member.district)) {
    return NextResponse.json(
      { success: false, error: { message: "आपको इस कार्यकर्ता तक पहुँच की अनुमति नहीं है।" } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const registration = member.registrations[0] ?? null;
  const eligible = Boolean(
    registration &&
      isIdCardEligible({
        profileStatus: member.profileStatus,
        archivedAt: member.archivedAt,
        registrationStatus: registration.status,
        registrationExpiryDate: registration.expiryDate,
      }),
  );

  await prisma.adminAuditLog.create({
    data: {
      adminId: admin.id,
      action: AdminAuditAction.ID_CARD_GENERATED,
      karyakartaId: member.id,
    },
  });

  return NextResponse.json(
    {
      success: true,
      data: {
        id: member.id,
        name: member.name,
        regNo: member.regNo,
        daitva: member.daitva,
        state: member.state,
        district: member.district,
        registrationNumber: registration?.registrationNumber ?? member.regNo,
        issueDate: registration?.issueDate?.toISOString() ?? null,
        expiryDate: registration?.expiryDate?.toISOString() ?? null,
        hasFrontImage: member.idCardFrontPath !== null,
        hasBackImage: member.idCardBackPath !== null,
        eligible,
        eligibilityMessage: eligible
          ? "पहचान पत्र के लिए पात्र है।"
          : "पहचान पत्र के लिए अपात्र है। सक्रिय प्रोफ़ाइल और वैध पंजीकरण आवश्यक है।",
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
