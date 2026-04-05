import "dotenv/config";
import prisma from "@/prisma";
import productsJson from "../../products.json";

type ProductTranslation = {
  title?: string;
  description?: string;
};

type ProductSeed = {
  id: string;
  name: string;
  translations?: Record<string, ProductTranslation> | null;
};

type CreatePreparationStepsResult = {
  created: number;
  skipped: number;
  stationId: string;
  total: number;
  updated: number;
};

function isPizzaOrSfiha(product: ProductSeed): boolean {
  const candidates = [
    product.name,
    product.translations?.pt?.title,
    product.translations?.es?.title,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    candidates.includes("pizza") ||
    candidates.includes("sfiha") ||
    candidates.includes("esfiha")
  );
}

function buildPreparationStepName(product: ProductSeed): string {
  const localizedName = product.translations?.pt?.title ?? product.name;

  return `Rechear ${localizedName}`;
}

async function resolveStationId(explicitStationId?: string): Promise<string> {
  if (explicitStationId) return explicitStationId;

  const stations = await prisma.station.findMany({
    select: {
      id: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  if (stations.length === 0) {
    throw new Error("NO_STATION_FOUND");
  }

  if (stations.length > 1) {
    throw new Error("MULTIPLE_STATIONS_FOUND_PLEASE_PROVIDE_STATION_ID");
  }

  return stations[0].id;
}

export async function createPizzaAndSfihaPreparationSteps(
  explicitStationId?: string,
): Promise<CreatePreparationStepsResult> {
  const stationId = await resolveStationId(explicitStationId);
  const seededProducts = (productsJson as ProductSeed[]).filter(isPizzaOrSfiha);

  const existingProducts = await prisma.product.findMany({
    where: {
      id: {
        in: seededProducts.map((product) => product.id),
      },
    },
    select: {
      id: true,
    },
  });

  const existingProductIds = new Set(existingProducts.map((product) => product.id));

  let created = 0;
  let skipped = 0;
  let updated = 0;

  for (const product of seededProducts) {
    if (!existingProductIds.has(product.id)) {
      skipped += 1;
      continue;
    }

    const preparationStepId = `prep-fill-${product.id}`;
    const existingPreparationStep = await prisma.preparationStep.findUnique({
      where: {
        id: preparationStepId,
      },
      select: {
        id: true,
      },
    });

    await prisma.preparationStep.upsert({
      where: {
        id: preparationStepId,
      },
      update: {
        name: buildPreparationStepName(product),
        includeComments: true,
        includeModifiers: true,
        stationId,
        products: {
          connect: {
            id: product.id,
          },
        },
      },
      create: {
        id: preparationStepId,
        name: buildPreparationStepName(product),
        includeComments: true,
        includeModifiers: true,
        stationId,
        products: {
          connect: {
            id: product.id,
          },
        },
      },
    });

    if (existingPreparationStep) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  return {
    created,
    skipped,
    stationId,
    total: seededProducts.length,
    updated,
  };
}

async function main() {
  const result = await createPizzaAndSfihaPreparationSteps('2a18e3a7-2491-422a-af43-efff08031e9b');

  console.log(
    `Preparation steps synced: ${result.total} total, ${result.updated} updated, ${result.created} created, ${result.skipped} skipped, station ${result.stationId}`,
  );
}

void main()
  .catch((error: unknown) => {
    console.error("Failed to create pizza and sfiha preparation steps", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
