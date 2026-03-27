"use server";

import prisma from "../prisma";
import TCustomer from "./types/customer";

type TUpdateCustomerName = {
  customerId: string;
  name: string;
};

const updateCustomerName = async (
  data: TUpdateCustomerName,
): Promise<TCustomer> => {
  const customer = await prisma.customer.update({
    where: {
      id: data.customerId,
    },
    data: {
      name: data.name,
    },
  });
  return {
    id: customer.id,
    name: customer.name,
  };
};

export default updateCustomerName;
