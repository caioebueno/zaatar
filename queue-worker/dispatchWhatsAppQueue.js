import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const MAX_ATTEMPTS = Number(process.env.DISPATCH_WHATSAPP_MAX_RETRIES || 2) + 1;
const ORDER_NOTIFICATION_MAX_AGE_MS = 3 * 60 * 60 * 1000;
const BASE_URL = (process.env.CHATWOOT_BASE_URL || "https://chatwoot-production-487ab.up.railway.app").replace(/\/$/, "");

// All customer notification templates use the approved Brazilian Portuguese variant.
const language = () => "pt";
const chatwootTemplateLanguage = () => "pt_BR";
const digits = (value) => String(value || "").replace(/\D/g, "");
const isOrderOlderThanNotificationWindow = (value) => {
  const createdAt = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(createdAt.getTime()) && Date.now() - createdAt.getTime() > ORDER_NOTIFICATION_MAX_AGE_MS;
};
const templatePrefix = (kind) => kind === "ready_for_pickup" ? "CHATWOOT_READY_FOR_PICKUP" : kind === "order_confirmation" ? "CHATWOOT_ORDER_CONFIRMATION" : "CHATWOOT_OUT_FOR_DELIVERY";
const templateName = (kind, lang) => {
  const prefix = templatePrefix(kind);
  return process.env[`${prefix}_TEMPLATE_NAME_${lang.toUpperCase()}`] || process.env[`${prefix}_TEMPLATE_NAME`] || kind;
};
const category = (kind) => process.env[`${templatePrefix(kind)}_TEMPLATE_CATEGORY`] || "UTILITY";
const confirmationDetails = (job) => {
  const name = job.customerName?.trim();
  const number = job.orderNumber?.trim();
  const amount = Number(job.amount);

  if (!name) throw new Error("MISSING_CUSTOMER_NAME");
  if (!number) throw new Error("MISSING_ORDER_NUMBER");
  if (!Number.isFinite(amount) || amount < 0) throw new Error("INVALID_ORDER_AMOUNT");
  if (!["DELIVERY", "TAKEAWAY"].includes(job.orderType)) throw new Error("INVALID_ORDER_TYPE");

  return {
    name,
    number,
    total: (amount / 100).toFixed(2),
    type: job.orderType === "DELIVERY" ? "Delivery" : "Retirada",
  };
};
const preview = (kind, lang, eta, job) => {
  const prefix = templatePrefix(kind);
  const configured = process.env[`${prefix}_TEMPLATE_PREVIEW_${lang.toUpperCase()}`];
  if (configured) {
    const values = kind === "order_confirmation" ? confirmationDetails(job) : { name: eta, number: eta, total: eta, type: eta };
    return configured.replaceAll("\\n", "\n").replaceAll("{{1}}", values.name).replaceAll("{{2}}", values.number).replaceAll("{{3}}", values.total).replaceAll("{{4}}", values.type);
  }
  if (kind === "order_confirmation") {
    const details = confirmationDetails(job);
    return `🍕 Pedido Confirmado!\n\nOi ${details.name}! Seu pedido foi recebido 🙌\n🧾 Pedido #: ${details.number}\n💰 Total: $${details.total}\n📍 Tipo: ${details.type}\n\nJa estamos preparando seu pedido 🔥\nVamos avisar quando estiver pronto!\n\nObrigado por escolher Zaatar Grill & Pizza! ❤️`;
  }
  if (kind === "ready_for_pickup") return lang === "pt" ? "Seu pedido está pronto para retirada." : lang === "es" ? "Tu pedido está listo para recoger." : "Your order is ready for pickup.";
  return lang === "pt" ? `Seu pedido está a caminho. ETA: ${eta}.` : lang === "es" ? `Tu pedido va en camino. ETA: ${eta}.` : `Your order is on the way. ETA: ${eta}.`;
};
async function chatwoot(method, endpoint, body) {
  const token = process.env.CHATWOOT_API_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("MISSING_CHATWOOT_TOKEN");
  const response = await fetch(endpoint, { method, headers: { api_access_token: token, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000) });
  const text = await response.text(); let payload = null; try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  return { ok: response.ok, status: response.status, payload };
}
const record = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const id = (value) => typeof value === "number" ? value : Number(value) || null;
const chatwootFailureReason = (payload) => {
  const value = record(payload);
  const message = value.message || value.error || record(value.errors).message;
  return typeof message === "string" && message.trim() ? message.trim().slice(0, 500) : "NO_RESPONSE_MESSAGE";
};
async function sendTwilioTemplate(job, input) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
  const from = process.env.TWILIO_WHATSAPP_FROM?.trim();
  const contentSid = input.contentSid?.trim();
  const phone = digits(job.customerPhone);
  if (!accountSid || !authToken || !contentSid) throw new Error(`MISSING_TWILIO_${job.kind.toUpperCase()}_CONFIG`);
  if (!messagingServiceSid && !from) throw new Error("MISSING_TWILIO_SENDER_CONFIG");
  if (phone.length < 8 || phone.length > 15) throw new Error("INVALID_CUSTOMER_PHONE");

  const params = new URLSearchParams({
    To: `whatsapp:+${phone}`,
    ContentSid: contentSid,
  });
  if (input.variables && Object.keys(input.variables).length > 0) {
    params.set("ContentVariables", JSON.stringify(input.variables));
  }
  if (messagingServiceSid) params.set("MessagingServiceSid", messagingServiceSid);
  else params.set("From", from);
  const authorization = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
  console.log(`[dispatch-whatsapp] sending-twilio-template job=${job.id} order=${job.orderId} kind=${job.kind} contentSid=${contentSid} variableCount=${Object.keys(input.variables || {}).length}`);
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: authorization }, body: params.toString(), signal: AbortSignal.timeout(15_000) });
  const responseText = await response.text();
  if (!response.ok) throw new Error(`TWILIO_TEMPLATE_${response.status}:${responseText.slice(0, 500)}`);
  let payload = {}; try { payload = responseText ? JSON.parse(responseText) : {}; } catch { /* Twilio response is normally JSON. */ }
  console.log(`[dispatch-whatsapp] twilio-template-accepted job=${job.id} order=${job.orderId} sid=${record(payload).sid || "unknown"}`);
}
async function recordTwilioDeliveryInChatwoot(job, input) {
  if (!process.env.CHATWOOT_API_ACCESS_TOKEN?.trim() || !job.chatwootAccountId || !job.chatwootSourceId) return;
  try {
    const conversationId = await conversationFor(job);
    const response = await chatwoot("POST", `${BASE_URL}/api/v1/accounts/${encodeURIComponent(job.chatwootAccountId)}/conversations/${conversationId}/messages`, { content: preview(job.kind, "pt", "0-10 min", job), message_type: "outgoing", content_type: "text", private: true, content_attributes: { order_id: job.orderId, template: job.kind, twilio_delivery: true, ...(input.variables ? { template_variables: input.variables } : {}) } });
    if (!response.ok) throw new Error(`CHATWOOT_NOTE_${response.status}`);
    console.log(`[dispatch-whatsapp] chatwoot-note-recorded job=${job.id} order=${job.orderId}`);
  } catch (error) {
    console.error(`[dispatch-whatsapp] chatwoot-note-failed job=${job.id} order=${job.orderId} reason=${error instanceof Error ? error.message : String(error)}`);
  }
}
const templateRows = (payload) => {
  const root = record(payload);
  return Array.isArray(root.payload) ? root.payload : Array.isArray(root.templates) ? root.templates : Array.isArray(payload) ? payload : [];
};
async function verifyTemplate(job, name, templateLanguage) {
  const endpoint = `${BASE_URL}/api/v1/accounts/${encodeURIComponent(job.chatwootAccountId)}/inboxes/${encodeURIComponent(job.chatwootSourceId)}/message_templates`;
  const response = await chatwoot("GET", endpoint);
  // Older/self-hosted Chatwoot versions do not expose this listing endpoint.
  // The message endpoint remains the source of truth for template delivery.
  if (response.status === 404) {
    console.warn(`[dispatch-whatsapp] template-verification-unavailable job=${job.id} order=${job.orderId} status=404; continuing-with-send`);
    return;
  }
  if (!response.ok) throw new Error(`LIST_TEMPLATES_${response.status}:${chatwootFailureReason(response.payload)}`);
  const templates = templateRows(response.payload);
  const match = templates.find((item) => String(record(item).name || "").trim() === name && String(record(item).language || "").trim().toLowerCase() === templateLanguage.toLowerCase());
  if (!match) {
    const available = templates.slice(0, 25).map((item) => `${record(item).name || "unknown"}:${record(item).language || "unknown"}`).join(",");
    console.error(`[dispatch-whatsapp] template-not-synced job=${job.id} order=${job.orderId} template=${name} language=${templateLanguage} available=${available || "none"}`);
    throw new Error(`TEMPLATE_NOT_SYNCED:${name}:${templateLanguage}`);
  }
  console.log(`[dispatch-whatsapp] template-verified job=${job.id} order=${job.orderId} template=${name} language=${templateLanguage} status=${record(match).status || "unknown"}`);
}
async function conversationFor(job) {
  const phone = digits(job.customerPhone); const inboxId = id(job.chatwootSourceId);
  if (!phone || !inboxId || !job.chatwootAccountId) throw new Error("INVALID_CHATWOOT_CONTACT_CONTEXT");
  console.log(`[dispatch-whatsapp] finding-conversation job=${job.id} order=${job.orderId}`);
  const root = `${BASE_URL}/api/v1/accounts/${encodeURIComponent(job.chatwootAccountId)}`;
  const list = await chatwoot("GET", `${root}/conversations?status=all&inbox_id=${inboxId}&per_page=50&page=1`);
  if (!list.ok) throw new Error(`LIST_CONVERSATIONS_${list.status}`);
  const rows = Array.isArray(record(list.payload).data?.payload) ? record(list.payload).data.payload : Array.isArray(record(list.payload).payload) ? record(list.payload).payload : [];
  const match = rows.find((row) => digits(record(record(row).meta).sender?.phone_number || record(row).sender?.phone_number || record(row).contact?.phone_number) === phone);
  if (match && id(record(match).id)) {
    console.log(`[dispatch-whatsapp] found-conversation job=${job.id} order=${job.orderId}`);
    return String(id(record(match).id));
  }
  console.log(`[dispatch-whatsapp] no-conversation job=${job.id} order=${job.orderId}; finding-contact`);
  const search = await chatwoot("GET", `${root}/contacts/search?q=${encodeURIComponent(`+${phone}`)}`);
  const contacts = Array.isArray(record(search.payload).payload) ? record(search.payload).payload : [];
  let contact = contacts.find((row) => digits(record(row).phone_number) === phone);
  if (!contact) {
    console.log(`[dispatch-whatsapp] creating-contact job=${job.id} order=${job.orderId}`);
    const created = await chatwoot("POST", `${root}/contacts`, { inbox_id: inboxId, name: job.customerName || undefined, phone_number: `+${phone}`, identifier: phone });
    if (!created.ok) throw new Error(`CREATE_CONTACT_${created.status}`);
    contact = Array.isArray(record(created.payload).payload) ? record(created.payload).payload[0] : created.payload;
  } else {
    console.log(`[dispatch-whatsapp] reusing-contact job=${job.id} order=${job.orderId}`);
  }
  const contactId = id(record(contact).id); if (!contactId) throw new Error("MISSING_CONTACT_ID");
  const inboxes = Array.isArray(record(contact).contact_inboxes) ? record(contact).contact_inboxes : [];
  let source = inboxes.find((row) => id(record(record(row).inbox).id) === inboxId)?.source_id;
  if (!source) {
    console.log(`[dispatch-whatsapp] linking-contact-inbox job=${job.id} order=${job.orderId}`);
    const linked = await chatwoot("POST", `${root}/contacts/${contactId}/contact_inboxes`, { inbox_id: inboxId, source_id: phone }); if (!linked.ok) throw new Error(`CREATE_CONTACT_INBOX_${linked.status}`); source = record(linked.payload).source_id;
  }
  console.log(`[dispatch-whatsapp] creating-conversation job=${job.id} order=${job.orderId}`);
  const createdConversation = await chatwoot("POST", `${root}/conversations`, { source_id: source, inbox_id: inboxId, contact_id: contactId, status: "open" });
  if (!createdConversation.ok || !id(record(createdConversation.payload).id)) throw new Error(`CREATE_CONVERSATION_${createdConversation.status}`);
  return String(id(record(createdConversation.payload).id));
}
async function claim(limit) {
  const result = await pool.query(`WITH candidates AS (SELECT id FROM "DispatchWhatsAppJob" WHERE status IN ('PENDING','FAILED') AND "availableAt" <= NOW() AND attempts < $2 ORDER BY "createdAt" LIMIT $1 FOR UPDATE SKIP LOCKED) UPDATE "DispatchWhatsAppJob" j SET status='PROCESSING', attempts=j.attempts+1, "processingStartedAt"=NOW() FROM candidates, "Order" o LEFT JOIN "Customer" c ON c.id=o."customerId" LEFT JOIN "Branch" b ON b.id=o."branchId" WHERE j.id=candidates.id AND o.id=j."orderId" RETURNING j.*, o."createdAt" AS "orderCreatedAt", o."language", o."number" AS "orderNumber", o."type" AS "orderType", o."amount", c."phone" AS "customerPhone", c."name" AS "customerName", b."chatwootAccountId", b."chatwootSourceId"`, [limit, MAX_ATTEMPTS]);
  return result.rows;
}
export async function processDispatchWhatsAppJobs(limit = 10) {
  let jobs; try { jobs = await claim(limit); } catch (error) { if (error?.code === "42P01") return { processed: 0, failed: 0 }; throw error; }
  console.log(`[dispatch-whatsapp] claimed count=${jobs.length} limit=${limit}`);
  let processed = 0, failed = 0, skipped = 0;
  for (const job of jobs) try {
    console.log(`[dispatch-whatsapp] processing job=${job.id} order=${job.orderId} kind=${job.kind} attempt=${job.attempts}`);
    if (isOrderOlderThanNotificationWindow(job.orderCreatedAt)) {
      await pool.query(`UPDATE "DispatchWhatsAppJob" SET status='COMPLETED', "completedAt"=NOW(), "lastError"='SKIPPED_ORDER_OLDER_THAN_3_HOURS' WHERE id=$1`, [job.id]);
      console.info(`[dispatch-whatsapp] skipped job=${job.id} order=${job.orderId} kind=${job.kind} reason=ORDER_OLDER_THAN_3_HOURS createdAt=${new Date(job.orderCreatedAt).toISOString()}`);
      skipped++;
      continue;
    }
    const lang = language(job.language); const eta = "0-10 min";
    if (job.kind === "order_confirmation" || job.kind === "ready_for_pickup") {
      const isConfirmation = job.kind === "order_confirmation";
      const confirmation = isConfirmation ? confirmationDetails(job) : null;
      const variables = confirmation ? { "1": confirmation.name, "2": confirmation.number, "3": confirmation.total, "4": confirmation.type } : null;
      const contentSid = isConfirmation
        ? process.env.TWILIO_ORDER_CONFIRMATION_TEMPLATE_SID_PT?.trim() || process.env.TWILIO_ORDER_CONFIRMATION_TEMPLATE_SID?.trim()
        : process.env.TWILIO_READY_FOR_PICKUP_TEMPLATE_SID_PT?.trim() || process.env.TWILIO_READY_FOR_PICKUP_TEMPLATE_SID?.trim();
      if (confirmation) console.log(`[dispatch-whatsapp] confirmation-values job=${job.id} order=${job.orderId} orderNumber=${confirmation.number} total=${confirmation.total} type=${confirmation.type} customerNamePresent=true`);
      await sendTwilioTemplate(job, { contentSid, variables });
      await recordTwilioDeliveryInChatwoot(job, { variables });
      await pool.query(`UPDATE "DispatchWhatsAppJob" SET status='COMPLETED', "completedAt"=NOW(), "lastError"=NULL WHERE id=$1`, [job.id]);
      console.log(`[dispatch-whatsapp] completed job=${job.id} order=${job.orderId} kind=${job.kind}`); processed++;
      continue;
    }
    const conversationId = await conversationFor(job);
    const templateLanguage = chatwootTemplateLanguage(lang);
    const selectedTemplateName = templateName(job.kind, lang);
    await verifyTemplate(job, selectedTemplateName, templateLanguage);
    console.log(`[dispatch-whatsapp] sending-template job=${job.id} order=${job.orderId} account=${job.chatwootAccountId} inbox=${job.chatwootSourceId} template=${selectedTemplateName} language=${templateLanguage}`);
    const processedParams = job.kind === "ready_for_pickup" ? {} : { body: { "1": eta } };
    const response = await chatwoot("POST", `${BASE_URL}/api/v1/accounts/${encodeURIComponent(job.chatwootAccountId)}/conversations/${conversationId}/messages`, { content: preview(job.kind, lang, eta, job), message_type: "outgoing", content_type: "text", private: false, content_attributes: { sent_by: "ai", order_id: job.orderId, template: job.kind }, template_params: { name: selectedTemplateName, category: category(job.kind), language: templateLanguage, processed_params: processedParams } });
    if (!response.ok) {
      const reason = chatwootFailureReason(response.payload);
      console.error(`[dispatch-whatsapp] template-send-rejected job=${job.id} order=${job.orderId} kind=${job.kind} status=${response.status} reason=${reason}`);
      throw new Error(`SEND_TEMPLATE_${response.status}:${reason}`);
    }
    console.log(`[dispatch-whatsapp] template-send-accepted job=${job.id} order=${job.orderId} kind=${job.kind} status=${response.status} messageId=${record(response.payload).id || "unknown"}`);
    await pool.query(`UPDATE "DispatchWhatsAppJob" SET status='COMPLETED', "completedAt"=NOW(), "lastError"=NULL WHERE id=$1`, [job.id]);
    console.log(`[dispatch-whatsapp] completed job=${job.id} order=${job.orderId} kind=${job.kind}`); processed++;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    await pool.query(`UPDATE "DispatchWhatsAppJob" SET status='FAILED', "availableAt"=NOW() + INTERVAL '30 seconds', "processingStartedAt"=NULL, "lastError"=$2 WHERE id=$1`, [job.id, reason]);
    console.error(`[dispatch-whatsapp] failed job=${job.id} order=${job.orderId} kind=${job.kind} attempt=${job.attempts} reason=${reason}`); failed++;
  }
  console.log(`[dispatch-whatsapp] completed processed=${processed} failed=${failed} skipped=${skipped}`);
  return { processed, failed, skipped };
}
