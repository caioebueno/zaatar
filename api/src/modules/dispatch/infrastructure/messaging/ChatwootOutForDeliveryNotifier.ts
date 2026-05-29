import { Prisma } from "../../../../../../web/src/generated/prisma/index.js";
import prisma from "../../../../prisma.js";
import type { DispatchEntity } from "../../application/ports/DispatchRepository.js";
import type { OutForDeliveryNotifier } from "../../application/ports/OutForDeliveryNotifier.js";

type OrderBranchConfigRow = {
  chatwootAccountId: string | null;
  chatwootSourceId: string | null;
  orderId: string;
};

type ConversationRow = {
  id: string;
  raw: Record<string, unknown>;
};

type EnsureConversationInput = {
  accountId: string;
  baseUrl: string;
  customerName?: string | null;
  customerPhone: string;
  sourceId: string;
  token: string;
};

type NormalizedTemplateLanguage = "en" | "pt" | "es";

const DEFAULT_CHATWOOT_BASE_URL =
  "https://chatwoot-production-487ab.up.railway.app";

export class ChatwootOutForDeliveryNotifier implements OutForDeliveryNotifier {
  async sendForDispatch(dispatch: DispatchEntity): Promise<void> {
    if (isWhatsAppMessagingDisabled()) return;

    const token = resolveChatwootApiToken();
    if (!token) return;

    const deliveryOrders = dispatch.orders.filter(
      (order) =>
        order.type === "DELIVERY" &&
        !order.delivered &&
        Boolean(order.customer?.phone?.trim()),
    );
    if (deliveryOrders.length === 0) return;

    const orderIds = deliveryOrders.map((order) => order.id);
    const branchConfigByOrderId = await loadOrderBranchConfigs(orderIds);
    const baseUrl = resolveChatwootBaseUrl();

    const results = await Promise.allSettled(
      deliveryOrders.map(async (order) => {
        const orderBranchConfig = branchConfigByOrderId.get(order.id);
        if (!orderBranchConfig) return;

        const accountId = orderBranchConfig.chatwootAccountId?.trim();
        const sourceId = orderBranchConfig.chatwootSourceId?.trim();
        const customerPhone = order.customer?.phone?.trim() || null;

        if (!accountId || !sourceId || !customerPhone) return;

        const templateLanguage = normalizeTemplateLanguage(order.language);
        const templateName = resolveOutForDeliveryTemplateName(templateLanguage);
        const templateCategory = resolveOutForDeliveryTemplateCategory();
        const etaRangeLabel = toEtaRangeLabel(
          order.currentEstimatedDeliveryDurationMinutes ??
            order.estimatedDeliveryDurationMinutes ??
            dispatch.currentEstimatedDeliveryDurationMinutes ??
            dispatch.estimatedDeliveryDurationMinutes ??
            null,
        );
        const configuredPreview = resolveOutForDeliveryTemplatePreview(
          templateLanguage,
        );
        const content = configuredPreview
          ? configuredPreview
              .replaceAll("\\n", "\n")
              .replaceAll("{{1}}", etaRangeLabel)
          : buildOutForDeliveryFallbackMessage(templateLanguage, etaRangeLabel);

        const existingConversationId = await findConversationIdByPhone({
          accountId,
          sourceId,
          customerPhone,
          baseUrl,
          token,
        });

        const conversationId =
          existingConversationId ??
          (await ensureConversationForPhone({
            accountId,
            sourceId,
            customerPhone,
            customerName: order.customer?.name ?? null,
            baseUrl,
            token,
          }));
        if (!conversationId) return;

        const endpoint = `${baseUrl}/api/v1/accounts/${encodeURIComponent(
          accountId,
        )}/conversations/${encodeURIComponent(conversationId)}/messages`;

        const templatePayload = {
          content,
          message_type: "template",
          content_type: "text",
          private: false,
          content_attributes: {
            sent_by: "ai",
            dispatch_id: dispatch.id,
            order_id: order.id,
            template: "out_for_delivery",
          },
          template_params: {
            name: templateName,
            category: templateCategory,
            language: templateLanguage,
            processed_params: {
              body: {
                "1": etaRangeLabel,
              },
            },
          },
        };

        const templateResponse = await requestChatwootJson({
          method: "POST",
          endpoint,
          token,
          body: templatePayload,
        });
        if (templateResponse.ok) return;

        const fallbackResponse = await requestChatwootJson({
          method: "POST",
          endpoint,
          token,
          body: {
            ...templatePayload,
            message_type: "outgoing",
          },
        });

        if (!fallbackResponse.ok) {
          throw new Error(
            `Failed to send out_for_delivery message for order=${order.id} status=${fallbackResponse.status}`,
          );
        }
      }),
    );

    for (const result of results) {
      if (result.status === "rejected") {
        console.error(
          "Failed to send out_for_delivery notification for one order:",
          result.reason,
        );
      }
    }
  }
}

