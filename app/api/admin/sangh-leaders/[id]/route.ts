import { revalidatePath } from "next/cache";
import { AUDIT_ACTIONS, writeAuditLog } from "@/lib/audit-log";
import { authorizeAdmin, GENERIC_ERROR, jsonError, jsonOk } from "@/lib/api-response";
import { InputError, parseLeaderForm } from "@/lib/form-inputs";
import { prisma } from "@/lib/prisma";
import { hasUpload, removeStoredFile, storeUpload } from "@/lib/uploads/store-file";
import { FileValidationError } from "@/lib/uploads/validate-file";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const auth = await authorizeAdmin("manageLeaders");
  if ("response" in auth) return auth.response;
  const { id } = await params;

  try {
    const existing = await prisma.sanghLeader.findUnique({ where: { id }, select: { photoPath: true } });
    if (!existing) return jsonError("यह रिकॉर्ड नहीं मिला।", 404);

    const form = await request.formData();
    const data = parseLeaderForm(form);
    const photo = form.get("photo");
    const removePhoto = form.get("removePhoto") === "true";

    let photoPath = existing.photoPath;
    if (hasUpload(photo)) {
      photoPath = (await storeUpload(photo, "leader-photos", { allowPdf: false })).storageKey;
    } else if (removePhoto) {
      photoPath = null;
    }

    await prisma.sanghLeader.update({ where: { id }, data: { ...data, photoPath } });
    if (photoPath !== existing.photoPath) await removeStoredFile(existing.photoPath);

    await writeAuditLog({
      actorType: "ADMIN",
      actorId: auth.admin.sub,
      actorLabel: auth.admin.name,
      action: AUDIT_ACTIONS.LEADER_UPDATE,
      result: "SUCCESS",
      entityId: id,
      request,
      metadata: { fullName: data.fullName, isVisible: data.isVisible },
    });
    revalidatePath("/");
    return jsonOk();
  } catch (error) {
    if (error instanceof InputError) return jsonError(error.userMessage, 400);
    if (error instanceof FileValidationError) return jsonError(error.userMessage, error.status);
    console.error("Leader update failed", { reason: error instanceof Error ? error.name : "unknown" });
    return jsonError(GENERIC_ERROR, 500);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const auth = await authorizeAdmin("manageLeaders");
  if ("response" in auth) return auth.response;
  const { id } = await params;

  try {
    const existing = await prisma.sanghLeader.findUnique({ where: { id }, select: { photoPath: true, fullName: true } });
    if (!existing) return jsonError("यह रिकॉर्ड नहीं मिला।", 404);

    await prisma.sanghLeader.delete({ where: { id } });
    await removeStoredFile(existing.photoPath);
    await writeAuditLog({
      actorType: "ADMIN",
      actorId: auth.admin.sub,
      actorLabel: auth.admin.name,
      action: AUDIT_ACTIONS.LEADER_DELETE,
      result: "SUCCESS",
      entityId: id,
      request,
      metadata: { fullName: existing.fullName },
    });
    revalidatePath("/");
    return jsonOk();
  } catch (error) {
    console.error("Leader delete failed", { reason: error instanceof Error ? error.name : "unknown" });
    return jsonError(GENERIC_ERROR, 500);
  }
}
