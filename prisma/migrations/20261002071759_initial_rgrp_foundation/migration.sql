-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'NATIONAL_ADMIN', 'CONTENT_ADMIN', 'VIEWER');

-- CreateEnum
CREATE TYPE "KaryakartaStatus" AS ENUM ('PENDING', 'APPROVED', 'BLOCKED', 'REJECTED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "NoticeStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'SUPER_ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Karyakarta" (
    "id" TEXT NOT NULL,
    "regNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "designation" TEXT,
    "state" TEXT,
    "zone" TEXT,
    "district" TEXT,
    "photoUrl" TEXT,
    "status" "KaryakartaStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Karyakarta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notice" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "status" "NoticeStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteContent" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminActivity" (
    "id" TEXT NOT NULL,
    "adminId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Karyakarta_regNo_key" ON "Karyakarta"("regNo");

-- CreateIndex
CREATE UNIQUE INDEX "Karyakarta_phone_key" ON "Karyakarta"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Karyakarta_email_key" ON "Karyakarta"("email");

-- CreateIndex
CREATE INDEX "Karyakarta_regNo_idx" ON "Karyakarta"("regNo");

-- CreateIndex
CREATE INDEX "Karyakarta_phone_idx" ON "Karyakarta"("phone");

-- CreateIndex
CREATE INDEX "Karyakarta_email_idx" ON "Karyakarta"("email");

-- CreateIndex
CREATE INDEX "Karyakarta_status_idx" ON "Karyakarta"("status");

-- CreateIndex
CREATE INDEX "Karyakarta_state_idx" ON "Karyakarta"("state");

-- CreateIndex
CREATE INDEX "Karyakarta_zone_idx" ON "Karyakarta"("zone");

-- CreateIndex
CREATE INDEX "Karyakarta_district_idx" ON "Karyakarta"("district");

-- CreateIndex
CREATE INDEX "Karyakarta_createdAt_idx" ON "Karyakarta"("createdAt");

-- CreateIndex
CREATE INDEX "Notice_status_idx" ON "Notice"("status");

-- CreateIndex
CREATE INDEX "Notice_publishedAt_idx" ON "Notice"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SiteContent_key_key" ON "SiteContent"("key");

-- CreateIndex
CREATE INDEX "AdminActivity_adminId_idx" ON "AdminActivity"("adminId");

-- CreateIndex
CREATE INDEX "AdminActivity_createdAt_idx" ON "AdminActivity"("createdAt");

-- AddForeignKey
ALTER TABLE "AdminActivity" ADD CONSTRAINT "AdminActivity_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
