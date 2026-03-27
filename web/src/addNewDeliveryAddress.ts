"use server";

import prisma from "../prisma";
import TAddress from "./types/address";
import { randomUUID } from "crypto";

type TAddNewDeliveryAddress = {
  address: TAddress;
};

const addNewDeliveryAddress = async (
  data: TAddNewDeliveryAddress,
): Promise<TAddress> => {
  const createdAddress = await prisma.deliveryAddress.create({
    data: {
      id: randomUUID(),
      State: data.address.state,
      city: data.address.city,
      description: data.address.description,
      lat: data.address.lat,
      lng: data.address.lng,
      street: data.address.street,
      zipCode: data.address.zipCode,
      complement: data.address.complement,
      customerId: data.address.customerId,
      numberComplement: data.address.numberComplement,
      number: data.address.number,
    },
  });
  return {
    id: createdAddress.id,
    city: createdAddress.city,
    createdAt: createdAddress.createdAt.toISOString(),
    description: createdAddress.description,
    lat: createdAddress.lat,
    lng: createdAddress.lng,
    number: createdAddress.number,
    state: createdAddress.State,
    street: createdAddress.street,
    zipCode: createdAddress.zipCode,
    complement: createdAddress.complement || undefined,
    customerId: createdAddress.customerId || undefined,
    numberComplement: createdAddress.numberComplement || undefined,
  };
};

export default addNewDeliveryAddress;
