import type {
  AckInventoryAlertInput,
  CreateInventoryPlaceInput,
  CreateInventoryProductInput,
  DeleteInventoryStockInput,
  InventoryAlert,
  InventoryChecklistWithItems,
  InventoryDashboard,
  InventoryPlace,
  InventoryProduct,
  InventoryStock,
  ListInventoryAlertsInput,
  OpenDailyInventoryChecklistInput,
  ResolveInventoryAlertInput,
  SubmitInventoryChecklistInput,
  TransferInventoryStockInput,
  TransferInventoryStockResult,
  UpdateInventoryStockChecklistPromptInput,
  UpdateInventoryChecklistItemInput,
  UpdateInventoryPlaceInput,
  UpdateInventoryProductInput,
  UpsertInventoryStockInput,
} from "./inventory.types";

export interface InventoryRepository {
  listPlaces(): Promise<InventoryPlace[]>;
  createPlace(input: CreateInventoryPlaceInput): Promise<InventoryPlace>;
  updatePlace(input: UpdateInventoryPlaceInput): Promise<InventoryPlace>;

  listProducts(): Promise<InventoryProduct[]>;
  createProduct(input: CreateInventoryProductInput): Promise<InventoryProduct>;
  updateProduct(input: UpdateInventoryProductInput): Promise<InventoryProduct>;

  listStocks(filters?: { placeId?: string | null }): Promise<InventoryStock[]>;
  upsertStock(input: UpsertInventoryStockInput): Promise<InventoryStock>;
  deleteStock(input: DeleteInventoryStockInput): Promise<InventoryStock>;
  updateStockChecklistPrompt(
    input: UpdateInventoryStockChecklistPromptInput,
  ): Promise<InventoryStock>;
  transferStock(input: TransferInventoryStockInput): Promise<TransferInventoryStockResult>;

  openDailyChecklist(
    input: OpenDailyInventoryChecklistInput,
  ): Promise<InventoryChecklistWithItems>;
  getChecklistByDate(date: string): Promise<InventoryChecklistWithItems | null>;
  updateChecklistItem(
    input: UpdateInventoryChecklistItemInput,
  ): Promise<InventoryChecklistWithItems>;
  submitChecklist(
    input: SubmitInventoryChecklistInput,
  ): Promise<InventoryChecklistWithItems>;

  listAlerts(filters?: ListInventoryAlertsInput): Promise<InventoryAlert[]>;
  ackAlert(input: AckInventoryAlertInput): Promise<InventoryAlert>;
  resolveAlert(input: ResolveInventoryAlertInput): Promise<InventoryAlert>;

  getDashboard(date?: string | null): Promise<InventoryDashboard>;
}
