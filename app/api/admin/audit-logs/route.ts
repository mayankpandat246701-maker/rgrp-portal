import { AdminAuditAction } from "@prisma/client";
import { z } from "zod";
import { listSafeAdminAuditLogs } from "@/lib/admin-audit-log-view";
import { requireAdmin } from "@/lib/auth/require-admin";

const actionValues = Object.values(AdminAuditAction) as [
  AdminAuditAction,
  ...AdminAuditAction[],
];

const querySchema = z.object({
  action: z.enum(actionValues).optional(),
  page: z.coerce.number().int().min(1).max(10_000).optional(),
});

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return json(
      { success: false, error: { message: "अनधिकृत अनुरोध।" } },
      401,
    );
  }
  if (admin.role !== "SUPER_ADMIN") {
    return json(
      { success: false, error: { message: "इस पृष्ठ की अनुमति नहीं है।" } },
      403,
    );
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    action: url.searchParams.get("action") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
  });
  if (!parsed.success) {
    return json(
      { success: false, error: { message: "फ़िल्टर मान्य नहीं है।" } },
      400,
    );
  }

  const result = await listSafeAdminAuditLogs(parsed.data);
  return json({ success: true, data: result });
}
