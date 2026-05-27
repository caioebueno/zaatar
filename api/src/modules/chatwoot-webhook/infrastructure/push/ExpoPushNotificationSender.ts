import type {
  PushNotificationSender,
  SendPushNotificationInput,
} from "../../application/ports/PushNotificationSender.js";

type ExpoPushMessage = {
  body: string;
  data?: Record<string, unknown>;
  priority: "high";
  sound: "default";
  title: string;
  to: string;
};

export class ExpoPushNotificationSender implements PushNotificationSender {
  async send(input: SendPushNotificationInput): Promise<void> {
    const tokens = input.tokens
      .map((token) => token.trim())
      .filter((token) => token.length > 0);

    if (tokens.length === 0) {
      return;
    }

    const messages: ExpoPushMessage[] = tokens.map((token) => ({
      to: token,
      title: input.title,
      body: input.body,
      sound: "default",
      priority: "high",
      data: input.data,
    }));

    const endpoint = resolveExpoPushEndpoint();
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    const accessToken = process.env.EXPO_ACCESS_TOKEN?.trim();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(
        `EXPO_PUSH_REQUEST_FAILED (${response.status}): ${errorBody}`,
      );
    }

    const parsed = (await response.json().catch(() => null)) as
      | {
          data?: Array<{ details?: { error?: string }; status?: string }>;
          errors?: Array<{ message?: string }>;
        }
      | null;

    const globalErrors = parsed?.errors ?? [];
    if (globalErrors.length > 0) {
      throw new Error(
        `EXPO_PUSH_REQUEST_FAILED: ${globalErrors
          .map((item) => item.message || "unknown")
          .join(", ")}`,
      );
    }

    const ticketError = parsed?.data?.find((item) => item.status === "error");
    if (ticketError) {
      throw new Error(
        `EXPO_PUSH_TICKET_ERROR: ${ticketError.details?.error ?? "UNKNOWN"}`,
      );
    }
  }
}

function resolveExpoPushEndpoint(): string {
  return (
    process.env.EXPO_PUSH_API_BASE_URL?.trim() ??
    "https://exp.host/--/api/v2/push/send"
  );
}
