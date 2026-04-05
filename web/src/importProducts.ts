// import "dotenv/config";
// import prisma from "@/prisma";
// import { Prisma } from "@/src/generated/prisma";
// import productsJson from "../../products.json";

// type ProductTranslation = {
//   title?: string;
//   description?: string;
// };

// type ProductSeed = {
//   id: string;
//   categoryId: string | null;
//   comparedAtPrice: number | null;
//   createdAt?: string;
//   description: string | null;
//   name: string;
//   price: number | null;
//   translations?: Record<string, ProductTranslation> | null;
// };

// type UpdateProductsResult = {
//   created: number;
//   total: number;
//   updated: number;
// };

// function toPrismaTranslations(
//   translations?: Record<string, ProductTranslation> | null,
// ): Prisma.InputJsonObject | typeof Prisma.JsonNull {
//   if (!translations) return Prisma.JsonNull;

//   const entries = Object.entries(translations).map(([locale, value]) => [
//     locale,
//     {
//       ...(value.title ? { title: value.title } : {}),
//       ...(value.description ? { description: value.description } : {}),
//     },
//   ]);

//   return Object.fromEntries(entries) as Prisma.InputJsonObject;
// }

// async function upsertProduct(product: ProductSeed): Promise<"created" | "updated"> {
//   const existingProduct = await prisma.product.findUnique({
//     where: {
//       id: product.id,
//     },
//     select: {
//       id: true,
//     },
//   });

//   await prisma.product.upsert({
//     where: {
//       id: product.id,
//     },
//     update: {
//       name: product.name,
//       description: product.description,
//       translations: toPrismaTranslations(product.translations),
//     },
//     create: {
//       id: product.id,
//       name: product.name,
//       description: product.description,
//       translations: toPrismaTranslations(product.translations),
//       categoryId: product.categoryId,
//       price: product.price,
//       comparedAtPrice: product.comparedAtPrice,
//       ...(product.createdAt
//         ? {
//             createdAt: new Date(product.createdAt),
//           }
//         : {}),
//     },
//   });

//   return existingProduct ? "updated" : "created";
// }

// export async function updateProductsFromJson(): Promise<UpdateProductsResult> {
//   const products = productsJson as ProductSeed[];

//   let created = 0;
//   let updated = 0;

//   for (const product of products) {
//     const result = await upsertProduct(product);

//     if (result === "created") {
//       created += 1;
//     } else {
//       updated += 1;
//     }
//   }

//   return {
//     created,
//     total: products.length,
//     updated,
//   };
// }

// async function main() {
//   const result = await updateProductsFromJson();

//   console.log(
//     `Products synced: ${result.total} total, ${result.updated} updated, ${result.created} created`,
//   );
// }

// void main()
//   .catch((error: unknown) => {
//     console.error("Failed to sync products from products.json", error);
//     process.exitCode = 1;
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
