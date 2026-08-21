import { ensureEnvLoaded } from "./src/shared/env/loadEnv.js";
import { HttpSquareCatalogGateway } from "./src/modules/integrations/infrastructure/http/HttpSquareCatalogGateway.js";
import { HttpSquareOrdersGateway } from "./src/modules/integrations/infrastructure/http/HttpSquareOrdersGateway.js";
import { ArchiveSquareCatalogTestDataUseCase } from "./src/modules/integrations/application/use-cases/ArchiveSquareCatalogTestDataUseCase.js";
import { ClearSquareCatalogMappingsUseCase } from "./src/modules/integrations/application/use-cases/ClearSquareCatalogMappingsUseCase.js";
import { CreateSquareOrderFromFoodyOrderUseCase } from "./src/modules/integrations/application/use-cases/CreateSquareOrderFromFoodyOrderUseCase.js";
import { GetSquareOrderUseCase } from "./src/modules/integrations/application/use-cases/GetSquareOrderUseCase.js";
import { ListSquareLocationsUseCase } from "./src/modules/integrations/application/use-cases/ListSquareLocationsUseCase.js";
import { ProcessSquareCatalogSyncTasksUseCase } from "./src/modules/integrations/application/use-cases/ProcessSquareCatalogSyncTasksUseCase.js";
import { PublishSquareMenusUseCase } from "./src/modules/integrations/application/use-cases/PublishSquareMenusUseCase.js";
import { SearchSquareOrdersUseCase } from "./src/modules/integrations/application/use-cases/SearchSquareOrdersUseCase.js";
import { SquareConnectionAccessTokenResolver } from "./src/modules/integrations/infrastructure/http/SquareConnectionAccessTokenResolver.js";
import { PrismaSquareCatalogSyncTaskRepository } from "./src/modules/integrations/infrastructure/prisma/PrismaSquareCatalogSyncTaskRepository.js";
import { PrismaSquareConnectionRepository } from "./src/modules/integrations/infrastructure/prisma/PrismaSquareConnectionRepository.js";

type ScriptContext = {
  args: string[];
};

type ScriptHandler = (context: ScriptContext) => Promise<void>;

type ScriptDefinition = {
  description: string;
  handler: ScriptHandler;
  name: string;
};

const scripts: ScriptDefinition[] = [
  {
    name: "square:sync-menus",
    description:
      "Push menus from the Foody database to the fixed Square catalog account.",
    handler: runSquareMenuSync,
  },
  {
    name: "square:cleanup-test-data",
    description:
      "Archive Square catalog items created by the Foody integration for testing cleanup.",
    handler: runSquareCleanupTestData,
  },
  {
    name: "square:clear-links",
    description:
      "Clear every Foody-side Square catalog ID/version field from menus, categories, products, modifier groups, and modifier items.",
    handler: runSquareClearLinks,
  },
  {
    name: "square:list-locations",
    description: "List Square locations available for the configured account.",
    handler: runSquareListLocations,
  },
  {
    name: "square:process-sync-tasks",
    description:
      "Process persisted Square catalog sync tasks queued by product updates.",
    handler: runSquareProcessSyncTasks,
  },
  {
    name: "square:create-order-from-foody",
    description:
      "Create a Square order from an existing Foody order using synced catalog IDs.",
    handler: runSquareCreateOrderFromFoody,
  },
  {
    name: "square:get-order",
    description: "Retrieve a Square order by its Square order ID.",
    handler: runSquareGetOrder,
  },
  {
    name: "square:search-orders",
    description: "Search Square orders for the configured location.",
    handler: runSquareSearchOrders,
  },
];

async function main() {
  ensureEnvLoaded();

  const [command, ...args] = process.argv.slice(2);

  if (!command || command === "--help" || command === "-h" || command === "help") {
    printUsage();
    return;
  }

  const script = scripts.find((entry) => entry.name === command);

  if (!script) {
    console.error(`Unknown script: ${command}`);
    console.error("");
    printUsage();
    process.exitCode = 1;
    return;
  }

  await script.handler({ args });
}

