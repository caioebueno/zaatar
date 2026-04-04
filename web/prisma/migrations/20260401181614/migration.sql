-- AlterTable
ALTER TABLE "OrderProducts" ADD COLUMN     "comments" TEXT;

-- CreateTable
CREATE TABLE "_ModifierGroupItemToOrderProducts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ModifierGroupItemToOrderProducts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ModifierGroupItemToOrderProducts_B_index" ON "_ModifierGroupItemToOrderProducts"("B");

-- AddForeignKey
ALTER TABLE "_ModifierGroupItemToOrderProducts" ADD CONSTRAINT "_ModifierGroupItemToOrderProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "ModifierGroupItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModifierGroupItemToOrderProducts" ADD CONSTRAINT "_ModifierGroupItemToOrderProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "OrderProducts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
