CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

ALTER TYPE "AdminAuditAction" ADD VALUE 'DOCUMENTS_VERIFIED';
ALTER TYPE "AdminAuditAction" ADD VALUE 'DOCUMENTS_REJECTED';
ALTER TYPE "AdminAuditAction" ADD VALUE 'ID_CARD_TEMPLATE_UPLOADED';
ALTER TYPE "AdminAuditAction" ADD VALUE 'QR_GENERATED';

ALTER TABLE "KaryakartaApplication"
ADD COLUMN "photoPath" TEXT,
ADD COLUMN "aadhaarPath" TEXT,
ADD COLUMN "qrCodePath" TEXT,
ADD COLUMN "uploadStatus" "UploadStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "documentReviewReason" TEXT,
ADD COLUMN "verifiedByAdminId" TEXT,
ADD COLUMN "verifiedAt" TIMESTAMP(3),
ADD COLUMN "idCardGeneratedAt" TIMESTAMP(3);

CREATE INDEX "KaryakartaApplication_uploadStatus_idx" ON "KaryakartaApplication"("uploadStatus");

ALTER TABLE "KaryakartaApplication" ADD CONSTRAINT "KaryakartaApplication_verifiedByAdminId_fkey"
FOREIGN KEY ("verifiedByAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "IDCardTemplate" (
    "id" TEXT NOT NULL,
    "templatePath" TEXT NOT NULL,
    "uploadedByAdminId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "IDCardTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "IDCardTemplate_isActive_idx" ON "IDCardTemplate"("isActive");
CREATE INDEX "IDCardTemplate_uploadedAt_idx" ON "IDCardTemplate"("uploadedAt");
CREATE UNIQUE INDEX "IDCardTemplate_one_active_key" ON "IDCardTemplate"("isActive") WHERE "isActive" = true;

ALTER TABLE "IDCardTemplate" ADD CONSTRAINT "IDCardTemplate_uploadedByAdminId_fkey"
FOREIGN KEY ("uploadedByAdminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
