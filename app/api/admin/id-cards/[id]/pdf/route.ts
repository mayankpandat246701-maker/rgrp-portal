import { AdminAuditAction } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  canManageKaryakarta,
  hasKaryakartaScope,
} from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isIdCardEligible } from "@/lib/id-card-eligibility";
import { createIdCardPdf } from "@/lib/id-card-pdf";
import { prisma } from "@/lib/prisma";
import { readEncryptedPrivateFile } from "@/lib/private-uploads";
import {
  checkIdCardLimit,
  isIdCardRateLimitAvailable,
} from "@/lib/rate-limit/id-cards";

type RouteContext = { params: Promise<{ id: string }> };

const querySchema = z.object({
  disposition: z.enum(["inline", "attachment"]).default("inline"),
});

function requestIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim().slice(0, 64) || "unknown";
}

function errorResponse(error: string, status: number) {
  return NextResponse.json(
    { success: false, error: { message: error } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) {
    return errorResponse("पहले प्रशासक के रूप में प्रवेश करें।", 401);
  }
  if (!canManageKaryakarta(admin.role)) {
    return errorResponse("आपको पहचान पत्र डाउनलोड करने की अनुमति नहीं है।", 403);
  }

  if (!isIdCardRateLimitAvailable()) {
    return NextResponse.json(
      { success: false, error: { message: "सेवा अभी उपलब्ध नहीं है। कृपया कुछ देर बाद फिर प्रयास करें।" } },
      { status: 503, headers: { "Retry-After": "60", "Cache-Control": "no-store" } },
    );
  }
  const limit = await checkIdCardLimit(`pdf:${admin.id}:${requestIp(request)}`);
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

  const { id } = await context.params;
  if (!/^[a-z0-9]+$/i.test(id)) {
    return errorResponse("कार्यकर्ता उपलब्ध नहीं है।", 404);
  }
  const query = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  const disposition = query.success ? query.data.disposition : "inline";

  try {
    const member = await prisma.karyakarta.findUnique({
      where: { id },
      select: {
        id: true,
        regNo: true,
        name: true,
        daitva: true,
        state: true,
        district: true,
        profileStatus: true,
        archivedAt: true,
        profilePhotoPath: true,
        registrations: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            registrationNumber: true,
            status: true,
            issueDate: true,
            expiryDate: true,
          },
        },
      },
    });
    if (!member) return errorResponse("कार्यकर्ता उपलब्ध नहीं है।", 404);
    if (!hasKaryakartaScope(admin, member.state, member.district)) {
      return errorResponse("आपको इस पहचान पत्र तक पहुँच की अनुमति नहीं है।", 403);
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
    if (!eligible || !registration) {
      return errorResponse("यह पहचान पत्र वर्तमान में बनाने योग्य नहीं है।", 409);
    }

    let photo: Buffer | null = null;
    if (member.profilePhotoPath) {
      try {
        photo = await readEncryptedPrivateFile(member.profilePhotoPath);
      } catch {
        photo = null;
      }
    }

    const pdf = await createIdCardPdf({
      name: member.name,
      daitva: member.daitva,
      state: member.state,
      district: member.district,
      registrationNumber: registration.registrationNumber,
      issueDate: registration.issueDate,
      expiryDate: registration.expiryDate,
      photo,
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: AdminAuditAction.ID_CARD_DOWNLOADED,
        karyakartaId: member.id,
      },
    });

    const filename = `id-card-${registration.registrationNumber}.pdf`;
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    console.error("Admin id-card pdf failed", {
      route: "/api/admin/id-cards/[id]/pdf",
      code: "ADMIN_ID_CARD_PDF_FAILED",
    });
    return errorResponse("पहचान पत्र तैयार नहीं हो सका।", 500);
  }
}
