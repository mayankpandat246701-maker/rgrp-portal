import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AUDIT_ACTIONS, writeAuditLog } from "@/lib/audit-log";
import { authorizeAdmin, GENERIC_ERROR, jsonError, jsonOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const reorderSchema = z.object({ ids: z.array(z.string().min(1).max(40)).min(1).max(200) });

export async function POST(request: Request) {
  const auth = await authorizeAdmin("manageLeaders");
  if ("response" in auth) return auth.response;

  const parsed = reorderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || new Set(parsed.data.ids).size !== parsed.data.ids.length) {
    return jsonError("क्रम की जानकारी मान्य नहीं है।", 400);
  }

  try {
    await prisma.$transaction(
      parsed.data.ids.map((id, index) =>
        prisma.sanghLeader.update({ where: { id }, data: { displayOrder: (index + 1) * 10 } }),
      ),
    );
    await writeAuditLog({
      actorType: "ADMIN",
      actorId: auth.admin.sub,
      actorLabel: auth.admin.name,
      action: AUDIT_ACTIONS.LEADER_REORDER,
      result: "SUCCESS",
      request,
    });
    revalidatePath("/");
    return jsonOk();
  } catch (error) {
    console.error("Leader reorder failed", { reason: error instanceof Error ? error.name : "unknown" });
    return jsonError(GENERIC_ERROR, 500);
  }
}
