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
import { newsPostSchema } from "@/lib/news-validation";
import { prisma } from "@/lib/prisma";

const pageSize = 30;

function errorResponse(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function invalidate(slug?: string) {
  revalidatePath("/");
  revalidatePath("/samachar");
  if (slug) revalidatePath(`/samachar/${slug}`);
  revalidatePath("/admin/samachar");
  revalidatePath("/admin/dashboard");
}

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("पहले प्रशासक के रूप में प्रवेश करें।", 401);
  if (!canManageEditorialContent(admin.role)) {
    return errorResponse("आपको समाचार प्रबंधन की अनुमति नहीं है।", 403);
  }

  const params = new URL(request.url).searchParams;
  const pageValue = Number(params.get("page") ?? 1);
  const page = Number.isSafeInteger(pageValue)
    ? Math.max(1, Math.min(10_000, pageValue))
    : 1;
  const search = params.get("q")?.trim().slice(0, 120);
  const state = params.get("state")?.trim().slice(0, 120);
  const where: Prisma.NewsPostWhereInput = {
    AND: [
      karyakartaScopeWhere(admin),
      ...(state ? [{ state }] : []),
      ...(search
        ? [{
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { shortSummary: { contains: search, mode: "insensitive" as const } },
              { slug: { contains: search, mode: "insensitive" as const } },
            ],
          }]
        : []),
    ],
  };

  try {
    const [posts, total] = await prisma.$transaction([
      prisma.newsPost.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }],
        select: {
          id: true,
          slug: true,
          title: true,
          category: true,
          state: true,
          district: true,
          isPublished: true,
          isFeatured: true,
          scheduledPublishAt: true,
          publishedAt: true,
          archivedAt: true,
          updatedAt: true,
        },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      prisma.newsPost.count({ where }),
    ]);
    return NextResponse.json(
      { posts, total, page, pageSize },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error("News list failed", {
      route: "/api/admin/samachar",
      code: "NEWS_LIST_FAILED",
    });
    return errorResponse("समाचार सूची लोड नहीं हो सकी।", 500);
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("पहले प्रशासक के रूप में प्रवेश करें।", 401);
  if (!canManageEditorialContent(admin.role)) {
    return errorResponse("आपको समाचार प्रबंधन की अनुमति नहीं है।", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("समाचार विवरण सही प्रारूप में भेजें।", 400);
  }
  const parsed = newsPostSchema.safeParse(body);
  if (!parsed.success) return errorResponse("समाचार विवरण जाँचें।", 400);
  const input = parsed.data;
  const slug = input.slug?.trim() || createSlug(input.title);
  if (!hasEditorialScope(admin, input.state, input.district)) {
    return errorResponse("आपको इस क्षेत्र में समाचार प्रबंधित करने की अनुमति नहीं है।", 403);
  }
  if (
    input.isPublished &&
    !canPublishScopedContent(admin, input.state, input.district)
  ) {
    return errorResponse("आप समाचार प्रकाशित नहीं कर सकते।", 403);
  }

  function createSlug(title: string): string {
  const base = title
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "samachar";

  return `${base}-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

const now = new Date();
  const scheduledForLater = Boolean(input.scheduledPublishAt && input.scheduledPublishAt > now);
  const archivedAt = input.archivedAt;
  try {
    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.newsPost.create({
        data: {
          ...input,
          slug,
          tags: [...new Set(input.tags)],
          state: input.state || null,
          district: input.district || null,
          coverImageAltHindi: input.coverImageAltHindi || null,
          isPublished: input.isPublished && !archivedAt,
          publishedAt: input.isPublished && !scheduledForLater && !archivedAt ? now : null,
          archivedAt,
          authorId: admin.id,
        },
        select: { id: true, slug: true },
      });
      await tx.adminActivity.create({
        data: {
          adminId: admin.id,
          action: "NEWS_CREATED",
          entity: "NewsPost",
          entityId: created.id,
          metadata: {
            state: input.state || null,
            district: input.district || null,
            isPublished: input.isPublished && !archivedAt,
            isFeatured: input.isFeatured,
          },
        },
      });
      return tx.newsPost.findUniqueOrThrow({
        where: { id: created.id },
        select: {
          id: true,
          slug: true,
          title: true,
          category: true,
          isPublished: true,
          isFeatured: true,
          state: true,
          district: true,
        },
      });
    });
    invalidate(post.slug);
    return NextResponse.json({ post }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorResponse("यह URL पहचान पहले से उपयोग में है।", 409);
    }
    console.error("News creation failed", {
      route: "/api/admin/samachar",
      code: "NEWS_CREATE_FAILED",
    });
    return errorResponse("समाचार सहेजा नहीं जा सका।", 500);
  }
}
