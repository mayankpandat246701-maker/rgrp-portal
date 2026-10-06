import { AdminAuditAction } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  canManageKaryakarta,
  hasKaryakartaScope,
} from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isIdCardEligible } from "@/lib/id-card-eligibility";
import { prisma } from "@/lib/prisma";
import {
  createStorageKey,
  deletePrivateFile,
  saveEncryptedPrivateFile,
} from "@/lib/private-uploads";
import {
  checkIdCardLimit,
  isIdCardRateLimitAvailable,
} from "@/lib/rate-limit/id-cards";
import {
  getContentImageDimensions,
  isContentImageDimensionsAllowed,
  validateContentImage,
} from "@/lib/content-image";

type RouteContext = { params: Promise<{ id: string }> };

const MAX_ID_CARD_SIZE = 5 * 1024 * 1024;

function requestIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim().slice(0, 64) || "unknown";
}

function jsonError(error: string, status: number) {
  return NextResponse.json(
    { success: false, error: { message: error } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

async function validateSide(
  file: unknown,
  label: string,
): Promise<{ contents: Buffer; extension: "jpg" | "png" | "webp" } | string> {
  if (!(file instanceof File) || file.size < 1) {
    return label === "front"
      ? "आगे की छवि (front) आवश्यक है।"
      : "पीछे की छवि मान्य नहीं है।";
  }
  if (file.size > MAX_ID_CARD_SIZE) {
    return "छवि का आकार अनुमत सीमा (5 MB) से अधिक है।";
  }
  const contents = Buffer.from(await file.arrayBuffer());
  const image = validateContentImage(file.type, contents);
  if (!image) return "केवल JPG, JPEG, PNG और WEBP छवियाँ समर्थित हैं।";
  const dimensions = getContentImageDimensions(contents);
  if (!dimensions) return "चयनित छवि पढ़ी नहीं जा सकी।";
  if (!isContentImageDimensionsAllowed(dimensions)) {
    return "छवि का रिज़ॉल्यूशन अनुमत सीमा से अधिक है।";
  }
  return { contents, extension: image.extension };
}

export async function POST(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return jsonError("पहले प्रशासक के रूप में प्रवेश करें।", 401);
  if (!canManageKaryakarta(admin.role)) {
    return jsonError("आपको पहचान पत्र अपलोड करने की अनुमति नहीं है।", 403);
  }

  if (!isIdCardRateLimitAvailable()) {
    return NextResponse.json(
      { success: false, error: { message: "सेवा अभी उपलब्ध नहीं है।" } },
      { status: 503, headers: { "Retry-After": "60", "Cache-Control": "no-store" } },
    );
  }
  const limit = await checkIdCardLimit(`upload:${admin.id}:${requestIp(request)}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: { message: "बहुत अधिक प्रयास किए गए।" } },
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
    return jsonError("कार्यकर्ता उपलब्ध नहीं है।", 404);
  }

  const member = await prisma.karyakarta.findUnique({
    where: { id },
    select: {
      id: true,
      state: true,
      district: true,
      profileStatus: true,
      archivedAt: true,
      idCardFrontPath: true,
      idCardBackPath: true,
      registrations: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, expiryDate: true },
      },
    },
  });
  if (!member) return jsonError("कार्यकर्ता उपलब्ध नहीं है।", 404);
  if (!hasKaryakartaScope(admin, member.state, member.district)) {
    return jsonError("आपको इस कार्यकर्ता तक पहुँच की अनुमति नहीं है।", 403);
  }

  const registration = member.registrations[0] ?? null;
  if (
    !registration ||
    !isIdCardEligible({
      profileStatus: member.profileStatus,
      archivedAt: member.archivedAt,
      registrationStatus: registration.status,
      registrationExpiryDate: registration.expiryDate,
    })
  ) {
    return jsonError("यह कार्यकर्ता पहचान पत्र के लिए पात्र नहीं है।", 409);
  }

  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return jsonError("एक वैध छवि फ़ाइल आवश्यक है।", 400);
  }
  const front = await validateSide(data.get("front"), "front");
  if (typeof front === "string") return jsonError(front, 400);
  const backRaw = data.get("back");
  const back =
    backRaw instanceof File && backRaw.size > 0
      ? await validateSide(backRaw, "back")
      : null;
  if (typeof back === "string") return jsonError(back, 400);

  const frontKey = createStorageKey("id-cards", front.extension, true);
  const backKey = back ? createStorageKey("id-cards", back.extension, true) : null;
  try {
    await saveEncryptedPrivateFile(frontKey, front.contents);
    if (back && backKey) {
      await saveEncryptedPrivateFile(backKey, back.contents);
    }
    await prisma.$transaction(async (tx) => {
      await tx.karyakarta.update({
        where: { id },
        data: {
          idCardFrontPath: frontKey,
          ...(backKey ? { idCardBackPath: backKey } : {}),
          updatedById: admin.id,
        },
      });
      await tx.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: AdminAuditAction.ID_CARD_GENERATED,
          karyakartaId: id,
        },
      });
    });

    if (member.idCardFrontPath) {
      await deletePrivateFile(member.idCardFrontPath).catch(() => undefined);
    }
    if (backKey && member.idCardBackPath) {
      await deletePrivateFile(member.idCardBackPath).catch(() => undefined);
    }

    return NextResponse.json(
      { success: true, data: { front: true, back: Boolean(backKey) } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    await deletePrivateFile(frontKey).catch(() => undefined);
    if (backKey) await deletePrivateFile(backKey).catch(() => undefined);
    console.error("Admin id-card upload failed", {
      route: "/api/admin/id-cards/[id]/upload",
      code: "ADMIN_ID_CARD_UPLOAD_FAILED",
    });
    return jsonError("पहचान पत्र अपलोड नहीं हो सका।", 500);
  }
}
