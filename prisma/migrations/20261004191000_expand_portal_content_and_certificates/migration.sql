CREATE TYPE "JoiningCertificateStatus" AS ENUM (
    'ACTIVE',
    'REVOKED',
    'SUPERSEDED'
);

ALTER TABLE "Karyakarta"
ADD COLUMN "appointmentStartDate" TIMESTAMP(3),
ADD COLUMN "appointmentEndDate" TIMESTAMP(3),
ADD COLUMN "appointmentDocumentPath" TEXT,
ADD COLUMN "isEmergencyHidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Karyakarta_isEmergencyHidden_profileStatus_isPublicProfile_idx"
ON "Karyakarta"("isEmergencyHidden", "profileStatus", "isPublicProfile");
CREATE INDEX "Karyakarta_isFeatured_displayOrder_idx"
ON "Karyakarta"("isFeatured", "displayOrder");

CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "logoStorageKey" TEXT,
    "logoMimeType" TEXT,
    "faviconStorageKey" TEXT,
    "ogImageStorageKey" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SiteSettings_updatedAt_idx" ON "SiteSettings"("updatedAt");
ALTER TABLE "SiteSettings"
ADD CONSTRAINT "SiteSettings_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "NewsPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortSummary" TEXT NOT NULL,
    "fullContent" TEXT NOT NULL,
    "coverImageStorageKey" TEXT,
    "coverImageAltHindi" TEXT,
    "category" TEXT NOT NULL,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "state" TEXT,
    "district" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "homepageDisplayOrder" INTEGER,
    "scheduledPublishAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NewsPost_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NewsPost_slug_key" ON "NewsPost"("slug");
CREATE INDEX "NewsPost_isPublished_archivedAt_scheduledPublishAt_expiresAt_idx"
ON "NewsPost"("isPublished", "archivedAt", "scheduledPublishAt", "expiresAt");
CREATE INDEX "NewsPost_isFeatured_homepageDisplayOrder_publishedAt_idx"
ON "NewsPost"("isFeatured", "homepageDisplayOrder", "publishedAt");
CREATE INDEX "NewsPost_state_district_idx" ON "NewsPost"("state", "district");
CREATE INDEX "NewsPost_publishedAt_idx" ON "NewsPost"("publishedAt");
CREATE INDEX "NewsPost_expiresAt_idx" ON "NewsPost"("expiresAt");
ALTER TABLE "NewsPost"
ADD CONSTRAINT "NewsPost_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "GroundActivity" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortSummary" TEXT NOT NULL,
    "fullDescription" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "coverImageStorageKey" TEXT,
    "coverImageAltHindi" TEXT,
    "activityDate" TIMESTAMP(3) NOT NULL,
    "state" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "tehsilOrBlock" TEXT,
    "cityOrVillage" TEXT,
    "publicLocationLabel" TEXT,
    "exactLocationPublic" BOOLEAN NOT NULL DEFAULT false,
    "mapLink" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeaturedOnHomepage" BOOLEAN NOT NULL DEFAULT false,
    "homepageDisplayOrder" INTEGER,
    "scheduledPublishAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GroundActivity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GroundActivity_slug_key" ON "GroundActivity"("slug");
CREATE INDEX "GroundActivity_isPublished_archivedAt_scheduledPublishAt_expiresAt_idx"
ON "GroundActivity"("isPublished", "archivedAt", "scheduledPublishAt", "expiresAt");
CREATE INDEX "GroundActivity_isFeaturedOnHomepage_homepageDisplayOrder_publishedAt_idx"
ON "GroundActivity"("isFeaturedOnHomepage", "homepageDisplayOrder", "publishedAt");
CREATE INDEX "GroundActivity_state_district_idx" ON "GroundActivity"("state", "district");
CREATE INDEX "GroundActivity_activityDate_idx" ON "GroundActivity"("activityDate");
CREATE INDEX "GroundActivity_expiresAt_idx" ON "GroundActivity"("expiresAt");
ALTER TABLE "GroundActivity"
ADD CONSTRAINT "GroundActivity_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "GroundActivityImage" (
    "id" TEXT NOT NULL,
    "groundActivityId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "altTextHindi" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GroundActivityImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GroundActivityImage_groundActivityId_isPublic_displayOrder_idx"
ON "GroundActivityImage"("groundActivityId", "isPublic", "displayOrder");
ALTER TABLE "GroundActivityImage"
ADD CONSTRAINT "GroundActivityImage_groundActivityId_fkey"
FOREIGN KEY ("groundActivityId") REFERENCES "GroundActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "JoiningCertificate" (
    "id" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "karyakartaId" TEXT NOT NULL,
    "registrationCardId" TEXT NOT NULL,
    "status" "JoiningCertificateStatus" NOT NULL DEFAULT 'ACTIVE',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedByAdminId" TEXT,
    "templateVersion" TEXT NOT NULL DEFAULT '1',
    "fileStorageKey" TEXT NOT NULL,
    "reissuedFromId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedReasonAdminOnly" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JoiningCertificate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "JoiningCertificate_certificateNumber_key"
ON "JoiningCertificate"("certificateNumber");
CREATE INDEX "JoiningCertificate_karyakartaId_status_idx"
ON "JoiningCertificate"("karyakartaId", "status");
CREATE INDEX "JoiningCertificate_registrationCardId_status_idx"
ON "JoiningCertificate"("registrationCardId", "status");
CREATE INDEX "JoiningCertificate_generatedByAdminId_idx"
ON "JoiningCertificate"("generatedByAdminId");
CREATE INDEX "JoiningCertificate_reissuedFromId_idx"
ON "JoiningCertificate"("reissuedFromId");
CREATE INDEX "JoiningCertificate_issueDate_idx" ON "JoiningCertificate"("issueDate");

CREATE TABLE "CertificateVerificationLog" (
    "id" TEXT NOT NULL,
    "certificateHash" TEXT NOT NULL,
    "resultType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificateVerificationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CertificateVerificationLog_certificateHash_createdAt_idx" ON "CertificateVerificationLog"("certificateHash", "createdAt");
CREATE INDEX "CertificateVerificationLog_createdAt_idx" ON "CertificateVerificationLog"("createdAt");
ALTER TABLE "JoiningCertificate"
ADD CONSTRAINT "JoiningCertificate_karyakartaId_fkey"
FOREIGN KEY ("karyakartaId") REFERENCES "Karyakarta"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "JoiningCertificate_registrationCardId_fkey"
FOREIGN KEY ("registrationCardId") REFERENCES "RegistrationCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "JoiningCertificate_generatedByAdminId_fkey"
FOREIGN KEY ("generatedByAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT "JoiningCertificate_reissuedFromId_fkey"
FOREIGN KEY ("reissuedFromId") REFERENCES "JoiningCertificate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
