import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  canManageEditorialContent,
  canPublishScopedContent,
  hasEditorialScope,
} from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { groundActivitySchema } from "@/lib/ground-activity-validation";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };
function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}
function invalidate(slug: string) {
  revalidatePath("/");
  revalidatePath("/hamare-karya");
  revalidatePath(`/hamare-karya/${slug}`);
  revalidatePath("/admin/hamare-karya");
  revalidatePath("/admin/dashboard");
}

export async function GET(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("पहले प्रशासक के रूप में प्रवेश करें।", 401);
  if (!canManageEditorialContent(admin.role)) return errorResponse("आपको मैदानी कार्य प्रबंधन की अनुमति नहीं है।", 403);
  const { id } = await context.params;
  try {
    const activity = await prisma.groundActivity.findUnique({
      where: { id },
      select: {
        id: true, slug: true, title: true, shortSummary: true, fullDescription: true,
        activityType: true, activityDate: true, state: true, district: true,
        tehsilOrBlock: true, cityOrVillage: true, publicLocationLabel: true,
        exactLocationPublic: true, mapLink: true, isPublished: true,
        isFeaturedOnHomepage: true, homepageDisplayOrder: true,
        scheduledPublishAt: true, expiresAt: true, archivedAt: true,
        coverImageAltHindi: true,
        images: { orderBy: [{ displayOrder: "asc" }], select: { id: true, altTextHindi: true, displayOrder: true, isPublic: true } },
      },
    });
    if (!activity) return errorResponse("कार्य उपलब्ध नहीं है।", 404);
    if (!hasEditorialScope(admin, activity.state, activity.district)) return errorResponse("आपको इस कार्य तक पहुँच की अनुमति नहीं है।", 403);
    return NextResponse.json({ activity }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Ground activity read failed", { route: "/api/admin/hamare-karya/[id]", code: "GROUND_ACTIVITY_READ_FAILED" });
    return errorResponse("कार्य लोड नहीं हो सका।", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("पहले प्रशासक के रूप में प्रवेश करें।", 401);
  if (!canManageEditorialContent(admin.role)) return errorResponse("आपको मैदानी कार्य प्रबंधन की अनुमति नहीं है।", 403);
  const { id } = await context.params;
  let current;
  try {
    current = await prisma.groundActivity.findUnique({
      where: { id },
      select: { id: true, slug: true, state: true, district: true, isPublished: true },
    });
  } catch {
    console.error("Ground activity update lookup failed", { route: "/api/admin/hamare-karya/[id]", code: "GROUND_ACTIVITY_LOOKUP_FAILED" });
    return errorResponse("कार्य अपडेट नहीं हो सका।", 500);
  }
  if (!current) return errorResponse("कार्य उपलब्ध नहीं है।", 404);
  if (!hasEditorialScope(admin, current.state, current.district)) return errorResponse("आपको इस कार्य तक पहुँच की अनुमति नहीं है।", 403);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("कार्य विवरण सही प्रारूप में भेजें।", 400);
  }
  const parsed = groundActivitySchema.safeParse(body);
  if (!parsed.success) return errorResponse("कार्य विवरण जाँचें।", 400);
  const input = parsed.data;
  if (!hasEditorialScope(admin, input.state, input.district)) return errorResponse("आपको इस क्षेत्र में कार्य प्रबंधित करने की अनुमति नहीं है।", 403);
  if (
    (input.isPublished && !current.isPublished) ||
    (current.isPublished && input.isPublished && !canPublishScopedContent(admin, input.state, input.district))
  ) return errorResponse("आप कार्य प्रकाशित या प्रकाशित अवस्था में अपडेट नहीं कर सकते।", 403);
  const publishNow = input.isPublished && !input.archivedAt && (!input.scheduledPublishAt || input.scheduledPublishAt <= new Date());
  try {
    const activity = await prisma.$transaction(async (tx) => {
      const updated = await tx.groundActivity.update({
        where: { id },
        data: {
          ...input,
          tehsilOrBlock: input.tehsilOrBlock || null,
          cityOrVillage: input.cityOrVillage || null,
          publicLocationLabel: input.publicLocationLabel || null,
          mapLink: input.mapLink || null,
          coverImageAltHindi: input.coverImageAltHindi || null,
          isPublished: input.isPublished && !input.archivedAt,
          publishedAt: publishNow ? (current.isPublished ? undefined : new Date()) : undefined,
        },
        select: { id: true, slug: true, title: true, state: true, district: true, isPublished: true, isFeaturedOnHomepage: true },
      });
      await tx.adminActivity.create({
        data: {
          adminId: admin.id,
          action: input.archivedAt ? "GROUND_ACTIVITY_ARCHIVED" : "GROUND_ACTIVITY_UPDATED_OR_PUBLISHED",
          entity: "GroundActivity",
          entityId: id,
          metadata: {
            before: { state: current.state, district: current.district, isPublished: current.isPublished },
            after: { state: updated.state, district: updated.district, isPublished: updated.isPublished, isFeaturedOnHomepage: updated.isFeaturedOnHomepage },
          },
        },
      });
      return updated;
    });
    invalidate(current.slug);
    invalidate(activity.slug);
    return NextResponse.json({ activity }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return errorResponse("यह URL पहचान पहले से उपयोग में है।", 409);
    console.error("Ground activity update failed", { route: "/api/admin/hamare-karya/[id]", code: "GROUND_ACTIVITY_UPDATE_FAILED" });
    return errorResponse("कार्य अपडेट नहीं हो सका।", 500);
  }
}
