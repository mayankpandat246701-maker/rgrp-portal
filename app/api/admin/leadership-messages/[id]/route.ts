import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  canManageLeadership,
  canPublishContent,
} from "@/lib/auth/admin-permissions";
import { leadershipMessageSchema } from "@/lib/leadership-message-validation";
import { deletePublicImageByUrl } from "@/lib/storage/vercel-blob-public-images";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function errorResponse(error: string, status: number): Response {
  return Response.json(
    { success: false, error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("अनधिकृत अनुरोध।", 401);
  if (!canManageLeadership(admin.role)) {
    return errorResponse("इस कार्रवाई की अनुमति नहीं है।", 403);
  }

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("कृपया सभी विवरण सही भरें।", 400);
  }

  const parsed = leadershipMessageSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("कृपया सभी विवरण सही भरें।", 400);
  }
  if (!canPublishContent(admin.role)) {
    const current = await prisma.leadershipMessage.findUnique({
      where: { id },
      select: { id: true, isPublished: true },
    });
    if (!current) return errorResponse("संदेश नहीं मिला।", 404);
    if (current.isPublished !== parsed.data.isPublished) {
      return errorResponse("प्रकाशित स्थिति बदलने की अनुमति नहीं है।", 403);
    }
  }
  if (
    parsed.data.isPublished &&
    parsed.data.showOnHomepage &&
    (await prisma.leadershipMessage.count({
      where: {
        isPublished: true,
        showOnHomepage: true,
        id: { not: id },
      },
    })) >= 12
  ) {
    return errorResponse("होमपेज पर अधिकतम 12 मुख्य व्यक्ति चुने जा सकते हैं।", 409);
  }

  try {
    const updated = await prisma.$transaction(async (transaction) => {
      const before = await transaction.leadershipMessage.findUnique({
        where: { id },
        select: {
          isPublished: true,
          showOnHomepage: true,
          displayOrder: true,
          state: true,
          district: true,
        },
      });
      if (!before) return null;
      const result = await transaction.leadershipMessage.updateMany({
        where: { id },
        data: parsed.data,
      });
      if (result.count === 0) return null;

      await transaction.adminActivity.create({
        data: {
          adminId: admin.id,
          action: "LEADERSHIP_MESSAGE_UPDATED",
          entity: "LeadershipMessage",
          entityId: id,
          metadata: {
            before,
            after: {
              isPublished: parsed.data.isPublished,
              showOnHomepage: parsed.data.showOnHomepage,
              displayOrder: parsed.data.displayOrder,
              state: parsed.data.state,
              district: parsed.data.district,
            },
          },
        },
      });
      return transaction.leadershipMessage.findUnique({ where: { id } });
    });

    if (!updated) return errorResponse("संदेश नहीं मिला।", 404);
    revalidatePath("/");
    revalidatePath("/saksham-karyakarta");
    return Response.json(
      { success: true, data: updated },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error(
      JSON.stringify({
        event: "leadership_message_update_failed",
        route: "/api/admin/leadership-messages/[id]",
        code: "LEADERSHIP_MESSAGE_UPDATE_FAILED",
      }),
    );
    return errorResponse("संदेश अपडेट नहीं किया जा सका।", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("अनधिकृत अनुरोध।", 401);
  if (!canManageLeadership(admin.role)) {
    return errorResponse("इस कार्रवाई की अनुमति नहीं है।", 403);
  }

  const { id } = await context.params;

  try {
    const deleted = await prisma.$transaction(async (transaction) => {
      const current = await transaction.leadershipMessage.findUnique({
        where: { id },
        select: { id: true, isPublished: true, portraitUrl: true },
      });
      if (!current) return { status: "missing" as const, portraitUrl: null };
      if (!canPublishContent(admin.role) && current.isPublished) {
        return { status: "forbidden" as const, portraitUrl: null };
      }
      const result = await transaction.leadershipMessage.deleteMany({
        where: { id },
      });
      if (result.count === 0) {
        return { status: "missing" as const, portraitUrl: null };
      }

      await transaction.adminActivity.create({
        data: {
          adminId: admin.id,
          action: "LEADERSHIP_MESSAGE_DELETED",
          entity: "LeadershipMessage",
          entityId: id,
        },
      });
      return { status: "deleted" as const, portraitUrl: current.portraitUrl };
    });

    if (deleted.status === "missing") return errorResponse("संदेश नहीं मिला।", 404);
    if (deleted.status === "forbidden") {
      return errorResponse("प्रकाशित संदेश हटाने की अनुमति नहीं है।", 403);
    }
    if (deleted.portraitUrl) {
      const removed = await deletePublicImageByUrl(deleted.portraitUrl);
      if (!removed) {
        console.error(
          JSON.stringify({
            event: "leadership_portrait_cleanup_failed",
            route: "/api/admin/leadership-messages/[id]",
            code: "LEADERSHIP_PORTRAIT_CLEANUP_FAILED",
          }),
        );
      }
    }
    revalidatePath("/");
    revalidatePath("/saksham-karyakarta");
    return Response.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error(
      JSON.stringify({
        event: "leadership_message_delete_failed",
        route: "/api/admin/leadership-messages/[id]",
        code: "LEADERSHIP_MESSAGE_DELETE_FAILED",
      }),
    );
    return errorResponse("संदेश हटाया नहीं जा सका।", 500);
  }
}
