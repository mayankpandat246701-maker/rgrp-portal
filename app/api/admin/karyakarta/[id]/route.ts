import bcrypt from "bcryptjs";
import { z } from "zod";
import { AUDIT_ACTIONS, writeAuditLog } from "@/lib/audit-log";
import { authorizeAdmin, GENERIC_ERROR, jsonError, jsonOk } from "@/lib/api-response";
import { InputError, parseKaryakartaForm, parsePassword, uniqueConflictMessage } from "@/lib/form-inputs";
import { prisma } from "@/lib/prisma";
import { hasUpload, removeStoredFile, storeUpload } from "@/lib/uploads/store-file";
import { FileValidationError } from "@/lib/uploads/validate-file";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const auth = await authorizeAdmin("manageKaryakarta");
  if ("response" in auth) return auth.response;
  const { id } = await params;

  let newPhotoKey: string | null = null;
  try {
    const existing = await prisma.karyakarta.findUnique({
      where: { id },
      select: { photoPath: true, status: true, approvedAt: true },
    });
    if (!existing) return jsonError("कार्यकर्ता नहीं मिला।", 404);

    const form = await request.formData();
    const data = parseKaryakartaForm(form);
    const password = parsePassword(form, false);
    const disableLogin = form.get("disableLogin") === "true";
    const photo = form.get("photo");
    const removePhoto = form.get("removePhoto") === "true";

    if (hasUpload(photo)) newPhotoKey = (await storeUpload(photo, "karyakarta-photos", { allowPdf: false })).storageKey;
    const photoPath = newPhotoKey ?? (removePhoto ? null : existing.photoPath);

    const updated = await prisma.karyakarta.update({
      where: { id },
      data: {
        ...data,
        photoPath,
        approvedAt: data.status === "APPROVED" ? (existing.approvedAt ?? new Date()) : existing.approvedAt,
        ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
        ...(disableLogin && !password ? { passwordHash: null } : {}),
      },
      select: { regNo: true },
    });
    if (photoPath !== existing.photoPath) await removeStoredFile(existing.photoPath);

    const deactivated = data.status === "INACTIVE" && existing.status !== "INACTIVE";
    await writeAuditLog({
      actorType: "ADMIN",
      actorId: auth.admin.sub,
      actorLabel: auth.admin.name,
      action: deactivated ? AUDIT_ACTIONS.KARYAKARTA_DEACTIVATE : AUDIT_ACTIONS.KARYAKARTA_UPDATE,
      result: "SUCCESS",
      regNo: updated.regNo,
      entityId: id,
      request,
      metadata: {
        statusFrom: existing.status,
        statusTo: data.status,
        passwordReset: Boolean(password),
        loginDisabled: disableLogin && !password,
      },
    });
    return jsonOk();
  } catch (error) {
    await removeStoredFile(newPhotoKey);
    if (error instanceof InputError) return jsonError(error.userMessage, 400);
    if (error instanceof FileValidationError) return jsonError(error.userMessage, error.status);
    const conflict = uniqueConflictMessage(error);
    if (conflict) return jsonError(conflict, 409);
    console.error("Karyakarta update failed", { reason: error instanceof Error ? error.name : "unknown" });
    return jsonError(GENERIC_ERROR, 500);
  }
}

const deleteSchema = z.object({ confirmRegNo: z.string().trim().min(1).max(40) });

/** Permanent deletion is restricted to SUPER_ADMIN and requires re-typing the registration number. */
export async function DELETE(request: Request, { params }: Context) {
  const auth = await authorizeAdmin("deleteRecords");
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("पुष्टि के लिए पंजीकरण संख्या आवश्यक है।", 400);

  try {
    const existing = await prisma.karyakarta.findUnique({
      where: { id },
      select: { regNo: true, name: true, photoPath: true, idCard: { select: { storageKey: true } } },
    });
    if (!existing) return jsonError("कार्यकर्ता नहीं मिला।", 404);
    if (existing.regNo !== parsed.data.confirmRegNo.toUpperCase()) {
      return jsonError("पंजीकरण संख्या मेल नहीं खाती।", 400);
    }

    await prisma.karyakarta.delete({ where: { id } });
    await removeStoredFile(existing.photoPath);
    await removeStoredFile(existing.idCard?.storageKey);

    await writeAuditLog({
      actorType: "ADMIN",
      actorId: auth.admin.sub,
      actorLabel: auth.admin.name,
      action: AUDIT_ACTIONS.KARYAKARTA_DELETE,
      result: "SUCCESS",
      regNo: existing.regNo,
      entityId: id,
      request,
      metadata: { name: existing.name },
    });
    return jsonOk();
  } catch (error) {
    console.error("Karyakarta delete failed", { reason: error instanceof Error ? error.name : "unknown" });
    return jsonError(GENERIC_ERROR, 500);
  }
}
