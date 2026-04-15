"use server";

import prisma from "../prisma";
import TCustomer from "./types/customer";
import { randomUUID } from "node:crypto";
import TAddress from "./types/address";
import {
  buildPhoneCandidates,
  normalizePhoneWithCountryCode,
} from "./phone";

type TGetCustomerData = {
  phone: string;
};

type DeliveryAddressRow = {
  id: string;
  createdAt: Date;
  lat: string;
  lng: string;
  deliveryFee: number;
  city: string;
  zipCode: string;
  State: string;
  street: string;
  number: string;
  description: string;
  complement: string | null;
  numberComplement: string | null;
  customerId: string | null;
};

function mapDeliveryAddress(address: DeliveryAddressRow): TAddress {
  return {
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
    deliveryFee: address.deliveryFee,
  };
}

const getCustomerData = async (data: TGetCustomerData): Promise<TCustomer> => {
  const normalizedPhone = normalizePhoneWithCountryCode(data.phone);

  if (!normalizedPhone) {
    throw {
      code: "INVALID_PARAMS",
      details: { field: "phone" },
    };
  }

  const findCustomer = await prisma.customer.findFirst({
    where: {
      phone: {
        in: buildPhoneCandidates(data.phone),
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  if (!findCustomer) {
    const createdCustomer = await prisma.customer.create({
      data: {
        id: randomUUID(),
        phone: normalizedPhone,
      },
    });
    return {
      id: createdCustomer.id,
      name: createdCustomer.name,
    };
  }

  if (findCustomer.phone !== normalizedPhone) {
    await prisma.customer.update({
      where: {
        id: findCustomer.id,
      },
      data: {
        phone: normalizedPhone,
      },
    });
  }

  const addresses = await prisma.$queryRaw<DeliveryAddressRow[]>`
    SELECT
      "id",
      "createdAt",
      "lat",
      "lng",
      "deliveryFee",
      "city",
      "zipCode",
      "State",
      "street",
      "number",
      "description",
      "complement",
      "numberComplement",
      "customerId"
    FROM "DeliveryAddress"
    WHERE "customerId" = ${findCustomer.id}
    ORDER BY "createdAt" DESC
  `;

  return {
    id: findCustomer.id,
    name: findCustomer.name,
    addresses: addresses.map(mapDeliveryAddress),
  };
};

export default getCustomerData;
