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

type CustomerRewardRow = {
  id: string;
  type: "FREE_PRODUCT" | "PERCENT_DISCOUNT" | "FIXED_DISCOUNT" | "CUSTOM";
  title: string;
  description: string | null;
  quantity: number | null;
  value: number | null;
  productId: string | null;
  productName: string | null;
  expiresAt: Date | null;
};

type CustomerCardRow = {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
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

  const rewards = await prisma.$queryRaw<CustomerRewardRow[]>`
    SELECT
      cr."id",
      cr."type",
      cr."title",
      cr."description",
      cr."quantity",
      cr."value",
      cr."productId",
      p."name" AS "productName",
      cr."expiresAt"
    FROM "CustomerReward" cr
    LEFT JOIN "Product" p ON p."id" = cr."productId"
    WHERE cr."customerId" = ${findCustomer.id}
      AND cr."status" = 'ACTIVE'
      AND (cr."expiresAt" IS NULL OR cr."expiresAt" >= NOW())
    ORDER BY cr."createdAt" DESC
  `;

  const cards = await prisma.$queryRaw<CustomerCardRow[]>`
    SELECT
      "id",
      "brand",
      "last4",
      "expMonth",
      "expYear",
      "isDefault"
    FROM "CustomerCard"
    WHERE "customerId" = ${findCustomer.id}
    ORDER BY "isDefault" DESC, "createdAt" ASC
  `;

  return {
    id: findCustomer.id,
    name: findCustomer.name,
    addresses: addresses.map(mapDeliveryAddress),
    cards: cards.map((card) => ({
      id: card.id,
      brand: card.brand,
      last4: card.last4,
      expMonth: card.expMonth,
      expYear: card.expYear,
      isDefault: card.isDefault,
    })),
    rewards: rewards.map((reward) => ({
      id: reward.id,
      type: reward.type,
      title: reward.title,
      description: reward.description,
      quantity: reward.quantity,
      value: reward.value,
      productId: reward.productId,
      productName: reward.productName,
      expiresAt: reward.expiresAt ? reward.expiresAt.toISOString() : null,
    })),
  };
};

export default getCustomerData;