async function loadOrderBranchConfigs(
  orderIds: string[],
): Promise<Map<string, OrderBranchConfigRow>> {
  if (orderIds.length === 0) return new Map();

  const rows = await prisma.$queryRaw<OrderBranchConfigRow[]>`
    SELECT
      "Order"."id" AS "orderId",
      "Branch"."chatwootAccountId" AS "chatwootAccountId",
      "Branch"."chatwootSourceId" AS "chatwootSourceId"
    FROM "Order"
    LEFT JOIN "Branch"
      ON "Branch"."id" = "Order"."branchId"
    WHERE "Order"."id" IN (${Prisma.join(orderIds)})
  `;

  return new Map(rows.map((row) => [row.orderId, row]));
}

function resolveChatwootBaseUrl(): string {
  const configured = process.env.CHATWOOT_BASE_URL?.trim();
  const baseUrl = (configured || DEFAULT_CHATWOOT_BASE_URL).trim();
  return baseUrl.replace(/\/$/, "");
}

function resolveChatwootApiToken(): string | null {
  return process.env.CHATWOOT_API_ACCESS_TOKEN?.trim() || null;
}

function isWhatsAppMessagingDisabled(): boolean {
  const rawValue = process.env.DISABLE_WHATSAPP_MESSAGING?.trim().toLowerCase();
  return (
    rawValue === "1" ||
    rawValue === "true" ||
    rawValue === "yes" ||
    rawValue === "on"
  );
}

function normalizeTemplateLanguage(
  value: string | null | undefined,
): NormalizedTemplateLanguage {
  const normalized = (value ?? "").trim().toLowerCase().split("-")[0];
  if (normalized === "pt") return "pt";
  if (normalized === "es") return "es";
  return "en";
}

function resolveOutForDeliveryTemplateName(
  language: NormalizedTemplateLanguage,
): string {
  if (language === "pt") {
    return (
      process.env.CHATWOOT_OUT_FOR_DELIVERY_TEMPLATE_NAME_PT?.trim() ||
      process.env.CHATWOOT_OUT_FOR_DELIVERY_TEMPLATE_NAME?.trim() ||
      "out_for_delivery"
    );
  }

  if (language === "es") {
    return (
      process.env.CHATWOOT_OUT_FOR_DELIVERY_TEMPLATE_NAME_ES?.trim() ||
      process.env.CHATWOOT_OUT_FOR_DELIVERY_TEMPLATE_NAME?.trim() ||
      "out_for_delivery"
    );
  }

  return (
    process.env.CHATWOOT_OUT_FOR_DELIVERY_TEMPLATE_NAME_EN?.trim() ||
    process.env.CHATWOOT_OUT_FOR_DELIVERY_TEMPLATE_NAME?.trim() ||
    "out_for_delivery"
  );
}

function resolveOutForDeliveryTemplateCategory(): string {
  return process.env.CHATWOOT_OUT_FOR_DELIVERY_TEMPLATE_CATEGORY?.trim() || "UTILITY";
}

