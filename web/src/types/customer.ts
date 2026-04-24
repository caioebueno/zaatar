import TAddress from "./address";

type TCustomer = {
  id: string;
  name: string | null;
  phone?: string | null;
  addresses?: TAddress[];
};

export default TCustomer;
