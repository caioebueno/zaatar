"use server";

import { add } from "date-fns";
import prisma from "../prisma";
import TCustomer from "./types/customer";
import { randomUUID } from "node:crypto";

type TGetCustomerData = {
  phone: string;
};

const getCustomerData = async (data: TGetCustomerData): Promise<TCustomer> => {
  const findCustomer = await prisma.customer.findFirst({
    where: {
      phone: data.phone,
    },
    include: {
      addresses: true,
    },
  });
  if (!findCustomer) {
    const createdCustomer = await prisma.customer.create({
      data: {
        id: randomUUID(),
        phone: data.phone,
      },
    });
    return {
      id: createdCustomer.id,
      name: createdCustomer.name,
    };
  }
  return {
    id: findCustomer.id,
    name: findCustomer.name,
    addresses: findCustomer.addresses.map((address) => ({
      id: address.id,
      city: address.city,
      createdAt: address.createdAt.toISOString(),
      description: address.description,
      lat: address.lat,
      lng: address.lng,
      number: address.number,
      state: address.State,
      street: address.street,
      zipCode: address.zipCode,
      complement: address.complement || undefined,
      numberComplement: address.numberComplement || undefined,
      customerId: address.customerId || undefined,
    })),
  };
};

export default getCustomerData;
