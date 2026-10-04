DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Karyakarta"
    WHERE "regNo" IS NOT NULL
      AND regexp_replace("regNo", '[[:space:]]', '', 'g') <> ''
    GROUP BY "regNo"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot migrate Karyakarta records: duplicate nonblank regNo values exist; review the documented preflight query.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Karyakarta" AS missing
    JOIN "Karyakarta" AS existing
      ON existing."regNo" = (
        'LEGACY-MISSING-' || encode(convert_to(missing."id", 'UTF8'), 'hex')
      )
    WHERE missing."regNo" IS NULL
       OR regexp_replace(missing."regNo", '[[:space:]]', '', 'g') = ''
  ) THEN
    RAISE EXCEPTION
      'Cannot migrate Karyakarta records: a legacy registration number conflicts with a generated missing-number placeholder.';
  END IF;
END $$;

ALTER TYPE "AdminRole" ADD VALUE 'STATE_ADMIN';
ALTER TYPE "AdminRole" ADD VALUE 'DISTRICT_ADMIN';
ALTER TYPE "AdminRole" ADD VALUE 'CONTENT_EDITOR';

CREATE TYPE "KaryakartaProfileStatus" AS ENUM (
    'DRAFT',
    'PENDING',
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'REVOKED',
    'REJECTED',
    'EXPIRED',
    'ARCHIVED'
);

CREATE TYPE "RegistrationCardStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'INACTIVE',
    'EXPIRED',
    'SUSPENDED',
    'REVOKED',
    'REISSUED'
);

CREATE TYPE "OfficialLinkLevel" AS ENUM ('NATIONAL', 'STATE', 'DISTRICT');
CREATE TYPE "OfficialLinkVisibility" AS ENUM ('PUBLIC', 'MEMBERS_ONLY', 'HIDDEN');

ALTER TABLE "Admin"
ADD COLUMN "assignedState" TEXT,
ADD COLUMN "assignedDistrict" TEXT;

ALTER TABLE "Karyakarta"
ADD COLUMN "slug" TEXT NOT NULL DEFAULT '',
ADD COLUMN "daitva" TEXT,
ADD COLUMN "tehsil" TEXT,
ADD COLUMN "cityOrVillage" TEXT,
ADD COLUMN "profilePhotoPath" TEXT,
ADD COLUMN "publicBio" TEXT,
ADD COLUMN "joiningDate" TIMESTAMP(3),
ADD COLUMN "isPublicProfile" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "profileStatus" "KaryakartaProfileStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "instagramUrl" TEXT,
ADD COLUMN "facebookUrl" TEXT,
ADD COLUMN "youtubeUrl" TEXT,
ADD COLUMN "whatsappContactUrl" TEXT,
ADD COLUMN "adminNotes" TEXT,
ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "createdById" TEXT,
ADD COLUMN "updatedById" TEXT;

UPDATE "Karyakarta"
SET
  "slug" = COALESCE(
    NULLIF(
      trim(both '-' from regexp_replace(lower("regNo"), '[^a-z0-9]+', '-', 'g')),
      ''
    ),
    'karyakarta'
  ) || '-' || encode(convert_to("id", 'UTF8'), 'hex'),
  "daitva" = "designation",
  "profileStatus" = CASE
    WHEN "status" = 'APPROVED' THEN 'ACTIVE'::"KaryakartaProfileStatus"
    WHEN "status" = 'BLOCKED' THEN 'SUSPENDED'::"KaryakartaProfileStatus"
    WHEN "status" = 'INACTIVE' THEN 'INACTIVE'::"KaryakartaProfileStatus"
    WHEN "status" = 'REJECTED' THEN 'REJECTED'::"KaryakartaProfileStatus"
    ELSE 'PENDING'::"KaryakartaProfileStatus"
  END;

