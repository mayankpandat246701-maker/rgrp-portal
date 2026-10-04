import { z } from "zod";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MAX_REQUEST_SIZE = 4 * 1024 * 1024 + 32 * 1024;
const ROUTE_NAME = "/api/karyakarta/upload";

const identitySchema = z.object({
  applicationReference: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^RGRP-\d{8}-\d{5}$/),
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
});

type DocumentKind = "photo" | "aadhaar";
type FileExtension = "jpg" | "png" | "pdf";
type AcceptedDocument = {
  kind: DocumentKind;
  file: File;
  extension: FileExtension;
  contents: Buffer;
};
type Application = {
  id: string;
  photoPath: string | null;
  aadhaarPath: string | null;
};
type ApplicationUpdate = {
  photoPath?: string;
  aadhaarPath?: string;
};
type UpdatedApplication = {
  photoPath: string | null;
  aadhaarPath: string | null;
  uploadStatus: string;
};
type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};
type SafeLogMetadata = {
  fileSize: number | null;
  fileType: string | null;
};
export type UploadDependencies = {
  isRateLimitProviderAvailable(): boolean;
  isPrivateStorageAvailable(): boolean;
  checkRateLimit(ip: string): Promise<RateLimitResult>;
  findApplication(
    applicationReference: string,
    mobile: string,
  ): Promise<Application | null>;
  createStorageKey(
    extension: FileExtension,
    applicationReference: string,
  ): string;
  saveEncryptedPrivateFile(storageKey: string, contents: Buffer): Promise<void>;
  updateApplication(
    id: string,
    updates: ApplicationUpdate,
  ): Promise<UpdatedApplication>;
  deletePrivateFile(storageKey: string): Promise<void>;
  logUnexpectedError(metadata: SafeLogMetadata): void;
};

class InvalidUploadError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function jsonResponse(
  body: unknown,
  status: number,
  headers: HeadersInit = {},
): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Cache-Control", "no-store");
  return Response.json(body, {
    status,
    headers: responseHeaders,
  });
}

function errorResponse(
  status: number,
  code: string,
  error: string,
  headers: HeadersInit = {},
): Response {
  return jsonResponse({ error, code }, status, headers);
}

function getRequestIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function getFileExtension(file: File, kind: DocumentKind): FileExtension | null {
  const allowedTypes =
    kind === "photo"
      ? new Map<string, FileExtension>([
          ["image/jpeg", "jpg"],
          ["image/png", "png"],
        ])
      : new Map<string, FileExtension>([
          ["image/jpeg", "jpg"],
          ["image/png", "png"],
          ["application/pdf", "pdf"],
        ]);
  return allowedTypes.get(file.type) ?? null;
}

