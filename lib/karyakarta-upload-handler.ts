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
type ErrorCategory =
  | "UPLOAD_DEPENDENCY_CHECK_FAILED"
  | "RATE_LIMIT_CHECK_FAILED"
  | "DATABASE_LOOKUP_FAILED"
  | "STORAGE_KEY_CREATION_FAILED"
  | "PRIVATE_STORAGE_SAVE_FAILED"
  | "DATABASE_UPDATE_FAILED"
  | "PRIVATE_STORAGE_CLEANUP_FAILED"
  | "UPLOAD_REQUEST_FAILED";
type SafeFileMetadata = {
  documentType: DocumentKind;
  mimeType: string;
  byteSize: number;
  errorCategory: ErrorCategory;
};
type SafeLogMetadata = { files: SafeFileMetadata[] };
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
  retryAfterSeconds?: number,
): Response {
  return jsonResponse(
    {
      error,
      code,
      ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }),
    },
    status,
    headers,
  );
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

function getSafeMimeType(mimeType: string): string {
  const supportedTypes = new Set([
    "image/jpeg",
    "image/png",
    "application/pdf",
  ]);
  return supportedTypes.has(mimeType) ? mimeType : "unsupported";
}

function getSafeLogMetadata(
  formData: FormData | undefined,
  errorCategory: ErrorCategory,
  onlyDocumentType?: DocumentKind,
): SafeLogMetadata {
  return {
    files: formData
      ? (["photo", "aadhaar"] as const)
          .filter((documentType) =>
            onlyDocumentType ? documentType === onlyDocumentType : true,
          )
          .map((documentType) => ({
            documentType,
            value: formData.get(documentType),
          }))
          .filter(
            (entry): entry is { documentType: DocumentKind; value: File } =>
              isFile(entry.value),
          )
          .map(({ documentType, value }) => ({
            documentType,
            mimeType: getSafeMimeType(value.type),
            byteSize: value.size,
            errorCategory,
          }))
      : [],
  };
}

function logUnexpectedFailure(
  dependencies: UploadDependencies,
  metadata: SafeLogMetadata,
): void {
  try {
    dependencies.logUnexpectedError(metadata);
  } catch {
    console.error(
      JSON.stringify({
        event: "karyakarta_documents_upload_failed",
        route: ROUTE_NAME,
        code: "UPLOAD_FAILED",
        ...metadata,
      }),
    );
  }
}

export async function handleDocumentUpload(
  request: Request,
  dependencies: UploadDependencies,
): Promise<Response> {
  let formData: FormData | undefined;
  const savedUploads: Array<{
    storageKey: string;
    document: AcceptedDocument;
  }> = [];
  let errorCategory: ErrorCategory = "UPLOAD_REQUEST_FAILED";
  let errorDocumentType: DocumentKind | undefined;
  let failureWasLogged = false;

  try {
    errorCategory = "UPLOAD_DEPENDENCY_CHECK_FAILED";
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

    errorCategory = "RATE_LIMIT_CHECK_FAILED";
    const limit = await dependencies.checkRateLimit(getRequestIp(request));
    if (!limit.allowed) {
      const retryAfterSeconds =
        Number.isFinite(limit.retryAfterSeconds) && limit.retryAfterSeconds > 0
          ? Math.ceil(limit.retryAfterSeconds)
          : 1;
      return errorResponse(
        429,
        "RATE_LIMITED",
        "Too many upload attempts. Please wait and try again.",
        { "Retry-After": String(retryAfterSeconds) },
        retryAfterSeconds,
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

    errorCategory = "DATABASE_LOOKUP_FAILED";
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
      errorDocumentType = document.kind;
      errorCategory = "STORAGE_KEY_CREATION_FAILED";
      const storageKey = dependencies.createStorageKey(
        document.extension,
        identity.data.applicationReference,
      );
      errorCategory = "PRIVATE_STORAGE_SAVE_FAILED";
      try {
        await dependencies.saveEncryptedPrivateFile(
          storageKey,
          document.contents,
        );
      } catch {
        logUnexpectedFailure(
          dependencies,
          getSafeLogMetadata(
            formData,
            "PRIVATE_STORAGE_SAVE_FAILED",
            document.kind,
          ),
        );
        failureWasLogged = true;
        throw new Error("Private document storage failed.");
      }
      savedUploads.push({ storageKey, document });
      if (document.kind === "photo") updates.photoPath = storageKey;
      else updates.aadhaarPath = storageKey;
    }

    errorDocumentType = undefined;
    errorCategory = "DATABASE_UPDATE_FAILED";
    const updated = await dependencies.updateApplication(application.id, updates);

    for (const document of documents) {
      const oldPath =
        document.kind === "photo"
          ? application.photoPath
          : application.aadhaarPath;
      if (
        oldPath &&
        !savedUploads.some(({ storageKey }) => storageKey === oldPath)
      ) {
        await dependencies.deletePrivateFile(oldPath).catch(() => {
          logUnexpectedFailure(
            dependencies,
            getSafeLogMetadata(
              formData,
              "PRIVATE_STORAGE_CLEANUP_FAILED",
              document.kind,
            ),
          );
        });
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
      savedUploads.map(({ storageKey, document }) =>
        dependencies.deletePrivateFile(storageKey).catch(() => {
          logUnexpectedFailure(
            dependencies,
            getSafeLogMetadata(
              formData,
              "PRIVATE_STORAGE_CLEANUP_FAILED",
              document.kind,
            ),
          );
        }),
      ),
    );
    if (!failureWasLogged) {
      logUnexpectedFailure(
        dependencies,
        getSafeLogMetadata(formData, errorCategory, errorDocumentType),
      );
    }
    return errorResponse(500, "UPLOAD_FAILED", "Upload failed");
  }
}
