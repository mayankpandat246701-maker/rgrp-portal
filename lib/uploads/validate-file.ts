import "server-only";

import { randomUUID } from "node:crypto";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type DetectedFileType = {
  extension: "jpg" | "png" | "pdf";
  mimeType: "image/jpeg" | "image/png" | "application/pdf";
};

const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png"]);

export class FileValidationError extends Error {
  constructor(
    public readonly status: number,
    public readonly userMessage: string,
  ) {
    super(userMessage);
    this.name = "FileValidationError";
  }
}

function detectFromSignature(contents: Buffer): DetectedFileType | null {
  if (contents.length >= 3 && contents[0] === 0xff && contents[1] === 0xd8 && contents[2] === 0xff) {
    return { extension: "jpg", mimeType: "image/jpeg" };
  }
  if (
    contents.length >= 8 &&
    contents.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { extension: "png", mimeType: "image/png" };
  }
  if (contents.length >= 5 && contents.subarray(0, 5).toString("ascii") === "%PDF-") {
    return { extension: "pdf", mimeType: "application/pdf" };
  }
  return null;
}

function isFile(value: FormDataEntryValue | null): value is File {
  return typeof value === "object" && value !== null && "arrayBuffer" in value;
}

/**
 * Validates an uploaded file by size and by its real content signature.
 * The client-supplied filename is only used to reject obviously wrong
 * extensions; it is never used for storage.
 */
export async function readValidatedUpload(
  value: FormDataEntryValue | null,
  options: { allowPdf: boolean },
): Promise<{ contents: Buffer; type: DetectedFileType }> {
  if (!isFile(value) || value.size === 0) {
    throw new FileValidationError(400, "कृपया एक फ़ाइल चुनें।");
  }
  if (value.size > MAX_UPLOAD_BYTES) {
    throw new FileValidationError(413, "फ़ाइल का आकार 5 MB से अधिक नहीं होना चाहिए।");
  }

  const extension = value.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(extension) || (!options.allowPdf && extension === "pdf")) {
    throw new FileValidationError(415, options.allowPdf ? "केवल PDF, JPG, JPEG या PNG फ़ाइल स्वीकार्य है।" : "केवल JPG, JPEG या PNG फ़ोटो स्वीकार्य है।");
  }

  const contents = Buffer.from(await value.arrayBuffer());
  if (contents.length > MAX_UPLOAD_BYTES) {
    throw new FileValidationError(413, "फ़ाइल का आकार 5 MB से अधिक नहीं होना चाहिए।");
  }

  const type = detectFromSignature(contents);
  if (!type || (!options.allowPdf && type.extension === "pdf")) {
    throw new FileValidationError(415, "फ़ाइल की सामग्री मान्य नहीं है। कृपया सही फ़ाइल चुनें।");
  }

  return { contents, type };
}

export function mimeTypeForStorageKey(storageKey: string): DetectedFileType["mimeType"] {
  if (storageKey.includes(".pdf")) return "application/pdf";
  if (storageKey.includes(".png")) return "image/png";
  return "image/jpeg";
}

export function generateStorageKey(
  directory: "id-cards" | "karyakarta-photos" | "leader-photos",
  extension: DetectedFileType["extension"],
  encrypted: boolean,
): string {
  return `${directory}/${randomUUID()}.${extension}${encrypted ? ".enc" : ""}`;
}
