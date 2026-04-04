-- AlterTable
ALTER TABLE "PreparationStep" ADD COLUMN     "includeComments" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "includeModifiers" BOOLEAN NOT NULL DEFAULT false;
