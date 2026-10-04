import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  canManageEditorialContent,
  canPublishScopedContent,
  hasEditorialScope,
} from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { newsPostSchema } from "@/lib/news-validation";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

function invalidate(slug: string) {
  revalidatePath("/");
  revalidatePath("/samachar");
  revalidatePath(`/samachar/${slug}`);
  revalidatePath("/admin/samachar");
  revalidatePath("/admin/dashboard");
}

export async function GET(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("पहले प्रशासक के रूप में प्रवेश करें।", 401);
  if (!canManageEditorialContent(admin.role)) return errorResponse("आपको समाचार प्रबंधन की अनुमति नहीं है।", 403);
  const { id } = await context.params;
  try {
    const post = await prisma.newsPost.findUnique({
      where: { id },
      select: {
        id: true, slug: true, title: true, shortSummary: true, fullContent: true,
        category: true, tags: true, state: true, district: true, isPublished: true,
        isFeatured: true, homepageDisplayOrder: true, scheduledPublishAt: true,
        publishedAt: true, expiresAt: true, archivedAt: true, coverImageAltHindi: true,
      },
    });
    if (!post) return errorResponse("समाचार उपलब्ध नहीं है।", 404);
    if (!hasEditorialScope(admin, post.state, post.district)) {
      return errorResponse("आपको इस समाचार तक पहुँच की अनुमति नहीं है।", 403);
    }
    return NextResponse.json({ post }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("News read failed", { route: "/api/admin/samachar/[id]", code: "NEWS_READ_FAILED" });
    return errorResponse("समाचार लोड नहीं हो सका।", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("पहले प्रशासक के रूप में प्रवेश करें।", 401);
  if (!canManageEditorialContent(admin.role)) return errorResponse("आपको समाचार प्रबंधन की अनुमति नहीं है।", 403);
  const { id } = await context.params;
  let current;
  try {
    current = await prisma.newsPost.findUnique({
      where: { id },
      select: { id: true, slug: true, state: true, district: true, isPublished: true },
    });
  } catch {
    console.error("News update lookup failed", { route: "/api/admin/samachar/[id]", code: "NEWS_LOOKUP_FAILED" });
    return errorResponse("समाचार अपडेट नहीं हो सका।", 500);
  }
  if (!current) return errorResponse("समाचार उपलब्ध नहीं है।", 404);
  if (!hasEditorialScope(admin, current.state, current.district)) {
    return errorResponse("आपको इस समाचार तक पहुँच की अनुमति नहीं है।", 403);
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
  if (!hasEditorialScope(admin, input.state, input.district)) {
    return errorResponse("आपको इस क्षेत्र में समाचार प्रबंधित करने की अनुमति नहीं है।", 403);
  }
  if (
    (input.isPublished && !current.isPublished) ||
    (current.isPublished && input.isPublished && !canPublishScopedContent(admin, input.state, input.district))
  ) {
    return errorResponse("आप समाचार प्रकाशित या प्रकाशित अवस्था में अपडेट नहीं कर सकते।", 403);
  }

  const now = new Date();
  const publishNow = input.isPublished && !input.archivedAt &&
    (!input.scheduledPublishAt || input.scheduledPublishAt <= now);
  try {
    const post = await prisma.$transaction(async (tx) => {
      const updated = await tx.newsPost.update({
        where: { id },
        data: {
          ...input,
          tags: [...new Set(input.tags)],
          state: input.state || null,
          district: input.district || null,
          coverImageAltHindi: input.coverImageAltHindi || null,
          isPublished: input.isPublished && !input.archivedAt,
          publishedAt: publishNow ? (current.isPublished ? undefined : now) : undefined,
          archivedAt: input.archivedAt,
        },
        select: { id: true, slug: true, title: true, state: true, district: true, isPublished: true, isFeatured: true },
      });
      await tx.adminActivity.create({
        data: {
          adminId: admin.id,
          action: input.archivedAt ? "NEWS_ARCHIVED" : updated.isPublished ? "NEWS_UPDATED_OR_PUBLISHED" : "NEWS_UPDATED_OR_UNPUBLISHED",
          entity: "NewsPost",
          entityId: updated.id,
          metadata: {
            before: { state: current.state, district: current.district, isPublished: current.isPublished },
            after: { state: updated.state, district: updated.district, isPublished: updated.isPublished, isFeatured: updated.isFeatured },
          },
        },
      });
      return updated;
    });
    invalidate(current.slug);
    invalidate(post.slug);
    return NextResponse.json({ post }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorResponse("यह URL पहचान पहले से उपयोग में है।", 409);
    }
    console.error("News update failed", { route: "/api/admin/samachar/[id]", code: "NEWS_UPDATE_FAILED" });
    return errorResponse("समाचार अपडेट नहीं हो सका।", 500);
  }
}