async function runSquareMenuSync({ args }: ScriptContext) {
  const options = parseSquareSyncOptions(args);
  const useCase = new PublishSquareMenusUseCase(new HttpSquareCatalogGateway());

  console.log("Running Square menu sync...");
  console.log(
    JSON.stringify(
      {
        command: "square:sync-menus",
        dryRun: options.dryRun,
        activeOnly: options.activeOnly,
        includeHiddenProducts: options.includeHiddenProducts,
        menuIds: options.menuIds,
      },
      null,
      2,
    ),
  );

  const result = await useCase.execute(options);

  console.log("");
  console.log("Square menu sync result:");
  console.log(JSON.stringify(result, null, 2));

  if (!result.success) {
    process.exitCode = 1;
  }
}

async function runSquareCleanupTestData({ args }: ScriptContext) {
  const options = parseSquareCleanupOptions(args);
  const useCase = new ArchiveSquareCatalogTestDataUseCase(new HttpSquareCatalogGateway());

  console.log("Running Square archive cleanup for Foody integration test data...");
  console.log(
    JSON.stringify(
      {
        command: "square:cleanup-test-data",
        dryRun: options.dryRun,
      },
      null,
      2,
    ),
  );

  const result = await useCase.execute(options);

  console.log("");
  console.log("Square cleanup result:");
  console.log(JSON.stringify(result, null, 2));

  if (!result.success) {
    process.exitCode = 1;
  }
}

async function runSquareClearLinks({ args }: ScriptContext) {
  const options = parseSquareCleanupOptions(args);
  const useCase = new ClearSquareCatalogMappingsUseCase();

  console.log("Clearing Foody-side Square catalog links...");
  console.log(
    JSON.stringify(
      {
        command: "square:clear-links",
        dryRun: options.dryRun,
      },
      null,
      2,
    ),
  );

  const result = await useCase.execute(options);

  console.log("");
  console.log("Square link cleanup result:");
  console.log(JSON.stringify(result, null, 2));

  if (!result.success) {
    process.exitCode = 1;
  }
}

async function runSquareListLocations(_: ScriptContext) {
  const useCase = new ListSquareLocationsUseCase(new HttpSquareOrdersGateway());

  console.log("Listing Square locations...");

  const result = await useCase.execute();

  console.log("");
  console.log("Square locations:");
  console.log(JSON.stringify(result, null, 2));
}

async function runSquareProcessSyncTasks({ args }: ScriptContext) {
  const limit = parseLimitOption(args, 10);
  const repository = new PrismaSquareCatalogSyncTaskRepository();
  const squareConnectionRepository = new PrismaSquareConnectionRepository();
  const squareTokenResolver = new SquareConnectionAccessTokenResolver(
    squareConnectionRepository,
  );
  const publishSquareMenusUseCase = new PublishSquareMenusUseCase(
    new HttpSquareCatalogGateway(),
  );
  const useCase = new ProcessSquareCatalogSyncTasksUseCase(
    repository,
    squareTokenResolver,
    publishSquareMenusUseCase,
  );

  console.log("Processing Square catalog sync tasks...");
  console.log(
    JSON.stringify(
      {
        command: "square:process-sync-tasks",
        limit,
      },
      null,
      2,
    ),
  );

  const result = await useCase.execute({ limit });

  console.log("");
  console.log("Square catalog sync task result:");
  console.log(JSON.stringify(result, null, 2));
}

async function runSquareCreateOrderFromFoody({ args }: ScriptContext) {
  const options = parseSquareCreateOrderOptions(args);
  const useCase = new CreateSquareOrderFromFoodyOrderUseCase(new HttpSquareOrdersGateway());

  console.log("Creating Square order from Foody order...");
  console.log(
    JSON.stringify(
      {
        command: "square:create-order-from-foody",
        orderId: options.orderId,
        locationId: options.locationId ?? null,
        state: options.state,
      },
      null,
      2,
    ),
  );

  const result = await useCase.execute(options);

  console.log("");
  console.log("Square order create result:");
  console.log(JSON.stringify(result, null, 2));
}

async function runSquareGetOrder({ args }: ScriptContext) {
  const options = parseSquareGetOrderOptions(args);
  const useCase = new GetSquareOrderUseCase(new HttpSquareOrdersGateway());

  console.log("Retrieving Square order...");
  console.log(
    JSON.stringify(
      {
        command: "square:get-order",
        orderId: options.orderId,
      },
      null,
      2,
    ),
  );

  const result = await useCase.execute(options);

  console.log("");
  console.log("Square order:");
  console.log(JSON.stringify(result, null, 2));
}

