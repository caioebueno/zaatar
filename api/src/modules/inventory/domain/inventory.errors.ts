export type InventoryErrorCode =
  | "INVALID_PARAMS"
  | "NOT_FOUND"
  | "CONFLICT";

export type InventoryErrorDetails = {
  field?: string;
  service?: string;
  id?: string;
  reason?: string;
};

export class InventoryError extends Error {
  code: InventoryErrorCode;
  details: InventoryErrorDetails;

  constructor(code: InventoryErrorCode, details: InventoryErrorDetails = {}) {
    super(code);
    this.code = code;
    this.details = details;
  }
}
