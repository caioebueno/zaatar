import prisma from "../prisma";
import {
  buildPhoneCandidates,
  normalizePhoneDigits,
  normalizePhoneWithCountryCode,
} from "./phone";

const DEFAULT_CHATWOOT_BASE_URL =
  "https://chatwoot-production-487ab.up.railway.app";

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

    if (!response.ok) {
      return null;
    }

    const rows = parseConversationRows(response.payload);
    if (rows.length === 0) {
      return null;
    }

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

      if (isMatch) {
        return row.id;
      }
    }

    if (rows.length < perPage) {
      return null;
    }
  }

  return null;
}

async function ensureConversationForPhone(
  input: EnsureConversationInput,
): Promise<string | null> {
  const normalizedPhone =
    normalizePhoneWithCountryCode(input.customerPhone) ??
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
  const contactId =
    getNumber(contactRow?.id) ??
    getNumber(contactPayload?.id);
  if (!contactId) return null;

  const contactInboxes = Array.isArray(contactRow?.contact_inboxes)
    ? contactRow?.contact_inboxes
    : [];
  let contactSourceId = getString(
    asRecord(contactInboxes[0])?.source_id,
  );

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

    contactSourceId = getString(
      asRecord(contactInboxResponse.payload)?.source_id,
    );
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

export default async function sendOrderConfirmationChatwootMessage(input: {
  branchId: string | null;
  content: string;
  customerName?: string | null;
  customerPhone: string;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  if (isWhatsAppMessagingDisabled()) {
    return false;
  }

  const branchId = input.branchId?.trim();
  if (!branchId) return false;

  const token = resolveChatwootApiToken();
  if (!token) return false;

  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: {
      chatwootAccountId: true,
      chatwootSourceId: true,
    },
  });

  const accountId = branch?.chatwootAccountId?.trim();
  const sourceId = branch?.chatwootSourceId?.trim();
  if (!accountId || !sourceId) return false;

  const baseUrl = resolveChatwootBaseUrl();
  const existingConversationId = await findConversationIdByPhone({
    accountId,
    sourceId,
    customerPhone: input.customerPhone,
    baseUrl,
    token,
  });

  const conversationId =
    existingConversationId ??
    (await ensureConversationForPhone({
      accountId,
      sourceId,
      customerPhone: input.customerPhone,
      customerName: input.customerName ?? null,
      baseUrl,
      token,
    }));

  if (!conversationId) return false;

  const endpoint = `${baseUrl}/api/v1/accounts/${encodeURIComponent(
    accountId,
  )}/conversations/${encodeURIComponent(conversationId)}/messages`;

  const messageResponse = await requestChatwootJson({
    method: "POST",
    endpoint,
    token,
    body: {
      content: input.content,
      message_type: "outgoing",
      private: false,
      content_attributes: {
        ...(input.metadata ?? {}),
        sent_by: "order_confirmation",
      },
    },
  });

  return messageResponse.ok;
}