function resolveOutForDeliveryTemplatePreview(
  language: NormalizedTemplateLanguage,
): string | null {
  if (language === "pt") {
    return process.env.CHATWOOT_OUT_FOR_DELIVERY_TEMPLATE_PREVIEW_PT?.trim() || null;
  }

  if (language === "es") {
    return process.env.CHATWOOT_OUT_FOR_DELIVERY_TEMPLATE_PREVIEW_ES?.trim() || null;
  }

  return process.env.CHATWOOT_OUT_FOR_DELIVERY_TEMPLATE_PREVIEW_EN?.trim() || null;
}

function toEtaRangeLabel(
  estimatedDeliveryDurationMinutes: number | null | undefined,
): string {
  const etaFromMinutes = Math.max(
    0,
    Math.ceil(
      Number.isFinite(estimatedDeliveryDurationMinutes)
        ? Number(estimatedDeliveryDurationMinutes)
        : 0,
    ),
  );
  const etaToMinutes = etaFromMinutes + 10;
  return `${etaFromMinutes}-${etaToMinutes} min`;
}

function buildOutForDeliveryFallbackMessage(
  language: NormalizedTemplateLanguage,
  etaRangeLabel: string,
): string {
  if (language === "pt") {
    return `Seu pedido está a caminho. ETA: ${etaRangeLabel}.`;
  }

  if (language === "es") {
    return `Tu pedido va en camino. ETA: ${etaRangeLabel}.`;
  }

  return `Your order is on the way. ETA: ${etaRangeLabel}.`;
}

function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function normalizePhoneWithCountryCode(value: string): string {
  const digits = normalizePhoneDigits(value);
  if (!digits) return "";
  if (digits.length < 10) return "";
  if (digits.length === 10) return `1${digits}`;
  return digits;
}

function buildPhoneCandidates(rawPhone: string): string[] {
  const normalized = normalizePhoneDigits(rawPhone);
  if (!normalized) return [];
  return [normalized];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function getString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function getNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return Number.parseInt(value.trim(), 10);
  }
  return null;
}

function extractConversationPhone(row: Record<string, unknown>): string | null {
  const meta = asRecord(row.meta);
  const senderFromMeta = asRecord(meta?.sender);
  const contactFromMeta = asRecord(meta?.contact);
  const sender = asRecord(row.sender);
  const contact = asRecord(row.contact);

  return (
    getString(senderFromMeta?.phone_number) ??
    getString(senderFromMeta?.phoneNumber) ??
    getString(contactFromMeta?.phone_number) ??
    getString(contactFromMeta?.phoneNumber) ??
    getString(sender?.phone_number) ??
    getString(sender?.phoneNumber) ??
    getString(contact?.phone_number) ??
    getString(contact?.phoneNumber) ??
    null
  );
}

function extractConversationId(row: Record<string, unknown>): string | null {
  const id = row.id;
  if (typeof id === "string") {
    const normalized = id.trim();
    return normalized.length > 0 ? normalized : null;
  }
  if (typeof id === "number" && Number.isFinite(id)) {
    return String(id);
  }
  return null;
}

function parseConversationRows(payload: unknown): ConversationRow[] {
  const root = asRecord(payload);
  const data = asRecord(root?.data);
  const rows = Array.isArray(data?.payload)
    ? data.payload
    : Array.isArray(root?.payload)
      ? root.payload
      : [];

  return rows
    .map((item) => {
      const raw = asRecord(item);
      if (!raw) return null;
      const id = extractConversationId(raw);
      if (!id) return null;
      return { id, raw };
    })
    .filter((item): item is ConversationRow => item !== null);
}

