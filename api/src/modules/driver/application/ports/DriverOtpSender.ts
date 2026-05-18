export type DriverOtpChannel = "WHATSAPP" | "SMS";

export type SendDriverOtpMessageInput = {
  code: string;
  language?: string;
  phone: string;
  sendAlsoSms?: boolean;
  sendAlsoWhatsApp?: boolean;
  channel: DriverOtpChannel;
};

export type DriverOtpSender = {
  send(input: SendDriverOtpMessageInput): Promise<void>;
};