CREATE UNIQUE INDEX "Karyakarta_slug_key" ON "Karyakarta"("slug");
CREATE INDEX "Karyakarta_profileStatus_isPublicProfile_idx" ON "Karyakarta"("profileStatus", "isPublicProfile");
CREATE INDEX "Karyakarta_state_district_idx" ON "Karyakarta"("state", "district");
CREATE INDEX "Karyakarta_displayOrder_idx" ON "Karyakarta"("displayOrder");

ALTER TABLE "Karyakarta"
ADD CONSTRAINT "Karyakarta_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT "Karyakarta_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LeadershipMessage"
ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "showOnHomepage" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "state" TEXT,
ADD COLUMN "district" TEXT;

UPDATE "LeadershipMessage" SET "displayOrder" = "sortOrder";
CREATE INDEX "LeadershipMessage_isPublished_showOnHomepage_displayOrder_idx"
ON "LeadershipMessage"("isPublished", "showOnHomepage", "displayOrder");

CREATE TABLE "RegistrationCard" (
    "id" TEXT NOT NULL,
    "karyakartaId" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "status" "RegistrationCardStatus" NOT NULL DEFAULT 'PENDING',
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "revokedReason" TEXT,
    "reissuedFromId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RegistrationCard_pkey" PRIMARY KEY ("id")
);

INSERT INTO "RegistrationCard" (
  "id", "karyakartaId", "registrationNumber", "status", "createdAt", "updatedAt"
)
SELECT
  'legacy-' || "id",
  "id",
  CASE
    WHEN "regNo" IS NULL OR regexp_replace("regNo", '[[:space:]]', '', 'g') = ''
      THEN 'LEGACY-MISSING-' || encode(convert_to("id", 'UTF8'), 'hex')
    ELSE "regNo"
  END,
  CASE
    WHEN "regNo" IS NULL OR regexp_replace("regNo", '[[:space:]]', '', 'g') = '' THEN 'PENDING'::"RegistrationCardStatus"
    WHEN "status" = 'APPROVED' THEN 'ACTIVE'::"RegistrationCardStatus"
    WHEN "status" = 'BLOCKED' THEN 'SUSPENDED'::"RegistrationCardStatus"
    WHEN "status" = 'INACTIVE' THEN 'INACTIVE'::"RegistrationCardStatus"
    ELSE 'PENDING'::"RegistrationCardStatus"
  END,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Karyakarta";

CREATE UNIQUE INDEX "RegistrationCard_registrationNumber_key" ON "RegistrationCard"("registrationNumber");
CREATE INDEX "RegistrationCard_karyakartaId_status_idx" ON "RegistrationCard"("karyakartaId", "status");
CREATE INDEX "RegistrationCard_expiryDate_idx" ON "RegistrationCard"("expiryDate");
CREATE UNIQUE INDEX "RegistrationCard_one_active_per_karyakarta_key"
ON "RegistrationCard"("karyakartaId") WHERE "status" = 'ACTIVE';

ALTER TABLE "RegistrationCard"
ADD CONSTRAINT "RegistrationCard_karyakartaId_fkey"
FOREIGN KEY ("karyakartaId") REFERENCES "Karyakarta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "OfficialSocialLink" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "level" "OfficialLinkLevel" NOT NULL,
    "state" TEXT,
    "district" TEXT,
    "description" TEXT,
    "contactPersonName" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "visibility" "OfficialLinkVisibility" NOT NULL DEFAULT 'PUBLIC',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OfficialSocialLink_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OfficialSocialLink_level_state_district_idx" ON "OfficialSocialLink"("level", "state", "district");
CREATE INDEX "OfficialSocialLink_isPublic_isActive_visibility_displayOrder_idx"
ON "OfficialSocialLink"("isPublic", "isActive", "visibility", "displayOrder");

CREATE TABLE "RegistrationVerificationLog" (
    "id" TEXT NOT NULL,
    "registrationHash" TEXT NOT NULL,
    "resultType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegistrationVerificationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RegistrationVerificationLog_registrationHash_createdAt_idx"
ON "RegistrationVerificationLog"("registrationHash", "createdAt");
CREATE INDEX "RegistrationVerificationLog_createdAt_idx"
ON "RegistrationVerificationLog"("createdAt");
