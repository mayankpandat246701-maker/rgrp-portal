CREATE TYPE "KaryakartaApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'BLOCKED');

CREATE TABLE "KaryakartaApplication" (
    "id" TEXT NOT NULL,
    "applicationReference" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "fatherName" TEXT NOT NULL,
    "motherName" TEXT NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "gender" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "alternateMobile" TEXT,
    "email" TEXT,
    "address" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "constituency" TEXT NOT NULL,
    "education" TEXT NOT NULL,
    "occupation" TEXT NOT NULL,
    "organizationName" TEXT,
    "designation" TEXT,
    "joiningReason" TEXT,
    "socialMediaLinks" TEXT,
    "referenceBy" TEXT,
    "status" "KaryakartaApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryakartaApplication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "KaryakartaApplication_applicationReference_key" ON "KaryakartaApplication"("applicationReference");
CREATE INDEX "KaryakartaApplication_status_idx" ON "KaryakartaApplication"("status");
CREATE INDEX "KaryakartaApplication_createdAt_idx" ON "KaryakartaApplication"("createdAt");
CREATE INDEX "KaryakartaApplication_mobile_idx" ON "KaryakartaApplication"("mobile");
