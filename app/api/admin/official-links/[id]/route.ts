import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  canManageOfficialLink,
  canManageOfficialLinks,
} from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { officialLinkSchema } from "@/lib/official-link-validation";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

function errorResponse(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function invalidate() {
  revalidatePath("/official-links");
  revalidatePath("/admin/official-links");
  revalidatePath("/admin/dashboard");
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("पहले प्रशासक के रूप में प्रवेश करें।", 401);
  if (!canManageOfficialLinks(admin.role)) {
    return errorResponse("आपको आधिकारिक लिंक प्रबंधित करने की अनुमति नहीं है।", 403);
  }
  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("अनुरोध का प्रारूप मान्य नहीं है।", 400);
  }
  const parsed = officialLinkSchema.safeParse(body);
  if (!parsed.success) return errorResponse("आधिकारिक लिंक की जानकारी जाँचें।", 400);
  if (!canManageOfficialLink(admin, parsed.data.level, parsed.data.state, parsed.data.district)) {
    return errorResponse("आपको इस क्षेत्र का आधिकारिक लिंक प्रबंधित करने की अनुमति नहीं है।", 403);
  }
  try {
    const link = await prisma.$transaction(async (tx) => {
      const before = await tx.officialSocialLink.findUnique({
        where: { id },
        select: {
          level: true,
          platform: true,
          state: true,
          district: true,
          isPublic: true,
          isActive: true,
          visibility: true,
        },
      });
      if (
        !before ||
        !canManageOfficialLink(admin, before.level, before.state, before.district)
      ) return null;
      const updated = await tx.officialSocialLink.update({
        where: { id },
        data: parsed.data,
      });
      await tx.adminActivity.create({
        data: {
          adminId: admin.id,
          action: "OFFICIAL_LINK_UPDATED",
          entity: "OfficialSocialLink",
          entityId: updated.id,
          metadata: {
            before,
            after: {
              level: updated.level,
              platform: updated.platform,
              state: updated.state,
              district: updated.district,
              isPublic: updated.isPublic,
              isActive: updated.isActive,
              visibility: updated.visibility,
            },
          },
        },
      });
      return updated;
    });
    if (!link) return errorResponse("आधिकारिक लिंक उपलब्ध नहीं है।", 404);
    invalidate();
    return NextResponse.json({ link }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Official link update failed", {
      route: "/api/admin/official-links/[id]",
      code: "OFFICIAL_LINK_UPDATE_FAILED",
    });
    return errorResponse("आधिकारिक लिंक अपडेट नहीं किया जा सका।", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("पहले प्रशासक के रूप में प्रवेश करें।", 401);
  if (!canManageOfficialLinks(admin.role)) {
    return errorResponse("आपको आधिकारिक लिंक प्रबंधित करने की अनुमति नहीं है।", 403);
  }
  const { id } = await context.params;
  try {
    const link = await prisma.$transaction(async (tx) => {
      const before = await tx.officialSocialLink.findUnique({
        where: { id },
        select: { level: true, platform: true, state: true, district: true },
      });
      if (
        !before ||
        !canManageOfficialLink(admin, before.level, before.state, before.district)
      ) return null;
      const updated = await tx.officialSocialLink.update({
        where: { id },
        data: { isActive: false, isPublic: false, visibility: "HIDDEN" },
        select: { id: true, level: true, platform: true, state: true, district: true },
      });
      await tx.adminActivity.create({
        data: {
          adminId: admin.id,
          action: "OFFICIAL_LINK_ARCHIVED",
          entity: "OfficialSocialLink",
          entityId: updated.id,
          metadata: {
            before,
            after: {
              level: updated.level,
              platform: updated.platform,
              state: updated.state,
              district: updated.district,
              isActive: false,
              isPublic: false,
              visibility: "HIDDEN",
            },
          },
        },
      });
      return updated;
    });
    if (!link) return errorResponse("आधिकारिक लिंक उपलब्ध नहीं है।", 404);
    invalidate();
    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error("Official link archive failed", {
      route: "/api/admin/official-links/[id]",
      code: "OFFICIAL_LINK_ARCHIVE_FAILED",
    });
    return errorResponse("आधिकारिक लिंक छिपाया नहीं जा सका।", 500);
  }
}