async function requestChatwootJson(input: {
  method: "GET" | "POST";
  endpoint: string;
  token: string;
  body?: unknown;
}): Promise<{ ok: boolean; status: number; payload: unknown }> {
  const response = await fetch(input.endpoint, {
    method: input.method,
    headers: {
      api_access_token: input.token,
      Accept: "application/json",
      ...(input.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(input.body !== undefined ? { body: JSON.stringify(input.body) } : {}),
    cache: "no-store",
  });

  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
}

async function findConversationIdByPhone(input: {
  accountId: string;
  sourceId: string;
  customerPhone: string;
  baseUrl: string;
  token: string;
}): Promise<string | null> {
  const phoneCandidates = buildPhoneCandidates(input.customerPhone).map(
    (value) => normalizePhoneDigits(value),
  );
  const normalizedCandidates = [...new Set(phoneCandidates.filter(Boolean))];
  if (normalizedCandidates.length === 0) return null;

  const perPage = 50;
  const maxPages = 5;

  for (let page = 1; page <= maxPages; page += 1) {
    const params = new URLSearchParams({
      status: "all",
      inbox_id: input.sourceId,
      page: String(page),
      per_page: String(perPage),
    });

    const endpoint = `${input.baseUrl}/api/v1/accounts/${encodeURIComponent(
      input.accountId,
    )}/conversations?${params.toString()}`;
    const response = await requestChatwootJson({
      method: "GET",
      endpoint,
      token: input.token,
    });

    if (!response.ok) return null;

    const rows = parseConversationRows(response.payload);
    if (rows.length === 0) return null;

    for (const row of rows) {
      const rawPhone = extractConversationPhone(row.raw);
      if (!rawPhone) continue;
      const normalizedPhone = normalizePhoneDigits(rawPhone);
      if (!normalizedPhone) continue;

      const isMatch = normalizedCandidates.some(
        (candidate) =>
          normalizedPhone === candidate ||
          normalizedPhone.endsWith(candidate) ||
          candidate.endsWith(normalizedPhone),
      );

      if (isMatch) return row.id;
    }

    if (rows.length < perPage) return null;
  }

  return null;
}

async function ensureConversationForPhone(
  input: EnsureConversationInput,
): Promise<string | null> {
  const normalizedPhone =
    normalizePhoneWithCountryCode(input.customerPhone) ||
    normalizePhoneDigits(input.customerPhone);
  if (!normalizedPhone) return null;

  const inboxId = getNumber(input.sourceId);
  if (!inboxId) return null;

  const contactResponse = await requestChatwootJson({
    method: "POST",
    endpoint: `${input.baseUrl}/api/v1/accounts/${encodeURIComponent(
      input.accountId,
    )}/contacts`,
    token: input.token,
    body: {
      inbox_id: inboxId,
      name: input.customerName?.trim() || undefined,
      phone_number: `+${normalizedPhone}`,
      identifier: normalizedPhone,
    },
  });
  if (!contactResponse.ok) return null;

  const contactPayload = asRecord(contactResponse.payload);
  const contactRow = Array.isArray(contactPayload?.payload)
    ? asRecord(contactPayload?.payload[0])
    : null;
  const contactId = getNumber(contactRow?.id) ?? getNumber(contactPayload?.id);
  if (!contactId) return null;

  const contactInboxes = Array.isArray(contactRow?.contact_inboxes)
    ? contactRow?.contact_inboxes
    : [];
  let contactSourceId = getString(asRecord(contactInboxes[0])?.source_id);

  if (!contactSourceId) {
    const contactInboxResponse = await requestChatwootJson({
      method: "POST",
      endpoint: `${input.baseUrl}/api/v1/accounts/${encodeURIComponent(
        input.accountId,
      )}/contacts/${encodeURIComponent(String(contactId))}/contact_inboxes`,
      token: input.token,
      body: {
        inbox_id: inboxId,
        source_id: normalizedPhone,
      },
    });
    if (!contactInboxResponse.ok) return null;

    contactSourceId = getString(asRecord(contactInboxResponse.payload)?.source_id);
  }

  if (!contactSourceId) return null;

  const conversationResponse = await requestChatwootJson({
    method: "POST",
    endpoint: `${input.baseUrl}/api/v1/accounts/${encodeURIComponent(
      input.accountId,
    )}/conversations`,
    token: input.token,
    body: {
      source_id: contactSourceId,
      inbox_id: inboxId,
      contact_id: contactId,
      status: "open",
    },
  });
  if (!conversationResponse.ok) return null;

  const conversationRecord = asRecord(conversationResponse.payload);
  const conversationId = getNumber(conversationRecord?.id);
  return conversationId ? String(conversationId) : null;
}
