import {
  buildUberMenuPayload,
} from "../services/uberEatsMenuPayload.js";
import type { UberEatsConnectionRepository } from "../ports/UberEatsConnectionRepository.js";
import type {
  MenuSyncRunView,
  UberEatsMenuSyncRepository,
} from "../ports/UberEatsMenuSyncRepository.js";

type PublishInput = {
  dryRun: boolean;
  force: boolean;
  menuId: string;
  storeId: string;
  userId: string;
};

type PublishOutput = {
  hash: string;
  run: MenuSyncRunView;
  skipped: boolean;
};

export class PublishUberEatsMenuUseCase {
  constructor(
    private readonly connectionRepository: UberEatsConnectionRepository,
    private readonly syncRepository: UberEatsMenuSyncRepository,
  ) {}

  async execute(input: PublishInput): Promise<PublishOutput> {
    const menuId = input.menuId.trim();
    const storeId = input.storeId.trim();
    if (!menuId) throw new Error("menuId is required");
    if (!storeId) throw new Error("storeId is required");

    const connection = await this.connectionRepository.findForUserWithSecrets(
      input.userId,
    );
    if (!connection || !connection.accessToken) {
      throw new Error("UBER_EATS_NOT_CONNECTED");
    }

    const built = await buildUberMenuPayload(menuId);
    const latestRun = await this.syncRepository.findLatestForMenu(
      input.userId,
      menuId,
    );

    if (
      !input.force &&
      latestRun &&
      latestRun.status === "SUCCESS" &&
      latestRun.requestHash === built.hash
    ) {
      const skippedRun = await this.syncRepository.createRun({
        provider: "UBER_EATS",
        status: "SKIPPED",
        userId: input.userId,
        businessId: connection.businessId ?? null,
        menuId,
        storeId,
        dryRun: input.dryRun,
        forced: input.force,
        requestHash: built.hash,
        counts: built.counts,
        requestPayload: built.payload,
        startedAt: new Date(),
        connectionId: connection.connectionId ?? null,
      });

      await this.syncRepository.updateRun({
        runId: skippedRun.id,
        status: "SKIPPED",
        finishedAt: new Date(),
        errorMessage: "NO_CHANGES_DETECTED",
        responsePayload: { skipped: true },
      });

      return {
        run: {
          ...skippedRun,
          status: "SKIPPED",
          errorMessage: "NO_CHANGES_DETECTED",
          finishedAt: new Date(),
        },
        hash: built.hash,
        skipped: true,
      };
    }

    const run = await this.syncRepository.createRun({
      provider: "UBER_EATS",
      status: "PENDING",
      userId: input.userId,
      businessId: connection.businessId ?? null,
      menuId,
      storeId,
      dryRun: input.dryRun,
      forced: input.force,
      requestHash: built.hash,
      counts: built.counts,
      requestPayload: built.payload,
      startedAt: new Date(),
      connectionId: connection.connectionId ?? null,
    });

    if (input.dryRun) {
      await this.syncRepository.updateRun({
        runId: run.id,
        status: "SUCCESS",
        finishedAt: new Date(),
        responsePayload: { dryRun: true },
      });

      return {
        hash: built.hash,
        skipped: false,
        run: {
          ...run,
          status: "SUCCESS",
          finishedAt: new Date(),
        },
      };
    }

    const syncUrl =
      process.env.UBER_EATS_MENU_API_URL?.trim() ||
      `${resolveUberApiBaseUrl()}/v1/eats/stores/${encodeURIComponent(storeId)}/menus`;

    const response = await fetch(syncUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(built.payload),
    });

    const responsePayload = await response.json().catch(() => ({}));

    if (!response.ok) {
      await this.syncRepository.updateRun({
        runId: run.id,
        status: "FAILED",
        finishedAt: new Date(),
        errorMessage: `UBER_SYNC_FAILED_${response.status}`,
        responsePayload,
      });
      throw new Error(`UBER_SYNC_FAILED_${response.status}`);
    }

    const itemHashByProductId = new Map(
      built.itemSnapshots.map((snapshot) => [snapshot.id, snapshot.hash]),
    );

    await this.syncRepository.upsertEntityMappings([
      {
        provider: "UBER_EATS",
        userId: input.userId,
        businessId: connection.businessId ?? null,
        menuId,
        entityType: "MENU",
        internalEntityId: menuId,
        externalEntityId: menuId,
        connectionId: connection.connectionId ?? null,
        rawPayload: { syncedAt: new Date().toISOString(), hash: built.hash },
      },
      ...built.payload.menus.flatMap((menu) => [
        ...menu.categories.map((category) => ({
          provider: "UBER_EATS" as const,
          userId: input.userId,
          businessId: connection.businessId ?? null,
          menuId,
          entityType: "CATEGORY" as const,
          internalEntityId: category.id,
          externalEntityId: category.id,
          connectionId: connection.connectionId ?? null,
          rawPayload: { syncedAt: new Date().toISOString() },
        })),
        ...menu.categories.flatMap((category) =>
          category.items.map((item) => ({
            provider: "UBER_EATS" as const,
            userId: input.userId,
            businessId: connection.businessId ?? null,
            menuId,
            entityType: "ITEM" as const,
            internalEntityId: item.id,
            externalEntityId: item.id,
            connectionId: connection.connectionId ?? null,
            rawPayload: {
              hash: itemHashByProductId.get(item.id) ?? null,
              syncedAt: new Date().toISOString(),
            },
          })),
        ),
      ]),
    ]);

    await this.syncRepository.updateRun({
      runId: run.id,
      status: "SUCCESS",
      finishedAt: new Date(),
      responsePayload,
    });

    return {
      hash: built.hash,
      skipped: false,
      run: {
        ...run,
        status: "SUCCESS",
        finishedAt: new Date(),
      },
    };
  }
}

function resolveUberApiBaseUrl(): string {
  const raw = process.env.UBER_EATS_API_BASE_URL?.trim();
  if (!raw) return "https://api.uber.com";
  return raw.replace(/\/+$/, "");
}