function hasMatchingFileSignature(
  contents: Buffer,
  extension: FileExtension,
): boolean {
  if (extension === "jpg") {
    return (
      contents.length >= 3 &&
      contents[0] === 0xff &&
      contents[1] === 0xd8 &&
      contents[2] === 0xff
    );
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
  if (!isFile(value)) {
    throw new InvalidUploadError(400, "INVALID_FILE_INPUT", "Invalid file input");
  }
  if (value.size === 0) {
    throw new InvalidUploadError(400, "EMPTY_FILE", "File is empty");
  }
  if (value.size > MAX_FILE_SIZE) {
    throw new InvalidUploadError(
      413,
      "FILE_TOO_LARGE",
      "File exceeds the allowed size",
    );
  }

  const extension = getFileExtension(value, kind);
  if (!extension) {
    throw new InvalidUploadError(
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Unsupported file type",
    );
  }

  const contents = Buffer.from(await value.arrayBuffer());
  if (
    contents.length !== value.size ||
    contents.length > MAX_FILE_SIZE ||
    !hasMatchingFileSignature(contents, extension)
  ) {
    throw new InvalidUploadError(
      400,
      "INVALID_FILE_CONTENT",
      "Invalid file content",
    );
  }

  return { kind, file: value, extension, contents };
}

function getSafeLogMetadata(formData?: FormData): SafeLogMetadata {
  const files = formData
    ? (["photo", "aadhaar"] as const)
        .map((kind) => formData.get(kind))
        .filter(isFile)
    : [];
  const supportedTypes = new Set([
    "image/jpeg",
    "image/png",
    "application/pdf",
  ]);

  return {
    fileSize:
      files.length > 0
        ? files.reduce((total, file) => total + file.size, 0)
        : null,
    fileType:
      files.length === 1 && supportedTypes.has(files[0].type)
        ? files[0].type
        : files.length > 0
          ? "multiple_or_unsupported"
          : null,
  };
}

export async function handleDocumentUpload(
  request: Request,
  dependencies: UploadDependencies,
): Promise<Response> {
  let formData: FormData | undefined;
  const savedPaths: string[] = [];

  try {
    if (
      !dependencies.isRateLimitProviderAvailable() ||
      !dependencies.isPrivateStorageAvailable()
    ) {
      return errorResponse(
        503,
        "UPLOAD_SERVICE_UNAVAILABLE",
        "Upload service is temporarily unavailable",
        { "Retry-After": "60", "X-Robots-Tag": "noindex, nofollow" },
      );
    }

    const limit = await dependencies.checkRateLimit(getRequestIp(request));
    if (!limit.allowed) {
      return errorResponse(
        429,
        "UPLOAD_RATE_LIMITED",
        "Too many upload attempts. Try again later.",
        { "Retry-After": String(limit.retryAfterSeconds) },
      );
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_REQUEST_SIZE) {
      return errorResponse(
        413,
        "FILE_TOO_LARGE",
        "File exceeds the allowed size",
      );
    }

    try {
      formData = await request.formData();
    } catch {
      return errorResponse(400, "MALFORMED_FORM_DATA", "Invalid upload request");
    }

    const applicationReference = formData.get("applicationReference");
    if (
      applicationReference === null ||
      (typeof applicationReference === "string" &&
        applicationReference.trim() === "")
    ) {
      return errorResponse(
        400,
        "APPLICATION_REFERENCE_REQUIRED",
        "Application ID is required",
      );
    }
    const mobile = formData.get("mobile");
    if (mobile === null || (typeof mobile === "string" && mobile.trim() === "")) {
      return errorResponse(
        400,
        "MOBILE_REQUIRED",
        "Registered mobile number is required",
      );
    }

    const identity = identitySchema.safeParse({
      applicationReference,
      mobile,
    });
    if (!identity.success) {
      const invalidReference = identity.error.issues.some(
        (issue) => issue.path[0] === "applicationReference",
      );
      return invalidReference
        ? errorResponse(
            400,
            "INVALID_APPLICATION_REFERENCE",
            "Invalid application reference",
          )
        : errorResponse(
            400,
            "INVALID_MOBILE_NUMBER",
            "Invalid registered mobile number",
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
    } catch (error) {
      if (error instanceof InvalidUploadError) {
        return errorResponse(error.status, error.code, error.message);
      }
      throw error;
    }
    if (documents.length === 0) {
      return errorResponse(
        400,
        "DOCUMENT_TYPE_REQUIRED",
        "Document type is required",
      );
    }

    const application = await dependencies.findApplication(
      identity.data.applicationReference,
      identity.data.mobile,
    );
    if (!application) {
      return errorResponse(
        400,
        "INVALID_APPLICATION_REFERENCE",
        "Invalid application reference",
      );
    }

    const updates: ApplicationUpdate = {};
    for (const document of documents) {
      const storageKey = dependencies.createStorageKey(
        document.extension,
        identity.data.applicationReference,
      );
      await dependencies.saveEncryptedPrivateFile(
        storageKey,
        document.contents,
      );
      savedPaths.push(storageKey);
      if (document.kind === "photo") updates.photoPath = storageKey;
      else updates.aadhaarPath = storageKey;
    }

    const updated = await dependencies.updateApplication(application.id, updates);

    for (const document of documents) {
      const oldPath =
        document.kind === "photo"
          ? application.photoPath
          : application.aadhaarPath;
      if (oldPath && !savedPaths.includes(oldPath)) {
        await dependencies.deletePrivateFile(oldPath).catch(() => undefined);
      }
    }

    console.info(
      JSON.stringify({
        event: "karyakarta_documents_uploaded",
        category: "private_storage",
      }),
    );

    return jsonResponse(
      {
        success: true,
        data: {
          photoUploaded: Boolean(updated.photoPath),
          aadhaarUploaded: Boolean(updated.aadhaarPath),
          status: updated.uploadStatus,
        },
      },
      201,
    );
  } catch {
    await Promise.all(
      savedPaths.map((storageKey) =>
        dependencies.deletePrivateFile(storageKey).catch(() => undefined),
      ),
    );
    try {
      dependencies.logUnexpectedError(getSafeLogMetadata(formData));
    } catch {
      console.error(
        JSON.stringify({
          event: "karyakarta_documents_upload_failed",
          route: ROUTE_NAME,
          code: "UPLOAD_FAILED",
          fileSize: null,
          fileType: null,
        }),
      );
    }
    return errorResponse(500, "UPLOAD_FAILED", "Upload failed");
  }
}
