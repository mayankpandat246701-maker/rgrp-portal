import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  canManageEditorialContent,
  canPublishScopedContent,
  hasEditorialScope,
  karyakartaScopeWhere,
} from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { groundActivitySchema } from "@/lib/ground-activity-validation";
import { prisma } from "@/lib/prisma";

const pageSize = 30;

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

function invalidate(slug?: string) {
  revalidatePath("/");
  revalidatePath("/hamare-karya");
  if (slug) revalidatePath(`/hamare-karya/${slug}`);
  revalidatePath("/admin/hamare-karya");
  revalidatePath("/admin/dashboard");
}

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("पहले प्रशासक के रूप में प्रवेश करें।", 401);
  if (!canManageEditorialContent(admin.role)) return errorResponse("आपको मैदानी कार्य प्रबंधन की अनुमति नहीं है।", 403);
  const params = new URL(request.url).searchParams;
  const requestedPage = Number(params.get("page") ?? 1);
  const page = Number.isSafeInteger(requestedPage) ? Math.max(1, Math.min(10_000, requestedPage)) : 1;
  const search = params.get("q")?.trim().slice(0, 120);
  const where: Prisma.GroundActivityWhereInput = {
    AND: [
      karyakartaScopeWhere(admin),
      ...(search ? [{ OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { shortSummary: { contains: search, mode: "insensitive" as const } },
        { state: { contains: search, mode: "insensitive" as const } },
        { district: { contains: search, mode: "insensitive" as const } },
        { slug: { contains: search, mode: "insensitive" as const } },
      ] }] : []),
    ],
  };
  try {
    const [activities, total] = await prisma.$transaction([
      prisma.groundActivity.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }],
        take: pageSize,
        skip: (page - 1) * pageSize,
        select: {
          id: true, slug: true, title: true, activityType: true, state: true,
          district: true, isPublished: true, isFeaturedOnHomepage: true,
          archivedAt: true, updatedAt: true,
        },
      }),
      prisma.groundActivity.count({ where }),
    ]);
    return NextResponse.json({ activities, total, page, pageSize }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Ground activity list failed", { route: "/api/admin/hamare-karya", code: "GROUND_ACTIVITY_LIST_FAILED" });
    return errorResponse("कार्य सूची लोड नहीं हो सकी।", 500);
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("पहले प्रशासक के रूप में प्रवेश करें।", 401);
  if (!canManageEditorialContent(admin.role)) return errorResponse("आपको मैदानी कार्य प्रबंधन की अनुमति नहीं है।", 403);
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
  if (input.isPublished && !canPublishScopedContent(admin, input.state, input.district)) return errorResponse("आप कार्य प्रकाशित नहीं कर सकते।", 403);
  const now = new Date();
  const scheduledForLater = Boolean(input.scheduledPublishAt && input.scheduledPublishAt > now);
  try {
    const activity = await prisma.$transaction(async (tx) => {
      const created = await tx.groundActivity.create({
        data: {
          ...input,
          tehsilOrBlock: input.tehsilOrBlock || null,
          cityOrVillage: input.cityOrVillage || null,
          publicLocationLabel: input.publicLocationLabel || null,
          mapLink: input.mapLink || null,
          coverImageAltHindi: input.coverImageAltHindi || null,
          isPublished: input.isPublished && !input.archivedAt,
          publishedAt: input.isPublished && !scheduledForLater && !input.archivedAt ? now : null,
          authorId: admin.id,
        },
        select: { id: true, slug: true },
      });
      await tx.adminActivity.create({
        data: {
          adminId: admin.id,
          action: "GROUND_ACTIVITY_CREATED",
          entity: "GroundActivity",
          entityId: created.id,
          metadata: { state: input.state, district: input.district, isPublished: input.isPublished && !input.archivedAt },
        },
      });
      return tx.groundActivity.findUniqueOrThrow({
        where: { id: created.id },
        select: { id: true, slug: true, title: true, state: true, district: true, isPublished: true, isFeaturedOnHomepage: true },
      });
    });
    invalidate(activity.slug);
    return NextResponse.json({ activity }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return errorResponse("यह URL पहचान पहले से उपयोग में है।", 409);
    console.error("Ground activity creation failed", { route: "/api/admin/hamare-karya", code: "GROUND_ACTIVITY_CREATE_FAILED" });
    return errorResponse("कार्य सहेजा नहीं जा सका।", 500);
  }
}
