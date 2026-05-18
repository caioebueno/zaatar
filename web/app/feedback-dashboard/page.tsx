// import prisma from "@/prisma";
// import FeedbackSettingsManager from "@/app/components/FeedbackSettingsManager";
// import type { ProductItemType } from "@/src/generated/prisma";

// type ProductOption = {
//   id: string;
//   name: string;
//   itemType: ProductItemType;
//   visible: boolean;
// };

// type FeedbackSettingsRecord = {
//   id: string;
//   createdAt: string;
//   updatedAt: string;
//   active: boolean;
//   rewardProductId: string | null;
//   rewardQuantity: number;
// };

// const DEFAULT_SETTINGS_ID = "default";

// async function getInitialSettings(): Promise<FeedbackSettingsRecord> {
//   await prisma.$executeRaw`
//     INSERT INTO "FeedbackSettings" ("id", "createdAt", "updatedAt", "active", "rewardProductId", "rewardQuantity")
//     VALUES (${DEFAULT_SETTINGS_ID}, NOW(), NOW(), true, NULL, 1)
//     ON CONFLICT ("id") DO NOTHING
//   `;

//   const rows = await prisma.$queryRaw<
//     Array<{
//       id: string;
//       createdAt: Date;
//       updatedAt: Date;
//       active: boolean;
//       rewardProductId: string | null;
//       rewardQuantity: number;
//     }>
//   >`
//     SELECT
//       "id",
//       "createdAt",
//       "updatedAt",
//       "active",
//       "rewardProductId",
//       "rewardQuantity"
//     FROM "FeedbackSettings"
//     WHERE "id" = ${DEFAULT_SETTINGS_ID}
//     LIMIT 1
//   `;

//   const settings = rows[0];

//   return {
//     id: settings.id,
//     createdAt: settings.createdAt.toISOString(),
//     updatedAt: settings.updatedAt.toISOString(),
//     active: settings.active,
//     rewardProductId: settings.rewardProductId,
//     rewardQuantity: settings.rewardQuantity,
//   };
// }

// export default async function FeedbackDashboardPage() {
//   const [settings, products] = await Promise.all([
//     getInitialSettings(),
//     prisma.product.findMany({
//       select: {
//         id: true,
//         name: true,
//         itemType: true,
//         visible: true,
//       },
//       orderBy: [{ name: "asc" }, { createdAt: "asc" }],
//     }),
//   ]);

//   const productOptions: ProductOption[] = products.map((product) => ({
//     id: product.id,
//     name: product.name,
//     itemType: product.itemType,
//     visible: product.visible,
//   }));

//   return <FeedbackSettingsManager products={productOptions} initialSettings={settings} />;
// }
export default function Page() {
  return (
    <div></div>
  )
}