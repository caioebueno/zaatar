import type { ExternalIntegrationEnvironment } from "./UberEatsConnectionRepository.js";

export type ExternalMenuSyncStatus = "PENDING" | "SUCCESS" | "FAILED" | "SKIPPED";

export type MenuSyncCounts = {
  categoriesCount: number;
  itemsCount: number;
  modifierGroupsCount: number;
  modifierItemsCount: number;
};

export type CreateMenuSyncRunInput = {
  businessId: string | null;
  connectionId: string | null;
  counts: MenuSyncCounts;
  dryRun: boolean;
  forced: boolean;
  menuId: string;
  provider: "UBER_EATS";
  requestHash: string;
  requestPayload: unknown;
  startedAt: Date;
  status: ExternalMenuSyncStatus;
  storeId: string;
  userId: string;
};

export type UpdateMenuSyncRunInput = {
  errorMessage?: string | null;
  finishedAt: Date;
  responsePayload?: unknown;
  runId: string;
  status: ExternalMenuSyncStatus;
};

export type MenuSyncRunView = {
  businessId: string | null;
  connectionId: string | null;
  counts: MenuSyncCounts;
  createdAt: Date;
  dryRun: boolean;
  errorMessage: string | null;
  finishedAt: Date | null;
  forced: boolean;
  id: string;
  menuId: string;
  requestHash: string;
  startedAt: Date | null;
  status: ExternalMenuSyncStatus;
  storeId: string;
  updatedAt: Date;
  userId: string;
};

export type UpsertEntityMapInput = {
  businessId: string | null;
  connectionId: string | null;
  entityType: "MENU" | "CATEGORY" | "ITEM";
  externalEntityId: string;
  internalEntityId: string;
  menuId: string;
  provider: "UBER_EATS";
  rawPayload?: unknown;
  userId: string;
};

export type ExternalMenuEntityMapView = {
  entityType: "MENU" | "CATEGORY" | "ITEM" | "MODIFIER_GROUP" | "MODIFIER_ITEM";
  externalEntityId: string;
  internalEntityId: string;
  rawPayload: unknown;
};

export interface UberEatsMenuSyncRepository {
  createRun(input: CreateMenuSyncRunInput): Promise<MenuSyncRunView>;
  findLatestForMenu(userId: string, menuId: string): Promise<MenuSyncRunView | null>;
  listEntityMaps(input: {
    entityType?: ExternalMenuEntityMapView["entityType"];
    menuId?: string;
    userId: string;
  }): Promise<ExternalMenuEntityMapView[]>;
  listRuns(input: { limit: number; menuId?: string; userId: string }): Promise<MenuSyncRunView[]>;
  updateRun(input: UpdateMenuSyncRunInput): Promise<void>;
  upsertEntityMappings(rows: UpsertEntityMapInput[]): Promise<void>;
}
