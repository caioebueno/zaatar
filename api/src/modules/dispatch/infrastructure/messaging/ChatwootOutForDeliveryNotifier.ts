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
  notificationKind: DispatchNotificationKind;
  orderId: string;
  sourceId: string;
  token: string;
};

type NormalizedTemplateLanguage = "en" | "pt" | "es";
type DispatchNotificationKind = "out_for_delivery" | "ready_for_pickup";

const DEFAULT_CHATWOOT_BASE_URL =
  "https://chatwoot-production-487ab.up.railway.app";
const ORDER_MESSAGE_MAX_AGE_MS = 5 * 60 * 60 * 1000;
const CHATWOOT_REQUEST_TIMEOUT_MS = 15_000;

export class ChatwootOutForDeliveryNotifier implements OutForDeliveryNotifier {
  async sendForDispatch(dispatch: DispatchEntity): Promise<void> {
    if (isWhatsAppMessagingDisabled()) {
      console.info(`[dispatch-notification] skipped dispatch=${dispatch.id} reason=WHATSAPP_DISABLED`);
      return;
    }

    const token = resolveChatwootApiToken();
    if (!token) {
      console.warn(`[dispatch-notification] skipped dispatch=${dispatch.id} reason=MISSING_CHATWOOT_TOKEN`);
      return;
    }

    // A takeaway dispatch is a pickup-ready event, not an out-for-delivery event.
    // Keep the notification scoped to its matching order type in case old mixed
    // dispatch data exists.
    const notificationKind: DispatchNotificationKind = dispatch.orders.some(
      (order) => order.type === "TAKEAWAY",
    )
      ? "ready_for_pickup"
      : "out_for_delivery";
    const targetOrderType =
      notificationKind === "ready_for_pickup" ? "TAKEAWAY" : "DELIVERY";
    console.info(
      `[dispatch-notification] evaluating dispatch=${dispatch.id} dispatchAt=${dispatch.dispatchAt ?? "null"} kind=${notificationKind} orders=${dispatch.orders.length}`,
    );
    const targetOrders = dispatch.orders.filter(
      (order) =>
        order.type === targetOrderType &&
        !order.delivered &&
        Boolean(order.customer?.phone?.trim()),
    );
    if (targetOrders.length === 0) {
      console.info(
        `[dispatch-notification] skipped dispatch=${dispatch.id} kind=${notificationKind} reason=NO_ELIGIBLE_${targetOrderType}_ORDER`,
      );
      return;
    }

    const orderIds = targetOrders.map((order) => order.id);
    console.info(
      `[dispatch-notification] loading-branch-config dispatch=${dispatch.id} orderCount=${orderIds.length}`,
    );
    const branchConfigByOrderId = await loadOrderBranchConfigs(orderIds);
    console.info(
      `[dispatch-notification] loaded-branch-config dispatch=${dispatch.id} matchedOrderCount=${branchConfigByOrderId.size}`,
    );
    const baseUrl = resolveChatwootBaseUrl();

    const results = await Promise.allSettled(
      targetOrders.map(async (order) => {
        console.info(`[${notificationKind}] processing order=${order.id}`);
        if (isOrderOlderThanMessageWindow(order.createdAt)) {
          console.info(
            `[${notificationKind}] skipped stale order=${order.id} createdAt=${order.createdAt}`,
          );
          return;
        }

        const orderBranchConfig = branchConfigByOrderId.get(order.id);
        if (!orderBranchConfig) {
          console.warn(`[${notificationKind}] skipped order=${order.id} reason=MISSING_BRANCH`);
          return;
        }

        const accountId = orderBranchConfig.chatwootAccountId?.trim();
        const sourceId = orderBranchConfig.chatwootSourceId?.trim();
        const customerPhone = order.customer?.phone?.trim() || null;

        if (!accountId || !sourceId || !customerPhone) {
          const reason = !customerPhone
            ? "MISSING_CUSTOMER_PHONE"
            : !accountId
              ? "MISSING_CHATWOOT_ACCOUNT"
              : "MISSING_CHATWOOT_SOURCE";
          console.warn(`[${notificationKind}] skipped order=${order.id} reason=${reason}`);
          return;
        }

        const templateLanguage = normalizeTemplateLanguage(order.language);
        const templateName = resolveTemplateName(notificationKind, templateLanguage);
        const templateCategory = resolveTemplateCategory(notificationKind);
        const etaRangeLabel = toEtaRangeLabel(
          order.currentEstimatedDeliveryDurationMinutes ??
            order.estimatedDeliveryDurationMinutes ??
            dispatch.currentEstimatedDeliveryDurationMinutes ??
            dispatch.estimatedDeliveryDurationMinutes ??
            null,
        );
        const configuredPreview = resolveTemplatePreview(
          notificationKind,
          templateLanguage,
        );
        const content = configuredPreview
          ? configuredPreview
              .replaceAll("\\n", "\n")
              .replaceAll("{{1}}", etaRangeLabel)
          : buildFallbackMessage(notificationKind, templateLanguage, etaRangeLabel);

        console.info(`[${notificationKind}] finding-conversation order=${order.id}`);
        const existingConversationId = await findConversationIdByPhone({
          accountId,
          sourceId,
          customerPhone,
          baseUrl,
          token,
        });
        console.info(
          `[${notificationKind}] conversation-lookup-complete order=${order.id} found=${Boolean(existingConversationId)}`,
        );

        let conversationId = existingConversationId;
        if (!conversationId) {
          console.info(`[${notificationKind}] creating-conversation order=${order.id}`);
          conversationId = await ensureConversationForPhone({
            accountId,
            sourceId,
            customerPhone,
            customerName: order.customer?.name ?? null,
            notificationKind,
            orderId: order.id,
            baseUrl,
            token,
          });
          console.info(
            `[${notificationKind}] conversation-create-complete order=${order.id} created=${Boolean(conversationId)}`,
          );
        }
        if (!conversationId) {
          console.warn(`[${notificationKind}] skipped order=${order.id} reason=CONVERSATION_UNAVAILABLE`);
          return;
        }

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
            template: notificationKind,
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

        console.info(`[${notificationKind}] sending-template order=${order.id} template=${templateName}`);
        const templateResponse = await requestChatwootJson({
          method: "POST",
          endpoint,
          token,
          body: templatePayload,
        });
        if (templateResponse.ok) {
          console.info(
            `[${notificationKind}] sent order=${order.id} mode=template template=${templateName} language=${templateLanguage}`,
          );
          return;
        }

        console.warn(
          `[${notificationKind}] template-failed order=${order.id} status=${templateResponse.status}; trying outgoing fallback`,
        );

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
          throw new Error(`Failed to send ${notificationKind} message for order=${order.id} status=${fallbackResponse.status}`);
        }

        console.info(
          `[${notificationKind}] sent order=${order.id} mode=outgoing-fallback language=${templateLanguage}`,
        );
      }),
    );

