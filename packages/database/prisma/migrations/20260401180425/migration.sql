-- AlterTable
ALTER TABLE "PreparationStepTrack" ADD COLUMN     "comments" TEXT;

-- CreateTable
CREATE TABLE "PreparationStepModifierTrack" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "modifierGroupItemId" TEXT NOT NULL,
    "preparationStepTrackId" TEXT NOT NULL,

    CONSTRAINT "PreparationStepModifierTrack_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PreparationStepModifierTrack" ADD CONSTRAINT "PreparationStepModifierTrack_modifierGroupItemId_fkey" FOREIGN KEY ("modifierGroupItemId") REFERENCES "ModifierGroupItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreparationStepModifierTrack" ADD CONSTRAINT "PreparationStepModifierTrack_preparationStepTrackId_fkey" FOREIGN KEY ("preparationStepTrackId") REFERENCES "PreparationStepTrack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
