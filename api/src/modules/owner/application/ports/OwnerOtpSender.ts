export type SendOwnerOtpInput = {
  code: string;
  phone: string;
  language?: string;
};

export type OwnerOtpSender = {
  send(input: SendOwnerOtpInput): Promise<void>;
};