    for (const result of results) {
      if (result.status === "rejected") {
        console.error(
          `Failed to send ${notificationKind} notification for one order:`,
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

function resolveTemplateName(
  notificationKind: DispatchNotificationKind,
  language: NormalizedTemplateLanguage,
): string {
  if (notificationKind === "ready_for_pickup") {
    if (language === "pt") {
      return process.env.CHATWOOT_READY_FOR_PICKUP_TEMPLATE_NAME_PT?.trim() || process.env.CHATWOOT_READY_FOR_PICKUP_TEMPLATE_NAME?.trim() || "ready_for_pickup";
    }
    if (language === "es") {
      return process.env.CHATWOOT_READY_FOR_PICKUP_TEMPLATE_NAME_ES?.trim() || process.env.CHATWOOT_READY_FOR_PICKUP_TEMPLATE_NAME?.trim() || "ready_for_pickup";
    }
    return process.env.CHATWOOT_READY_FOR_PICKUP_TEMPLATE_NAME_EN?.trim() || process.env.CHATWOOT_READY_FOR_PICKUP_TEMPLATE_NAME?.trim() || "ready_for_pickup";
  }

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

function resolveTemplateCategory(notificationKind: DispatchNotificationKind): string {
  if (notificationKind === "ready_for_pickup") {
    return process.env.CHATWOOT_READY_FOR_PICKUP_TEMPLATE_CATEGORY?.trim() || "UTILITY";
  }
  return process.env.CHATWOOT_OUT_FOR_DELIVERY_TEMPLATE_CATEGORY?.trim() || "UTILITY";
}

function resolveTemplatePreview(
  notificationKind: DispatchNotificationKind,
  language: NormalizedTemplateLanguage,
): string | null {
  if (notificationKind === "ready_for_pickup") {
    if (language === "pt") return process.env.CHATWOOT_READY_FOR_PICKUP_TEMPLATE_PREVIEW_PT?.trim() || null;
    if (language === "es") return process.env.CHATWOOT_READY_FOR_PICKUP_TEMPLATE_PREVIEW_ES?.trim() || null;
    return process.env.CHATWOOT_READY_FOR_PICKUP_TEMPLATE_PREVIEW_EN?.trim() || null;
  }

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

function buildFallbackMessage(
  notificationKind: DispatchNotificationKind,
  language: NormalizedTemplateLanguage,
  etaRangeLabel: string,
): string {
  if (notificationKind === "ready_for_pickup") {
    if (language === "pt") return "Seu pedido está pronto para retirada.";
    if (language === "es") return "Tu pedido está listo para recoger.";
    return "Your order is ready for pickup.";
  }

  if (language === "pt") {
    return `Seu pedido está a caminho. ETA: ${etaRangeLabel}.`;
  }

  if (language === "es") {
    return `Tu pedido va en camino. ETA: ${etaRangeLabel}.`;
  }

  return `Your order is on the way. ETA: ${etaRangeLabel}.`;
}

function isOrderOlderThanMessageWindow(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false;

  const createdAtDate = new Date(createdAt);
  if (Number.isNaN(createdAtDate.getTime())) {
    return false;
  }

  return Date.now() - createdAtDate.getTime() > ORDER_MESSAGE_MAX_AGE_MS;
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

function summarizeChatwootError(payload: unknown): string {
  const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
  if (!raw) return "NO_RESPONSE_BODY";

  // Keep validation details useful while excluding phone-like values from logs.
  return raw
    .replace(/\+?\d[\d\s().-]{6,}\d/g, "[redacted-phone]")
    .replace(/\s+/g, " ")
    .slice(0, 300);
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
    signal: AbortSignal.timeout(CHATWOOT_REQUEST_TIMEOUT_MS),
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
  if (!normalizedPhone) {
    console.warn(`[${input.notificationKind}] conversation-create-failed order=${input.orderId} reason=INVALID_PHONE`);
    return null;
  }

  const inboxId = getNumber(input.sourceId);
  if (!inboxId) {
    console.warn(`[${input.notificationKind}] conversation-create-failed order=${input.orderId} reason=INVALID_INBOX_ID`);
    return null;
  }

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
  let contactPayload = contactResponse.payload;
  let contactId: number | null = null;
  let contactSourceId: string | null = null;

  if (contactResponse.ok) {
    const contactRecord = asRecord(contactPayload);
    const contactRow = Array.isArray(contactRecord?.payload)
      ? asRecord(contactRecord?.payload[0])
      : null;
    contactId = getNumber(contactRow?.id) ?? getNumber(contactRecord?.id);
    const contactInboxes = Array.isArray(contactRow?.contact_inboxes)
      ? contactRow.contact_inboxes
      : [];
    contactSourceId = getSourceIdForInbox(contactInboxes, inboxId);
  } else if (contactResponse.status === 422) {
    const existingContact = await findContactByPhone({
      accountId: input.accountId,
      baseUrl: input.baseUrl,
      normalizedPhone,
      token: input.token,
      inboxId,
    });
    contactId = existingContact?.id ?? null;
    contactSourceId = existingContact?.sourceId ?? null;
    if (contactId) {
      console.info(`[${input.notificationKind}] reusing-contact order=${input.orderId} contactId=${contactId}`);
    }
  }

  if (!contactId) {
    console.warn(
      `[${input.notificationKind}] conversation-create-failed order=${input.orderId} step=CREATE_CONTACT status=${contactResponse.status} reason=${summarizeChatwootError(contactResponse.payload)}`,
    );
    return null;
  }

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
    if (!contactInboxResponse.ok) {
      console.warn(`[${input.notificationKind}] conversation-create-failed order=${input.orderId} step=CREATE_CONTACT_INBOX status=${contactInboxResponse.status}`);
      return null;
    }

    contactSourceId = getString(asRecord(contactInboxResponse.payload)?.source_id);
  }

  if (!contactSourceId) {
    console.warn(`[${input.notificationKind}] conversation-create-failed order=${input.orderId} reason=MISSING_CONTACT_SOURCE_ID`);
    return null;
  }

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
  if (!conversationResponse.ok) {
    console.warn(`[${input.notificationKind}] conversation-create-failed order=${input.orderId} step=CREATE_CONVERSATION status=${conversationResponse.status}`);
    return null;
  }

  const conversationRecord = asRecord(conversationResponse.payload);
  const conversationId = getNumber(conversationRecord?.id);
  if (!conversationId) {
    console.warn(`[${input.notificationKind}] conversation-create-failed order=${input.orderId} reason=MISSING_CONVERSATION_ID`);
  }
  return conversationId ? String(conversationId) : null;
}

function getSourceIdForInbox(contactInboxes: unknown[], inboxId: number): string | null {
  for (const item of contactInboxes) {
    const row = asRecord(item);
    if (getNumber(asRecord(row?.inbox)?.id) !== inboxId) continue;
    const sourceId = getString(row?.source_id);
    if (sourceId) return sourceId;
  }
  return null;
}

async function findContactByPhone(input: {
  accountId: string;
  baseUrl: string;
  inboxId: number;
  normalizedPhone: string;
  token: string;
}): Promise<{ id: number; sourceId: string | null } | null> {
  const params = new URLSearchParams({ q: `+${input.normalizedPhone}` });
  const response = await requestChatwootJson({
    method: "GET",
    endpoint: `${input.baseUrl}/api/v1/accounts/${encodeURIComponent(input.accountId)}/contacts/search?${params.toString()}`,
    token: input.token,
  });
  if (!response.ok) return null;

  const payload = asRecord(response.payload);
  const contacts = Array.isArray(payload?.payload) ? payload.payload : [];
  for (const item of contacts) {
    const contact = asRecord(item);
    const id = getNumber(contact?.id);
    const phone = getString(contact?.phone_number);
    if (!id || normalizePhoneDigits(phone ?? "") !== input.normalizedPhone) continue;
    const contactInboxes = Array.isArray(contact?.contact_inboxes)
      ? contact.contact_inboxes
      : [];
    return { id, sourceId: getSourceIdForInbox(contactInboxes, input.inboxId) };
  }
  return null;
}
