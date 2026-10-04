import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { leadershipMessageSchema } from "@/lib/leadership-message-validation";

function hasManagementRole(role: string): boolean {
  return role === "SUPER_ADMIN" || role === "CONTENT_ADMIN";
}

function errorResponse(error: string, status: number): Response {
  return Response.json(
    { success: false, error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("अनधिकृत अनुरोध।", 401);
  if (!hasManagementRole(admin.role)) {
    return errorResponse("इस कार्रवाई की अनुमति नहीं है।", 403);
  }

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
    const message = await prisma.$transaction(async (transaction) => {
      const created = await transaction.leadershipMessage.create({
        data: parsed.data,
      });
      await transaction.adminActivity.create({
        data: {
          adminId: admin.id,
          action: "LEADERSHIP_MESSAGE_CREATED",
          entity: "LeadershipMessage",
          entityId: created.id,
        },
      });
      return created;
    });

    return Response.json(
      { success: true, data: message },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error(
      JSON.stringify({
        event: "leadership_message_create_failed",
        route: "/api/admin/leadership-messages",
        code: "LEADERSHIP_MESSAGE_CREATE_FAILED",
      }),
    );
    return errorResponse("संदेश सहेजा नहीं जा सका।", 500);
  }
}
