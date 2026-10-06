-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminAuditAction" ADD VALUE 'ID_CARD_GENERATED';
ALTER TYPE "AdminAuditAction" ADD VALUE 'ID_CARD_DOWNLOADED';

-- AlterTable
ALTER TABLE "AdminAuditLog" ADD COLUMN     "karyakartaId" TEXT;

-- CreateIndex
CREATE INDEX "AdminAuditLog_karyakartaId_idx" ON "AdminAuditLog"("karyakartaId");
