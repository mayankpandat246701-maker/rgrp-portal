import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { leadershipMessageSchema } from "@/lib/leadership-message-validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function hasManagementRole(role: string): boolean {
  return role === "SUPER_ADMIN" || role === "CONTENT_ADMIN";
}

function errorResponse(error: string, status: number): Response {
  return Response.json(
    { success: false, error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("अनधिकृत अनुरोध।", 401);
  if (!hasManagementRole(admin.role)) {
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

  try {
    const updated = await prisma.$transaction(async (transaction) => {
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
        },
      });
      return transaction.leadershipMessage.findUnique({ where: { id } });
    });

    if (!updated) return errorResponse("संदेश नहीं मिला।", 404);
    revalidatePath("/");
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
  if (!hasManagementRole(admin.role)) {
    return errorResponse("इस कार्रवाई की अनुमति नहीं है।", 403);
  }

  const { id } = await context.params;

  try {
    const deleted = await prisma.$transaction(async (transaction) => {
      const result = await transaction.leadershipMessage.deleteMany({
        where: { id },
      });
      if (result.count === 0) return false;

      await transaction.adminActivity.create({
        data: {
          adminId: admin.id,
          action: "LEADERSHIP_MESSAGE_DELETED",
          entity: "LeadershipMessage",
          entityId: id,
        },
      });
      return true;
    });

    if (!deleted) return errorResponse("संदेश नहीं मिला।", 404);
    revalidatePath("/");
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
