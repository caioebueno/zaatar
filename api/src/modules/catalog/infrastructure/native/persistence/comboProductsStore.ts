import { Prisma } from "../../../../../../../web/src/generated/prisma/index.js";

type QueryDbLike = {
  $executeRawUnsafe: (query: string) => Prisma.PrismaPromise<number>;
  $queryRaw: <T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: unknown[]) => Prisma.PrismaPromise<T>;
};

type QueryOnlyDbLike = {
  $queryRaw: <T = unknown>(
    query: TemplateStringsArray | Prisma.Sql,
    ...values: unknown[]
  ) => Prisma.PrismaPromise<T>;
};

export type ComboProductInput = {
  productId: string;
  quantity: number;
  sortIndex?: number | null;
};

export type ComboProductRow = {
  comboId: string;
  productId: string;
  quantity: number;
  sortIndex: number | null;
  productName: string;
  productTranslations: Prisma.JsonValue | null;
};

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS "ComboProductItem" (
  "comboId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "sortIndex" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ComboProductItem_pkey" PRIMARY KEY ("comboId", "productId"),
  CONSTRAINT "ComboProductItem_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ComboProductItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ComboProductItem_comboId_sortIndex_idx" ON "ComboProductItem"("comboId", "sortIndex");
CREATE INDEX IF NOT EXISTS "ComboProductItem_productId_idx" ON "ComboProductItem"("productId");
`;

export async function ensureComboProductItemTable(db: QueryDbLike): Promise<void> {
  await db.$executeRawUnsafe(CREATE_TABLE_SQL);
}

export async function replaceComboProducts(
  db: QueryOnlyDbLike,
  comboId: string,
  products: ComboProductInput[],
): Promise<void> {
  await db.$queryRaw`
    DELETE FROM "ComboProductItem"
    WHERE "comboId" = ${comboId}
  `;

  if (products.length === 0) return;

  const values = products.map((item, index) =>
    Prisma.sql`(${comboId}, ${item.productId}, ${item.quantity}, ${item.sortIndex ?? index + 1})`,
  );

  await db.$queryRaw`
    INSERT INTO "ComboProductItem" ("comboId", "productId", "quantity", "sortIndex")
    VALUES ${Prisma.join(values)}
  `;
}

export async function getComboProductsByComboIds(
  db: QueryOnlyDbLike,
  comboIds: string[],
): Promise<ComboProductRow[]> {
  if (comboIds.length === 0) return [];

  return db.$queryRaw<ComboProductRow[]>`
    SELECT
      cpi."comboId" AS "comboId",
      cpi."productId" AS "productId",
      cpi."quantity" AS "quantity",
      cpi."sortIndex" AS "sortIndex",
      p."name" AS "productName",
      p."translations" AS "productTranslations"
    FROM "ComboProductItem" cpi
    INNER JOIN "Product" p ON p."id" = cpi."productId"
    WHERE cpi."comboId" IN (${Prisma.join(comboIds)})
    ORDER BY
      cpi."comboId" ASC,
      COALESCE(cpi."sortIndex", 2147483647) ASC,
      cpi."createdAt" ASC
  `;
}