async function runSquareSearchOrders({ args }: ScriptContext) {
  const options = parseSquareSearchOrdersOptions(args);
  const useCase = new SearchSquareOrdersUseCase(new HttpSquareOrdersGateway());

  console.log("Searching Square orders...");
  console.log(
    JSON.stringify(
      {
        command: "square:search-orders",
        locationId: options.locationId ?? null,
        sourceName: options.sourceName ?? null,
        state: options.state ?? null,
        limit: options.limit ?? null,
      },
      null,
      2,
    ),
  );

  const result = await useCase.execute(options);

  console.log("");
  console.log("Square orders:");
  console.log(JSON.stringify(result, null, 2));
}

function parseSquareSyncOptions(args: string[]): {
  activeOnly: boolean;
  dryRun: boolean;
  includeHiddenProducts: boolean;
  menuIds?: string[];
} {
  const options = {
    dryRun: false,
    activeOnly: false,
    includeHiddenProducts: false,
    menuIds: [] as string[],
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg) {
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--active-only") {
      options.activeOnly = true;
      continue;
    }

    if (arg === "--include-hidden-products") {
      options.includeHiddenProducts = true;
      continue;
    }

    if (arg === "--menu-id") {
      const value = args[index + 1]?.trim();
      if (!value) {
        throw new Error("Missing value for --menu-id");
      }

      options.menuIds.push(value);
      index += 1;
      continue;
    }

    if (arg.startsWith("--menu-id=")) {
      const value = arg.slice("--menu-id=".length).trim();
      if (!value) {
        throw new Error("Missing value for --menu-id");
      }

      options.menuIds.push(value);
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return {
    dryRun: options.dryRun,
    activeOnly: options.activeOnly,
    includeHiddenProducts: options.includeHiddenProducts,
    ...(options.menuIds.length > 0 ? { menuIds: options.menuIds } : {}),
  };
}

function parseSquareCleanupOptions(args: string[]): {
  dryRun: boolean;
} {
  const options = {
    dryRun: false,
  };

  for (const arg of args) {
    if (!arg) {
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

function parseLimitOption(args: string[], defaultValue: number): number {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg) {
      continue;
    }

    if (arg === "--limit") {
      const parsed = Number.parseInt(args[index + 1] ?? "", 10);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error("Missing or invalid value for --limit");
      }

      return parsed;
    }

    if (arg.startsWith("--limit=")) {
      const parsed = Number.parseInt(arg.slice("--limit=".length), 10);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error("Missing or invalid value for --limit");
      }

      return parsed;
    }
  }

  return defaultValue;
}

