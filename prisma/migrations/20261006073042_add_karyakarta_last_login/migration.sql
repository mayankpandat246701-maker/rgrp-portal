-- AlterTable
ALTER TABLE "Karyakarta" ADD COLUMN     "lastLoginAt" TIMESTAMP(3);

-- RenameIndex
ALTER INDEX "GroundActivity_isFeaturedOnHomepage_homepageDisplayOrder_publis" RENAME TO "GroundActivity_isFeaturedOnHomepage_homepageDisplayOrder_pu_idx";

-- RenameIndex
ALTER INDEX "GroundActivity_isPublished_archivedAt_scheduledPublishAt_expire" RENAME TO "GroundActivity_isPublished_archivedAt_scheduledPublishAt_ex_idx";

-- RenameIndex
ALTER INDEX "NewsPost_isPublished_archivedAt_scheduledPublishAt_expiresAt_id" RENAME TO "NewsPost_isPublished_archivedAt_scheduledPublishAt_expiresA_idx";

-- RenameIndex
ALTER INDEX "OfficialSocialLink_isPublic_isActive_visibility_displayOrder_id" RENAME TO "OfficialSocialLink_isPublic_isActive_visibility_displayOrde_idx";
