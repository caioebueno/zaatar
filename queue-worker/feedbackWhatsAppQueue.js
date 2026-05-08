import { Pool } from "pg";

const DEFAULT_MAX_JOBS_PER_RUN = 10;
const DEFAULT_MAX_FEEDBACK_RETRIES = 2;

const DEFAULT_TWILIO_FEEDBACK_TEMPLATE_SID_EN =
  "HXa1728d7711e5ea52947eed912d6ec611";
const DEFAULT_TWILIO_FEEDBACK_TEMPLATE_SID_PT =
  "HX5a5bc294ff63f75e3eff2ab5a37001a4";
const DEFAULT_TWILIO_FEEDBACK_TEMPLATE_SID_ES =
  "HX2439261ac2def9cb76cae135733fba25";

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function normalizeLanguageForTemplate(value) {
  const normalizedValue = (value || "").trim().toLowerCase();
  const baseLanguage = normalizedValue.split("-")[0];

  if (baseLanguage === "pt" || baseLanguage === "es") {
    return baseLanguage;
  }

  return "en";
}

function resolveFeedbackTemplateSid(language) {
  if (language === "pt") {
    return (
      process.env.TWILIO_FEEDBACK_TEMPLATE_SID_PT?.trim() ||
      DEFAULT_TWILIO_FEEDBACK_TEMPLATE_SID_PT
    );
  }

  if (language === "es") {
    return (
      process.env.TWILIO_FEEDBACK_TEMPLATE_SID_ES?.trim() ||
      DEFAULT_TWILIO_FEEDBACK_TEMPLATE_SID_ES
    );
  }

  return (
    process.env.TWILIO_FEEDBACK_TEMPLATE_SID_EN?.trim() ||
    process.env.TWILIO_FEEDBACK_TEMPLATE_SID?.trim() ||
    DEFAULT_TWILIO_FEEDBACK_TEMPLATE_SID_EN
  );
}

function resolveFeedbackVariableKey() {
  const configuredKey =
    process.env.TWILIO_FEEDBACK_TEMPLATE_VARIABLE_KEY?.trim() || "1";
  return configuredKey.length > 0 ? configuredKey : "1";
}

function resolveFeedbackVariableValue(input) {
  const language = normalizeLanguageForTemplate(input.language);
  const defaultTemplate = "{orderId}";
  const template =
    process.env.TWILIO_FEEDBACK_TEMPLATE_VARIABLE_VALUE_TEMPLATE?.trim() ||
    defaultTemplate;

  return template
    .replaceAll("{orderId}", String(input.orderId))
    .replaceAll("{language}", language);
}

function toErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown feedback WhatsApp queue error";
  }
}

function getRetryDate(attempts) {
  const delayInSeconds = Math.min(30 * 2 ** Math.max(attempts - 1, 0), 15 * 60);
  return new Date(Date.now() + delayInSeconds * 1000);
}

function getMaxFeedbackRetries() {
  const rawValue = process.env.FEEDBACK_WHATSAPP_MAX_RETRIES?.trim();
  if (!rawValue) return DEFAULT_MAX_FEEDBACK_RETRIES;

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return DEFAULT_MAX_FEEDBACK_RETRIES;
  }

  return parsed;
}

function getMaxFeedbackAttempts() {
  // Total attempts = first attempt + configured retries.
  return getMaxFeedbackRetries() + 1;
}

function normalizeInternationalPhoneDigits(phone) {
  let digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;

  // Support inputs that may come as international "00..." prefix.
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  // E.164 allows up to 15 digits (without the "+" sign).
  if (digits.length < 8 || digits.length > 15) {
    return null;
  }

  return digits;
}

function toWhatsAppAddress(phone) {
  const normalized = normalizeInternationalPhoneDigits(phone);
  if (!normalized) return undefined;
  return `whatsapp:+${normalized}`;
}

