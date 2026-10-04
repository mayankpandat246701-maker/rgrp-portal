import { revalidatePath } from "next/cache";
import { AUDIT_ACTIONS, writeAuditLog } from "@/lib/audit-log";
import { authorizeAdmin, GENERIC_ERROR, jsonError, jsonOk } from "@/lib/api-response";
import { InputError, parseLeaderForm } from "@/lib/form-inputs";
import { prisma } from "@/lib/prisma";
import { hasUpload, storeUpload } from "@/lib/uploads/store-file";
import { FileValidationError } from "@/lib/uploads/validate-file";

export async function POST(request: Request) {
  const auth = await authorizeAdmin("manageLeaders");
  if ("response" in auth) return auth.response;

  try {
    const form = await request.formData();
    const data = parseLeaderForm(form);
    const photo = form.get("photo");
    const stored = hasUpload(photo) ? await storeUpload(photo, "leader-photos", { allowPdf: false }) : null;

    const leader = await prisma.sanghLeader.create({
      data: { ...data, photoPath: stored?.storageKey ?? null },
      select: { id: true, fullName: true },
    });

    await writeAuditLog({
      actorType: "ADMIN",
      actorId: auth.admin.sub,
      actorLabel: auth.admin.name,
      action: AUDIT_ACTIONS.LEADER_CREATE,
      result: "SUCCESS",
      entityId: leader.id,
      request,
      metadata: { fullName: leader.fullName },
    });
    revalidatePath("/");
    return jsonOk({ id: leader.id }, 201);
  } catch (error) {
    if (error instanceof InputError) return jsonError(error.userMessage, 400);
    if (error instanceof FileValidationError) return jsonError(error.userMessage, error.status);
    console.error("Leader create failed", { reason: error instanceof Error ? error.name : "unknown" });
    return jsonError(GENERIC_ERROR, 500);
  }
}
