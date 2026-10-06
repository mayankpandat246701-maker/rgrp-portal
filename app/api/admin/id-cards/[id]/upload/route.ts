import { AdminAuditAction } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  canManageKaryakarta,
  hasKaryakartaScope,
} from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isIdCardEligible } from "@/lib/id-card-eligibility";
import { isSakshamKaryakartaEligible } from "@/lib/saksham-karyakarta-eligibility";
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
      ? "à¤†à¤—à¥‡ à¤•à¥€ à¤›à¤µà¤¿ (front) à¤†à¤µà¤¶à¥à¤¯à¤• à¤¹à¥ˆà¥¤"
      : "à¤ªà¥€à¤›à¥‡ à¤•à¥€ à¤›à¤µà¤¿ à¤®à¤¾à¤¨à¥à¤¯ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤";
  }
  if (file.size > MAX_ID_CARD_SIZE) {
    return "à¤›à¤µà¤¿ à¤•à¤¾ à¤†à¤•à¤¾à¤° à¤…à¤¨à¥à¤®à¤¤ à¤¸à¥€à¤®à¤¾ (5 MB) à¤¸à¥‡ à¤…à¤§à¤¿à¤• à¤¹à¥ˆà¥¤";
  }
  const contents = Buffer.from(await file.arrayBuffer());
  const image = validateContentImage(file.type, contents);
  if (!image) return "à¤•à¥‡à¤µà¤² JPG, JPEG, PNG à¤”à¤° WEBP à¤›à¤µà¤¿à¤¯à¤¾à¤ à¤¸à¤®à¤°à¥à¤¥à¤¿à¤¤ à¤¹à¥ˆà¤‚à¥¤";
  const dimensions = getContentImageDimensions(contents);
  if (!dimensions) return "à¤šà¤¯à¤¨à¤¿à¤¤ à¤›à¤µà¤¿ à¤ªà¤¢à¤¼à¥€ à¤¨à¤¹à¥€à¤‚ à¤œà¤¾ à¤¸à¤•à¥€à¥¤";
  if (!isContentImageDimensionsAllowed(dimensions)) {
    return "à¤›à¤µà¤¿ à¤•à¤¾ à¤°à¤¿à¤œà¤¼à¥‰à¤²à¥à¤¯à¥‚à¤¶à¤¨ à¤…à¤¨à¥à¤®à¤¤ à¤¸à¥€à¤®à¤¾ à¤¸à¥‡ à¤…à¤§à¤¿à¤• à¤¹à¥ˆà¥¤";
  }
  return { contents, extension: image.extension };
}

export async function POST(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return jsonError("à¤ªà¤¹à¤²à¥‡ à¤ªà¥à¤°à¤¶à¤¾à¤¸à¤• à¤•à¥‡ à¤°à¥‚à¤ª à¤®à¥‡à¤‚ à¤ªà¥à¤°à¤µà¥‡à¤¶ à¤•à¤°à¥‡à¤‚à¥¤", 401);
  if (!canManageKaryakarta(admin.role)) {
    return jsonError("à¤†à¤ªà¤•à¥‹ à¤ªà¤¹à¤šà¤¾à¤¨ à¤ªà¤¤à¥à¤° à¤…à¤ªà¤²à¥‹à¤¡ à¤•à¤°à¤¨à¥‡ à¤•à¥€ à¤…à¤¨à¥à¤®à¤¤à¤¿ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤", 403);
  }

  if (!isIdCardRateLimitAvailable()) {
    return NextResponse.json(
      { success: false, error: { message: "à¤¸à¥‡à¤µà¤¾ à¤…à¤­à¥€ à¤‰à¤ªà¤²à¤¬à¥à¤§ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤" } },
      { status: 503, headers: { "Retry-After": "60", "Cache-Control": "no-store" } },
    );
  }
  const limit = await checkIdCardLimit(`upload:${admin.id}:${requestIp(request)}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: { message: "à¤¬à¤¹à¥à¤¤ à¤…à¤§à¤¿à¤• à¤ªà¥à¤°à¤¯à¤¾à¤¸ à¤•à¤¿à¤ à¤—à¤à¥¤" } },
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
    return jsonError("à¤•à¤¾à¤°à¥à¤¯à¤•à¤°à¥à¤¤à¤¾ à¤‰à¤ªà¤²à¤¬à¥à¤§ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤", 404);
  }

  const member = await prisma.karyakarta.findUnique({
    where: { id },
    select: {
      id: true,
      state: true,
      district: true,
      profileStatus: true,
      status: true,
      isPublicProfile: true,
      isEmergencyHidden: true,
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
  if (!member) return jsonError("à¤•à¤¾à¤°à¥à¤¯à¤•à¤°à¥à¤¤à¤¾ à¤‰à¤ªà¤²à¤¬à¥à¤§ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤", 404);
  if (!hasKaryakartaScope(admin, member.state, member.district)) {
    return jsonError("à¤†à¤ªà¤•à¥‹ à¤‡à¤¸ à¤•à¤¾à¤°à¥à¤¯à¤•à¤°à¥à¤¤à¤¾ à¤¤à¤• à¤ªà¤¹à¥à¤à¤š à¤•à¥€ à¤…à¤¨à¥à¤®à¤¤à¤¿ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤", 403);
  }

  const registration = member.registrations[0] ?? null;
  if (
    !registration ||
    !isIdCardEligible({
      profileStatus: member.profileStatus,
      archivedAt: member.archivedAt,
      registrationStatus: registration.status,
      registrationExpiryDate: registration.expiryDate,
    }) ||
    !isSakshamKaryakartaEligible({
      profileStatus: member.profileStatus,
      memberStatus: member.status,
      isPublicProfile: member.isPublicProfile,
      isEmergencyHidden: member.isEmergencyHidden,
      archivedAt: member.archivedAt,
      registrationStatus: registration.status,
      registrationExpiryDate: registration.expiryDate,
    })
  ) {
    return jsonError("à¤¯à¤¹ à¤•à¤¾à¤°à¥à¤¯à¤•à¤°à¥à¤¤à¤¾ à¤ªà¤¹à¤šà¤¾à¤¨ à¤ªà¤¤à¥à¤° à¤•à¥‡ à¤²à¤¿à¤ à¤ªà¤¾à¤¤à¥à¤° à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤", 409);
  }

  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return jsonError("à¤à¤• à¤µà¥ˆà¤§ à¤›à¤µà¤¿ à¤«à¤¼à¤¾à¤‡à¤² à¤†à¤µà¤¶à¥à¤¯à¤• à¤¹à¥ˆà¥¤", 400);
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
    return jsonError("à¤ªà¤¹à¤šà¤¾à¤¨ à¤ªà¤¤à¥à¤° à¤…à¤ªà¤²à¥‹à¤¡ à¤¨à¤¹à¥€à¤‚ à¤¹à¥‹ à¤¸à¤•à¤¾à¥¤", 500);
  }
}