function isWhatsAppMessagingDisabled() {
  const rawValue = process.env.DISABLE_WHATSAPP_MESSAGING?.trim().toLowerCase();
  return (
    rawValue === "1" ||
    rawValue === "true" ||
    rawValue === "yes" ||
    rawValue === "on"
  );
}

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
  const fromWhatsAppAddress =
    process.env.TWILIO_WHATSAPP_FROM?.trim() ||
    process.env.TWILIO_WHATSAPP_NUMBER?.trim() ||
    process.env.WHATSAPP_FROM?.trim() ||
    "";

  if (!accountSid || !authToken) {
    throw new Error(
      "TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN are not configured for feedback queue.",
    );
  }

  if (!messagingServiceSid && !fromWhatsAppAddress) {
    throw new Error(
      "Configure TWILIO_MESSAGING_SERVICE_SID or TWILIO_WHATSAPP_FROM for feedback queue.",
    );
  }

  const baseUrl = (
    process.env.TWILIO_API_BASE_URL?.trim() || "https://api.twilio.com"
  ).replace(/\/$/, "");

  return {
    accountSid,
    authToken,
    messagingServiceSid: messagingServiceSid ?? "",
    fromWhatsAppAddress,
    baseUrl,
  };
}

async function sendFeedbackTemplateWhatsAppMessage(input) {
  if (isWhatsAppMessagingDisabled()) {
    console.info(
      `[queue-worker] Skipping feedback WhatsApp send order=${input.orderId}: DISABLE_WHATSAPP_MESSAGING is enabled.`,
    );
    return;
  }

  const config = getTwilioConfig();
  const toAddress = toWhatsAppAddress(input.customerPhone);

  if (!toAddress) {
    throw new Error("Invalid customer phone for WhatsApp template send.");
  }

  const endpoint = `${config.baseUrl}/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
  const params = new URLSearchParams({
    To: toAddress,
    ContentSid: input.contentSid,
  });

  if (
    input.contentVariables &&
    typeof input.contentVariables === "object" &&
    Object.keys(input.contentVariables).length > 0
  ) {
    params.set("ContentVariables", JSON.stringify(input.contentVariables));
  }

  if (config.messagingServiceSid) {
    params.set("MessagingServiceSid", config.messagingServiceSid);
  } else if (config.fromWhatsAppAddress) {
    params.set("From", config.fromWhatsAppAddress);
  }

  const debugPayload = {
    To: params.get("To"),
    From: params.get("From"),
    MessagingServiceSid: params.get("MessagingServiceSid"),
    ContentSid: params.get("ContentSid"),
    ContentVariables: params.get("ContentVariables"),
  };
  console.log(
    `[queue-worker] Twilio feedback request body order=${input.orderId}:`,
    debugPayload,
  );

  const authorization = `Basic ${Buffer.from(
    `${config.accountSid}:${config.authToken}`,
  ).toString("base64")}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: authorization,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error(
      `[queue-worker] Twilio feedback request failed order=${input.orderId} payload=`,
      debugPayload,
    );
    throw new Error(
      `Twilio WhatsApp API request failed (${response.status}): ${errorBody}`,
    );
  }
}

function isInvalidContentVariablesError(error) {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("Twilio WhatsApp API request failed (400)") &&
    error.message.includes('"code":21656')
  );
}

