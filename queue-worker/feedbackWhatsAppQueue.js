import { Pool } from "pg";

const DEFAULT_MAX_JOBS_PER_RUN = 10;

const DEFAULT_TWILIO_FEEDBACK_TEMPLATE_SID_EN =
  "HXaf24fd36c9b384c0d481b79cbb9ac3d1";
const DEFAULT_TWILIO_FEEDBACK_TEMPLATE_SID_PT =
  "HXf431688a42986b9789d51c36509d5fea";
const DEFAULT_TWILIO_FEEDBACK_TEMPLATE_SID_ES =
  "HX31a99745530e5c4083a657ed30a61dea";

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

function normalizePhoneWithCountryCode(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;

  const countryCode = (process.env.WHATSAPP_COUNTRY_CODE?.trim() || "1").replace(
    /\D/g,
    "",
  );

  if (!countryCode) return digits;
  if (digits.startsWith(countryCode)) return digits;
  return `${countryCode}${digits}`;
}

function toWhatsAppAddress(phone) {
  const normalized = normalizePhoneWithCountryCode(phone);
  if (!normalized) return undefined;
  return `whatsapp:+${normalized}`;
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
  const config = getTwilioConfig();
  const toAddress = toWhatsAppAddress(input.customerPhone);

  if (!toAddress) {
    throw new Error("Invalid customer phone for WhatsApp template send.");
  }

  const endpoint = `${config.baseUrl}/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
  const params = new URLSearchParams({
    To: toAddress,
    ContentSid: input.contentSid,
    ContentVariables: JSON.stringify({
      "1": input.orderId,
    }),
  });

  if (config.messagingServiceSid) {
    params.set("MessagingServiceSid", config.messagingServiceSid);
  } else if (config.fromWhatsAppAddress) {
    params.set("From", config.fromWhatsAppAddress);
  }

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
    throw new Error(
      `Twilio WhatsApp API request failed (${response.status}): ${errorBody}`,
    );
  }
}

async function claimFeedbackWhatsAppJobs(limit) {
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
      [limit],
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
  await pool.query(
    `
      UPDATE "FeedbackWhatsAppJob"
      SET
        "status" = 'FAILED',
        "availableAt" = $2,
        "lastError" = $3
      WHERE "id" = $1
    `,
    [jobId, getRetryDate(attempts), toErrorMessage(error)],
  );
}

export async function processFeedbackWhatsAppJobs(limit = DEFAULT_MAX_JOBS_PER_RUN) {
  const normalizedLimit =
    Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_MAX_JOBS_PER_RUN;
  let jobs = [];
  try {
    jobs = await claimFeedbackWhatsAppJobs(normalizedLimit);
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

      await sendFeedbackTemplateWhatsAppMessage({
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
      await markFeedbackWhatsAppJobFailed(job.id, job.attempts, error);
      console.error(
        `[queue-worker] feedback WhatsApp failed order=${job.orderId} job=${job.id}:`,
        error,
      );
      failed += 1;
    }
  }

  return {
    failed,
    processed,
  };
}
