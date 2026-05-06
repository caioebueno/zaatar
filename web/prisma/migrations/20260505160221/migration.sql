-- CreateTable
CREATE TABLE "FeedbackSettings" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "rewardProductId" TEXT,
    "rewardQuantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "FeedbackSettings_pkey" PRIMARY KEY ("id")
);
