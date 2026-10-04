import bcrypt from "bcryptjs";
import { AUDIT_ACTIONS, writeAuditLog } from "@/lib/audit-log";
import { authorizeAdmin, GENERIC_ERROR, jsonError, jsonOk } from "@/lib/api-response";
import { InputError, parseKaryakartaForm, parsePassword, uniqueConflictMessage } from "@/lib/form-inputs";
import { prisma } from "@/lib/prisma";
import { hasUpload, removeStoredFile, storeUpload } from "@/lib/uploads/store-file";
import { FileValidationError } from "@/lib/uploads/validate-file";

export async function POST(request: Request) {
  const auth = await authorizeAdmin("manageKaryakarta");
  if ("response" in auth) return auth.response;

  let photoKey: string | null = null;
  try {
    const form = await request.formData();
    const data = parseKaryakartaForm(form);
    const password = parsePassword(form, false);
    const photo = form.get("photo");
    if (hasUpload(photo)) photoKey = (await storeUpload(photo, "karyakarta-photos", { allowPdf: false })).storageKey;

    const karyakarta = await prisma.karyakarta.create({
      data: {
        ...data,
        photoPath: photoKey,
        passwordHash: password ? await bcrypt.hash(password, 12) : null,
        approvedAt: data.status === "APPROVED" ? new Date() : null,
      },
      select: { id: true, regNo: true, name: true },
    });

    await writeAuditLog({
      actorType: "ADMIN",
      actorId: auth.admin.sub,
      actorLabel: auth.admin.name,
      action: AUDIT_ACTIONS.KARYAKARTA_CREATE,
      result: "SUCCESS",
      regNo: karyakarta.regNo,
      entityId: karyakarta.id,
      request,
      metadata: { loginEnabled: Boolean(password) },
    });
    return jsonOk({ id: karyakarta.id }, 201);
  } catch (error) {
    await removeStoredFile(photoKey);
    if (error instanceof InputError) return jsonError(error.userMessage, 400);
    if (error instanceof FileValidationError) return jsonError(error.userMessage, error.status);
    const conflict = uniqueConflictMessage(error);
    if (conflict) return jsonError(conflict, 409);
    console.error("Karyakarta create failed", { reason: error instanceof Error ? error.name : "unknown" });
    return jsonError(GENERIC_ERROR, 500);
  }
}
