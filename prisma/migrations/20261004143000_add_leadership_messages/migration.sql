CREATE TABLE "LeadershipMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "portraitUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadershipMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LeadershipMessage_isPublished_sortOrder_idx"
ON "LeadershipMessage"("isPublished", "sortOrder");
