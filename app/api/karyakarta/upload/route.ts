import { UploadStatus } from "@prisma/client";
import { handleDocumentUpload } from "@/lib/karyakarta-upload-handler";
import {
  createStorageKey,
  deletePrivateFile,
  isPrivateStorageAvailable,
  saveEncryptedPrivateFile,
} from "@/lib/private-uploads";
import { prisma } from "@/lib/prisma";
import { checkDocumentUploadRateLimit } from "@/lib/rate-limit/document-upload";
import { isRateLimitProviderAvailable } from "@/lib/rate-limit/types";

export async function POST(request: Request) {
  return handleDocumentUpload(request, {
    isRateLimitProviderAvailable,
    isPrivateStorageAvailable,
    checkRateLimit: checkDocumentUploadRateLimit,
    findApplication: (applicationReference, mobile) =>
      prisma.karyakartaApplication.findFirst({
        where: { applicationReference, mobile },
        select: {
          id: true,
          photoPath: true,
          aadhaarPath: true,
        },
      }),
    createStorageKey: (extension, applicationReference) =>
      createStorageKey(
        "applications",
        extension,
        true,
        applicationReference,
      ),
    saveEncryptedPrivateFile,
    updateApplication: (id, updates) =>
      prisma.karyakartaApplication.update({
        where: { id },
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
      }),
    deletePrivateFile,
    logUnexpectedError: (metadata) => {
      console.error(
        JSON.stringify({
          event: "karyakarta_documents_upload_failed",
          route: "/api/karyakarta/upload",
          code: "UPLOAD_FAILED",
          ...metadata,
        }),
      );
    },
  });
}
