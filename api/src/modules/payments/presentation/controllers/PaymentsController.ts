import { randomUUID } from "node:crypto";
import type { PaymentsRepository } from "../../application/ports/PaymentsRepository.js";
import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";

const VALID_PAYMENT_TYPES = ["CASH", "CARD", "ZELLE"] as const;
const VALID_PAYMENT_PROVIDERS = ["STRIPE"] as const;

export class PaymentsController implements HttpController {
  constructor(private readonly repository: PaymentsRepository) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    if (!request.auth?.userId) {
      return { statusCode: 401, body: { error: "Unauthorized" } };
    }

    const url = new URL(request.path, "http://localhost");
    const pathname = url.pathname;

    // GET /orders/:orderId/payments
    const orderPaymentsMatch = pathname.match(/^\/orders\/([^/]+)\/payments$/);
    if (request.method === "GET" && orderPaymentsMatch) {
      const orderId = orderPaymentsMatch[1];
      const payments = await this.repository.listByOrderId(orderId);
      return { statusCode: 200, body: { payments } };
    }

    // POST /orders/:orderId/payments
    if (request.method === "POST" && orderPaymentsMatch) {
      const orderId = orderPaymentsMatch[1];
      const body = toObject(request.body);

      const amount = parseRequiredInteger(body.amount);
      if (amount === null) return invalidPayload("amount");

      const paymentType = parseRequiredEnum(body.paymentType, VALID_PAYMENT_TYPES);
      if (!paymentType) return invalidPayload("paymentType");

      const paymentProvider =
        body.paymentProvider !== undefined
          ? parseOptionalEnum(body.paymentProvider, VALID_PAYMENT_PROVIDERS)
          : undefined;
      if (paymentProvider === "INVALID") return invalidPayload("paymentProvider");

      const paidAt = body.paidAt !== undefined ? parseOptionalDate(body.paidAt) : undefined;
      if (paidAt === "INVALID") return invalidPayload("paidAt");

      const externalId = parseOptionalString(body.externalId);

      const payment = await this.repository.create({
        id: parseOptionalString(body.id) ?? randomUUID(),
        orderId,
        amount,
        paymentType,
        paymentProvider: paymentProvider ?? null,
        externalId: externalId ?? null,
        paidAt: paidAt ?? null,
      });

      return { statusCode: 201, body: payment };
    }

    // PATCH /payments/:paymentId
    const paymentMatch = pathname.match(/^\/payments\/([^/]+)$/);
    if (request.method === "PATCH" && paymentMatch) {
      const paymentId = paymentMatch[1];
      const body = toObject(request.body);

      const amount =
        body.amount !== undefined ? parseRequiredInteger(body.amount) : undefined;
      if (amount === null) return invalidPayload("amount");

      const paymentType =
        body.paymentType !== undefined
          ? parseRequiredEnum(body.paymentType, VALID_PAYMENT_TYPES)
          : undefined;
      if (paymentType === null) return invalidPayload("paymentType");

      const paymentProvider =
        body.paymentProvider !== undefined
          ? parseOptionalEnum(body.paymentProvider, VALID_PAYMENT_PROVIDERS)
          : undefined;
      if (paymentProvider === "INVALID") return invalidPayload("paymentProvider");

      const paidAt = body.paidAt !== undefined ? parseOptionalDate(body.paidAt) : undefined;
      if (paidAt === "INVALID") return invalidPayload("paidAt");

      const hasAnyField =
        body.amount !== undefined ||
        body.paymentType !== undefined ||
        body.paymentProvider !== undefined ||
        body.paidAt !== undefined ||
        body.externalId !== undefined;
      if (!hasAnyField) return invalidPayload("body");

      const payment = await this.repository.update({
        id: paymentId,
        amount,
        paymentType,
        paymentProvider,
        externalId: body.externalId !== undefined ? parseOptionalString(body.externalId) : undefined,
        paidAt,
      });

      if (!payment) return { statusCode: 404, body: { error: "Not found" } };
      return { statusCode: 200, body: payment };
    }

    // DELETE /payments/:paymentId
    if (request.method === "DELETE" && paymentMatch) {
      const paymentId = paymentMatch[1];
      const ok = await this.repository.delete(paymentId);
      if (!ok) return { statusCode: 404, body: { error: "Not found" } };
      return { statusCode: 200, body: { ok: true } };
    }

    return { statusCode: 404, body: { error: "Not found" } };
  }
}

function invalidPayload(field: string): HttpResponse {
  return { statusCode: 400, body: { error: "Invalid payload", field } };
}

function toObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function parseRequiredInteger(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) return null;
  return value;
}

function parseRequiredEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | null {
  if (typeof value !== "string") return null;
  if (!(allowed as readonly string[]).includes(value)) return null;
  return value as T;
}

function parseOptionalEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | null | "INVALID" {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return "INVALID";
  if (!(allowed as readonly string[]).includes(value)) return "INVALID";
  return value as T;
}

function parseOptionalString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}

function parseOptionalDate(value: unknown): string | null | "INVALID" {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return "INVALID";
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return "INVALID";
  return parsed.toISOString();
}
