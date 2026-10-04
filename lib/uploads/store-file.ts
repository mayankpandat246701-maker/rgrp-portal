import "server-only";

import {
  deletePrivateFile,
  isPrivateStorageAvailable,
  readEncryptedPrivateFile,
  readPrivateFile,
  saveEncryptedPrivateFile,
  savePrivateFile,
} from "@/lib/private-uploads";
import { FileValidationError, generateStorageKey, readValidatedUpload } from "@/lib/uploads/validate-file";

type Directory = "id-cards" | "karyakarta-photos" | "leader-photos";

/** Leader photos are public content; everything else is personal data and encrypted at rest. */
function shouldEncrypt(directory: Directory) {
  return directory !== "leader-photos";
}

export async function storeUpload(
  value: FormDataEntryValue | null,
  directory: Directory,
  options: { allowPdf: boolean },
) {
  if (!isPrivateStorageAvailable()) {
    throw new FileValidationError(503, "फ़ाइल संग्रहण अभी उपलब्ध नहीं है। कृपया बाद में प्रयास करें।");
  }
  const { contents, type } = await readValidatedUpload(value, options);
  const encrypted = shouldEncrypt(directory);
  const storageKey = generateStorageKey(directory, type.extension, encrypted);
  if (encrypted) await saveEncryptedPrivateFile(storageKey, contents);
  else await savePrivateFile(storageKey, contents);
  return { storageKey, mimeType: type.mimeType, sizeBytes: contents.length };
}

export async function readStoredFile(storageKey: string): Promise<Buffer> {
  return storageKey.endsWith(".enc") ? readEncryptedPrivateFile(storageKey) : readPrivateFile(storageKey);
}

export async function removeStoredFile(storageKey: string | null | undefined): Promise<void> {
  if (!storageKey) return;
  try {
    await deletePrivateFile(storageKey);
  } catch (error) {
    console.error("Stored file cleanup failed", { reason: error instanceof Error ? error.name : "unknown" });
  }
}

export function hasUpload(value: FormDataEntryValue | null): boolean {
  return typeof value === "object" && value !== null && "size" in value && value.size > 0;
}

export function fileResponse(
  contents: Buffer,
  mimeType: string,
  options: { download?: string; cache?: "private" | "public" } = {},
): Response {
  const headers: Record<string, string> = {
    "Content-Type": mimeType,
    "Content-Length": String(contents.length),
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": options.cache === "public" ? "public, max-age=300" : "private, no-store",
    "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
  };
  if (options.download) {
    headers["Content-Disposition"] = `attachment; filename="${options.download}"`;
  } else {
    headers["Content-Disposition"] = "inline";
  }
  return new Response(new Uint8Array(contents), { headers });
}
