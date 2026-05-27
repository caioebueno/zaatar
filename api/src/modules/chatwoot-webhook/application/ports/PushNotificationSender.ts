export type SendPushNotificationInput = {
  body: string;
  data?: Record<string, unknown>;
  title: string;
  tokens: string[];
};

export type PushNotificationSender = {
  send: (input: SendPushNotificationInput) => Promise<void>;
};
