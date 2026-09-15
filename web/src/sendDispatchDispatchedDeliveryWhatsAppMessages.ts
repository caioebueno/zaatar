import type { Dispatch } from "@/src/modules/dispatch/domain/dispatch.types";

/**
 * Customer WhatsApp notifications are sent by the API queue worker.
 * Kept as a no-op while legacy web callers are removed.
 */
export default async function sendDispatchDispatchedDeliveryWhatsAppMessages(
  dispatch: Dispatch,
): Promise<void> {
  console.info(
    `[dispatch-whatsapp] skipped web send dispatch=${dispatch.id}; API queue worker owns customer notifications`,
  );
}
