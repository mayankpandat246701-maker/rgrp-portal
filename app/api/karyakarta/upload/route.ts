import { UploadStatus } from "@prisma/client";
import { z } from "zod";
import {
  createStorageKey,
  deletePrivateFile,
  saveEncryptedPrivateFile,
} from "@/lib/private-uploads";
import { prisma } from "@/lib/prisma";
import { checkDocumentUploadRateLimit } from "@/lib/rate-limit/document-upload";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MAX_REQUEST_SIZE = 4 * 1024 * 1024 + 32 * 1024;
const GENERIC_ERROR_MESSAGE =
  "दस्तावेज़ अपलोड नहीं हो सके। कृपया जानकारी और फ़ाइलें जाँचकर फिर प्रयास करें।";

const identitySchema = z
  .object({
    applicationReference: z.string().trim().toUpperCase().regex(/^RGRP-\d{8}-\d{5}$/),
    mobile: z.preprocess(
      (value) => {
        if (typeof value !== "string") return value;
        let digits = value.trim().replace(/\D/g, "");
        if (digits.length === 12 && digits.startsWith("91")) {
          digits = digits.slice(2);
        }
        return digits;
      },
      z.string().regex(/^[6-9]\d{9}$/),
    ),
  })
  .strict();

type DocumentKind = "photo" | "aadhaar";
type AcceptedDocument = {
  kind: DocumentKind;
  file: File;
  extension: "jpg" | "png" | "pdf";
  contents: Buffer;
};

function getRequestIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function getFileExtension(file: File, kind: DocumentKind): "jpg" | "png" | "pdf" | null {
  const allowedTypes =
    kind === "photo"
      ? new Map([["image/jpeg", "jpg"], ["image/png", "png"]] as const)
      : new Map([
          ["image/jpeg", "jpg"],
          ["image/png", "png"],
          ["application/pdf", "pdf"],
        ] as const);
  return allowedTypes.get(file.type as "image/jpeg" | "image/png" | "application/pdf") ?? null;
}

function hasMatchingFileSignature(
  contents: Buffer,
  extension: "jpg" | "png" | "pdf",
): boolean {
  if (extension === "jpg") {
    return contents.length >= 3 && contents[0] === 0xff && contents[1] === 0xd8 && contents[2] === 0xff;
  }
  if (extension === "png") {
    return contents.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  }
  return contents.subarray(0, 5).toString("ascii") === "%PDF-";
}

function isFile(value: FormDataEntryValue | null): value is File {
  return typeof value === "object" && value !== null && "arrayBuffer" in value;
}

async function readDocument(
  formData: FormData,
  kind: DocumentKind,
): Promise<AcceptedDocument | null> {
  const value = formData.get(kind);
  if (value === null) return null;
  if (!isFile(value) || value.size === 0 || value.size > MAX_FILE_SIZE) {
    throw new Error("invalid_document");
  }
  const extension = getFileExtension(value, kind);
  if (!extension) throw new Error("invalid_document");

  const contents = Buffer.from(await value.arrayBuffer());
  if (
    contents.length !== value.size ||
    contents.length > MAX_FILE_SIZE ||
    !hasMatchingFileSignature(contents, extension)
  ) {
    throw new Error("invalid_document");
  }

  return { kind, file: value, extension, contents };
}

export async function POST(request: Request) {
  const limit = checkDocumentUploadRateLimit(getRequestIp(request));
  if (!limit.allowed) {
    return Response.json(
      { success: false, error: { message: "बहुत अधिक प्रयास किए गए। कृपया बाद में फिर प्रयास करें।" } },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSeconds),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_SIZE) {
    return Response.json(
      { success: false, error: { message: GENERIC_ERROR_MESSAGE } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { success: false, error: { message: GENERIC_ERROR_MESSAGE } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const identity = identitySchema.safeParse({
    applicationReference: formData.get("applicationReference"),
    mobile: formData.get("mobile"),
  });
  if (!identity.success) {
    return Response.json(
      { success: false, error: { message: GENERIC_ERROR_MESSAGE } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  let documents: AcceptedDocument[];
  try {
    const accepted = await Promise.all([
      readDocument(formData, "photo"),
      readDocument(formData, "aadhaar"),
    ]);
    documents = accepted.filter(
      (document): document is AcceptedDocument => document !== null,
    );
    if (documents.length === 0) throw new Error("missing_documents");
  } catch {
    return Response.json(
      { success: false, error: { message: GENERIC_ERROR_MESSAGE } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const application = await prisma.karyakartaApplication.findFirst({
    where: {
      applicationReference: identity.data.applicationReference,
      mobile: identity.data.mobile,
    },
    select: {
      id: true,
      photoPath: true,
      aadhaarPath: true,
    },
  });

  if (!application) {
    return Response.json(
      { success: false, error: { message: GENERIC_ERROR_MESSAGE } },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const savedPaths: string[] = [];
  try {
    const updates: { photoPath?: string; aadhaarPath?: string } = {};
    for (const document of documents) {
      const storageKey = createStorageKey(
        "applications",
        document.extension,
        true,
        identity.data.applicationReference,
      );
      await saveEncryptedPrivateFile(storageKey, document.contents);
      savedPaths.push(storageKey);
      if (document.kind === "photo") updates.photoPath = storageKey;
      else updates.aadhaarPath = storageKey;
    }

    const updated = await prisma.karyakartaApplication.update({
      where: { id: application.id },
      data: {
        ...updates,
        uploadStatus: UploadStatus.PENDING,
        documentReviewReason: null,
        verifiedByAdminId: null,
        verifiedAt: null,
      },
      select: {
        photoPath: true,
        aadhaarPath: true,
        uploadStatus: true,
      },
    });

    for (const document of documents) {
      const oldPath =
        document.kind === "photo" ? application.photoPath : application.aadhaarPath;
      if (oldPath && !savedPaths.includes(oldPath)) {
        await deletePrivateFile(oldPath).catch(() => undefined);
      }
    }
    console.info(
      JSON.stringify({
        event: "karyakarta_documents_uploaded",
        category: "private_storage",
      }),
    );

    return Response.json(
      {
        success: true,
        data: {
          photoUploaded: Boolean(updated.photoPath),
          aadhaarUploaded: Boolean(updated.aadhaarPath),
          status: updated.uploadStatus,
        },
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    await Promise.all(
      savedPaths.map((storageKey) =>
        deletePrivateFile(storageKey).catch(() => undefined),
      ),
    );
    console.error(
      JSON.stringify({
        event: "karyakarta_documents_upload_failed",
        category: "private_storage_or_database",
      }),
    );
    return Response.json(
      { success: false, error: { message: GENERIC_ERROR_MESSAGE } },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