function parseSquareCreateOrderOptions(args: string[]): {
  locationId?: string;
  orderId: string;
  state: "DRAFT" | "OPEN";
} {
  const options: {
    locationId?: string;
    orderId?: string;
    state: "DRAFT" | "OPEN";
  } = {
    state: "DRAFT",
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg) {
      continue;
    }

    if (arg === "--open") {
      options.state = "OPEN";
      continue;
    }

    if (arg === "--draft") {
      options.state = "DRAFT";
      continue;
    }

    if (arg === "--order-id") {
      const value = args[index + 1]?.trim();
      if (!value) {
        throw new Error("Missing value for --order-id");
      }

      options.orderId = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--order-id=")) {
      const value = arg.slice("--order-id=".length).trim();
      if (!value) {
        throw new Error("Missing value for --order-id");
      }

      options.orderId = value;
      continue;
    }

    if (arg === "--location-id") {
      const value = args[index + 1]?.trim();
      if (!value) {
        throw new Error("Missing value for --location-id");
      }

      options.locationId = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--location-id=")) {
      const value = arg.slice("--location-id=".length).trim();
      if (!value) {
        throw new Error("Missing value for --location-id");
      }

      options.locationId = value;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  if (!options.orderId) {
    throw new Error("Missing required option: --order-id");
  }

  return {
    orderId: options.orderId,
    state: options.state,
    ...(options.locationId ? { locationId: options.locationId } : {}),
  };
}

function parseSquareGetOrderOptions(args: string[]): {
  orderId: string;
} {
  let orderId: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg) {
      continue;
    }

    if (arg === "--order-id") {
      const value = args[index + 1]?.trim();
      if (!value) {
        throw new Error("Missing value for --order-id");
      }

      orderId = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--order-id=")) {
      const value = arg.slice("--order-id=".length).trim();
      if (!value) {
        throw new Error("Missing value for --order-id");
      }

      orderId = value;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  if (!orderId) {
    throw new Error("Missing required option: --order-id");
  }

  return { orderId };
}

function parseSquareSearchOrdersOptions(args: string[]): {
  limit?: number;
  locationId?: string;
  sourceName?: string;
  state?: string;
} {
  const options: {
    limit?: number;
    locationId?: string;
    sourceName?: string;
    state?: string;
  } = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg) {
      continue;
    }

    if (arg === "--location-id") {
      const value = args[index + 1]?.trim();
      if (!value) {
        throw new Error("Missing value for --location-id");
      }

      options.locationId = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--location-id=")) {
      const value = arg.slice("--location-id=".length).trim();
      if (!value) {
        throw new Error("Missing value for --location-id");
      }

      options.locationId = value;
      continue;
    }

    if (arg === "--source-name") {
      const value = args[index + 1]?.trim();
      if (!value) {
        throw new Error("Missing value for --source-name");
      }

      options.sourceName = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--source-name=")) {
      const value = arg.slice("--source-name=".length).trim();
      if (!value) {
        throw new Error("Missing value for --source-name");
      }

      options.sourceName = value;
      continue;
    }

    if (arg === "--state") {
      const value = args[index + 1]?.trim();
      if (!value) {
        throw new Error("Missing value for --state");
      }

      options.state = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--state=")) {
      const value = arg.slice("--state=".length).trim();
      if (!value) {
        throw new Error("Missing value for --state");
      }

      options.state = value;
      continue;
    }

    if (arg === "--limit") {
      const value = Number(args[index + 1]);
      if (!Number.isInteger(value) || value <= 0) {
        throw new Error("Invalid value for --limit");
      }

      options.limit = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--limit=")) {
      const value = Number(arg.slice("--limit=".length));
      if (!Number.isInteger(value) || value <= 0) {
        throw new Error("Invalid value for --limit");
      }

      options.limit = value;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

function printUsage() {
  console.log("Usage:");
  console.log("  npm run script -- <command> [options]");
  console.log("");
  console.log("Commands:");

  for (const script of scripts) {
    console.log(`  ${script.name}`);
    console.log(`    ${script.description}`);
  }

  console.log("");
  console.log("square:sync-menus options:");
  console.log("  --dry-run");
  console.log("  --active-only");
  console.log("  --include-hidden-products");
  console.log("  --menu-id <menuId>");
  console.log("  --menu-id=<menuId>");
  console.log("");
  console.log("square:cleanup-test-data options:");
  console.log("  --dry-run");
  console.log("");
  console.log("square:create-order-from-foody options:");
  console.log("  --order-id <foodyOrderId>");
  console.log("  --order-id=<foodyOrderId>");
  console.log("  --location-id <squareLocationId>");
  console.log("  --location-id=<squareLocationId>");
  console.log("  --draft");
  console.log("  --open");
  console.log("");
  console.log("square:get-order options:");
  console.log("  --order-id <squareOrderId>");
  console.log("  --order-id=<squareOrderId>");
  console.log("");
  console.log("square:search-orders options:");
  console.log("  --location-id <squareLocationId>");
  console.log("  --location-id=<squareLocationId>");
  console.log("  --source-name <sourceName>");
  console.log("  --source-name=<sourceName>");
  console.log("  --state <state>");
  console.log("  --state=<state>");
  console.log("  --limit <count>");
  console.log("  --limit=<count>");
  console.log("");
  console.log("Examples:");
  console.log("  npm run script -- square:sync-menus --dry-run");
  console.log("  npm run script -- square:sync-menus --active-only");
  console.log("  npm run script -- square:sync-menus --menu-id=default-menu");
  console.log("  npm run script -- square:cleanup-test-data --dry-run");
  console.log("  npm run script -- square:cleanup-test-data");
  console.log("  npm run script -- square:list-locations");
  console.log("  npm run script -- square:create-order-from-foody --order-id=<foody-order-id>");
  console.log("  npm run script -- square:get-order --order-id=<square-order-id>");
  console.log("  npm run script -- square:search-orders --source-name=Foody --state=DRAFT");
}

main().catch((error) => {
  console.error("Script failed.");
  console.error(error);
  process.exitCode = 1;
});
