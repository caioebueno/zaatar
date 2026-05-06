import TAddress from "./address";

export type TCustomerCard = {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault?: boolean;
};

export type TCustomerReward = {
  id: string;
  type: "FREE_PRODUCT" | "PERCENT_DISCOUNT" | "FIXED_DISCOUNT" | "CUSTOM";
  title: string;
  description?: string | null;
  quantity?: number | null;
  value?: number | null;
  productId?: string | null;
  productName?: string | null;
  expiresAt?: string | null;
};

type TCustomer = {
  id: string;
  name: string | null;
  phone?: string | null;
  addresses?: TAddress[];
  rewards?: TCustomerReward[];
  cards?: TCustomerCard[];
};

export default TCustomer;