async function sendFeedbackTemplateWhatsAppMessageWithFallback(input) {
  const configuredVariableKey = resolveFeedbackVariableKey();
  const configuredVariableValue = resolveFeedbackVariableValue(input);

  const attempts = [
    {
      label: "configured_key_and_value",
      contentVariables: {
        [configuredVariableKey]: configuredVariableValue,
      },
    },
    {
      label: "numeric_variable_key_feedback_path_suffix",
      contentVariables: {
        "1": `${normalizeLanguageForTemplate(input.language)}/feedback/${input.orderId}`,
      },
    },
    {
      label: "numeric_variable_key_order_id",
      contentVariables: {
        "1": String(input.orderId),
      },
    },
    {
      label: "named_variable_key_order_id",
      contentVariables: {
        orderId: String(input.orderId),
      },
    },
    {
      label: "no_content_variables",
      contentVariables: undefined,
    },
  ];

  let lastError = null;

  for (const attempt of attempts) {
    try {
      await sendFeedbackTemplateWhatsAppMessage({
        ...input,
        contentVariables: attempt.contentVariables,
      });
      if (attempt.label !== "numeric_variable_key") {
        console.warn(
          `[queue-worker] feedback WhatsApp sent using fallback strategy=${attempt.label} order=${input.orderId}`,
        );
      }
      return;
    } catch (error) {
      lastError = error;
      if (!isInvalidContentVariablesError(error)) {
        throw error;
      }
      console.warn(
        `[queue-worker] feedback WhatsApp variable strategy failed strategy=${attempt.label} order=${input.orderId}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  throw lastError;
}

async function claimFeedbackWhatsAppJobs(limit, maxAttempts) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await client.query(
      `
        WITH candidate_jobs AS (
          SELECT "id"
          FROM "FeedbackWhatsAppJob"
          WHERE "status" IN ('PENDING', 'FAILED')
            AND "availableAt" <= NOW()
            AND "attempts" < $2
          ORDER BY "createdAt" ASC
          LIMIT $1
          FOR UPDATE SKIP LOCKED
        )
        UPDATE "FeedbackWhatsAppJob" job
        SET
          "status" = 'PROCESSING',
          "attempts" = job."attempts" + 1,
          "processingStartedAt" = NOW()
        FROM candidate_jobs
        WHERE job."id" = candidate_jobs."id"
        RETURNING
          job."id",
          job."orderId",
          job."customerPhone",
          job."language",
          job."attempts"
      `,
      [limit, maxAttempts],
    );
    await client.query("COMMIT");
    return result.rows;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function isMissingFeedbackQueueTableError(error) {
  return (
    Boolean(error) &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "42P01"
  );
}

async function markFeedbackWhatsAppJobCompleted(jobId) {
  await pool.query(
    `
      UPDATE "FeedbackWhatsAppJob"
      SET
        "status" = 'COMPLETED',
        "completedAt" = NOW(),
        "lastError" = NULL
      WHERE "id" = $1
    `,
    [jobId],
  );
}

async function markFeedbackWhatsAppJobFailed(jobId, attempts, error) {
  const maxAttempts = getMaxFeedbackAttempts();
  const hasRetriesRemaining = attempts < maxAttempts;

  if (!hasRetriesRemaining) {
    await pool.query(
      `
        UPDATE "FeedbackWhatsAppJob"
        SET
          "status" = 'FAILED',
          "lastError" = $2,
          "processingStartedAt" = NULL
        WHERE "id" = $1
      `,
      [jobId, toErrorMessage(error)],
    );
    return { exhaustedRetries: true };
  }

  await pool.query(
    `
      UPDATE "FeedbackWhatsAppJob"
      SET
        "status" = 'FAILED',
        "availableAt" = $2,
        "lastError" = $3,
        "processingStartedAt" = NULL
      WHERE "id" = $1
    `,
    [jobId, getRetryDate(attempts), toErrorMessage(error)],
  );
  return { exhaustedRetries: false };
}

export async function processFeedbackWhatsAppJobs(limit = DEFAULT_MAX_JOBS_PER_RUN) {
  const normalizedLimit =
    Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_MAX_JOBS_PER_RUN;
  const maxAttempts = getMaxFeedbackAttempts();
  let jobs = [];
  try {
    jobs = await claimFeedbackWhatsAppJobs(normalizedLimit, maxAttempts);
  } catch (error) {
    if (isMissingFeedbackQueueTableError(error)) {
      console.warn(
        '[queue-worker] Skipping feedback WhatsApp queue: table "FeedbackWhatsAppJob" does not exist yet. Apply latest migrations.',
      );
      return {
        failed: 0,
        processed: 0,
      };
    }

    throw error;
  }

  let processed = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      const templateLanguage = normalizeLanguageForTemplate(job.language);
      const templateSid = resolveFeedbackTemplateSid(templateLanguage);
      console.log(
        `[queue-worker] triggering feedback WhatsApp send order=${job.orderId} job=${job.id} language=${templateLanguage}`,
      );

      await sendFeedbackTemplateWhatsAppMessageWithFallback({
        customerPhone: job.customerPhone,
        contentSid: templateSid,
        orderId: job.orderId,
      });

      await markFeedbackWhatsAppJobCompleted(job.id);
      console.log(
        `[queue-worker] feedback WhatsApp sent order=${job.orderId} job=${job.id}`,
      );
      processed += 1;
    } catch (error) {
      const failResult = await markFeedbackWhatsAppJobFailed(
        job.id,
        job.attempts,
        error,
      );
      console.error(
        `[queue-worker] feedback WhatsApp failed order=${job.orderId} job=${job.id}:`,
        error,
      );
      if (failResult.exhaustedRetries) {
        console.warn(
          `[queue-worker] feedback WhatsApp retries exhausted order=${job.orderId} job=${job.id} attempts=${job.attempts} maxAttempts=${maxAttempts}`,
        );
      }
      failed += 1;
    }
  }

  return {
    failed,
    processed,
  };
}
