import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "@/prisma";
import { Prisma } from "@/src/generated/prisma";

const DEFAULT_MODIFIER_GROUP_ID = "e0c99e65-79a6-4e51-9bac-fe76808ba18e";

type ProductTranslation = {
  title?: string;
  description?: string;
};

type ProductWithPhoto = {
  id: string;
  name: string;
  description: string | null;
  translations: Prisma.JsonValue | null;
  photos: {
    id: string;
    createdAt: Date;
  }[];
};

type SyncPizzaFlavorsResult = {
  created: number;
  modifierGroupId: string;
  skippedNoPhoto: number;
  totalPizzaProducts: number;
  updated: number;
};

function isPizzaFlavor(product: ProductWithPhoto): boolean {
  const translatedTitles =
    product.translations &&
    typeof product.translations === "object"
      ? Object.values(product.translations as Record<string, ProductTranslation>)
          .map((translation) => translation?.title)
          .filter((title): title is string => typeof title === "string")
      : [];

  const candidates = [product.name, ...translatedTitles]
    .join(" ")
    .toLowerCase();

  return candidates.includes("pizza");
}

function toModifierTranslations(
  translations: Prisma.JsonValue | null,
  fallbackTitle: string,
  fallbackDescription: string | null,
): Prisma.InputJsonObject | typeof Prisma.JsonNull {
  if (!translations || typeof translations !== "object") {
    return Prisma.JsonNull;
  }

  const entries = Object.entries(
    translations as Record<string, ProductTranslation>,
  ).map(([locale, value]) => [
    locale,
    {
      title: value?.title ?? fallbackTitle,
      ...(value?.description || fallbackDescription
        ? { description: value?.description ?? fallbackDescription ?? undefined }
        : {}),
    },
  ]);

  if (entries.length === 0) {
    return Prisma.JsonNull;
  }

  return Object.fromEntries(entries) as Prisma.InputJsonObject;
}

export async function createPizzaFlavorsModifierItems(
  modifierGroupId = DEFAULT_MODIFIER_GROUP_ID,
): Promise<SyncPizzaFlavorsResult> {
  const modifierGroup = await prisma.modifierGroup.findUnique({
    where: {
      id: modifierGroupId,
    },
    select: {
      id: true,
    },
  });

  if (!modifierGroup) {
    throw new Error(`MODIFIER_GROUP_NOT_FOUND:${modifierGroupId}`);
  }

  const products = (await prisma.product.findMany({
    include: {
      photos: {
        select: {
          id: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  })) as ProductWithPhoto[];

  const pizzaProducts = products.filter(isPizzaFlavor);

  let created = 0;
  let skippedNoPhoto = 0;
  let updated = 0;

  for (const pizza of pizzaProducts) {
    const primaryPhoto = pizza.photos[0];

    if (!primaryPhoto) {
      skippedNoPhoto += 1;
      continue;
    }

    const modifierItemId = `pizza-flavor-${pizza.id}`;
    const existingModifierItem = await prisma.modifierGroupItem.findUnique({
      where: {
        id: modifierItemId,
      },
      select: {
        id: true,
      },
    });

    await prisma.modifierGroupItem.upsert({
      where: {
        id: modifierItemId,
      },
      update: {
        name: pizza.name,
        description: pizza.description ?? undefined,
        price: 0,
        modifierGroupId,
        fileId: primaryPhoto.id,
        translations: toModifierTranslations(
          pizza.translations,
          pizza.name,
          pizza.description,
        ),
      },
      create: {
        id: modifierItemId,
        name: pizza.name,
        description: pizza.description ?? undefined,
        price: 0,
        modifierGroupId,
        fileId: primaryPhoto.id,
        translations: toModifierTranslations(
          pizza.translations,
          pizza.name,
          pizza.description,
        ),
      },
    });

    if (existingModifierItem) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  return {
    created,
    modifierGroupId,
    skippedNoPhoto,
    totalPizzaProducts: pizzaProducts.length,
    updated,
  };
}

async function main() {
  const result = await createPizzaFlavorsModifierItems();

  console.log(
    `Pizza flavors synced to modifier group ${result.modifierGroupId}: ${result.totalPizzaProducts} total pizzas, ${result.updated} updated, ${result.created} created, ${result.skippedNoPhoto} skipped without photo`,
  );
}

const isRunningDirectly =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isRunningDirectly) {
  void main()
    .catch((error: unknown) => {
      console.error("Failed to create pizza flavor modifier items", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
