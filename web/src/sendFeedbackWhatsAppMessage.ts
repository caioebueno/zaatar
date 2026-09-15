/**
 * Customer WhatsApp notifications are sent by the API queue worker.
 * Kept as a no-op while legacy web callers are removed.
 */
export default async function sendFeedbackWhatsAppMessage(input: {
  customerPhone: string;
  orderId: string;
  language?: string | null;
}): Promise<void> {
  console.info(
    `[feedback-whatsapp] skipped web send order=${input.orderId}; API queue worker owns customer notifications`,
  );
}
