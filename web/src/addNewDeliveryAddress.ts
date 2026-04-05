"use server";

import {
  calculateDeliveryFeeInCents,
  MAX_DELIVERY_DISTANCE_KM,
} from "@/utils/calculateDeliveryFee";
import getMapboxRouteDistanceInKm from "@/utils/getMapboxRouteDistanceInKm";
import prisma from "../prisma";
import TAddress from "./types/address";
import { randomUUID } from "crypto";

type TAddNewDeliveryAddress = {
  address: TAddress;
};

type Coordinates = {
  lat: number;
  lng: number;
};

const BRANCH_COORDINATES: Coordinates = {
  lat: 28.34883080351401,
  lng: -81.65145586075074,
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
    customerId: address.customerId || undefined,
    numberComplement: address.numberComplement || undefined,
    deliveryFee: address.deliveryFee,
  };
}

const addNewDeliveryAddress = async (
  data: TAddNewDeliveryAddress,
): Promise<TAddress> => {
  const customerCoordinates = {
    lat: Number(data.address.lat),
    lng: Number(data.address.lng),
  };

  if (
    !Number.isFinite(customerCoordinates.lat) ||
    !Number.isFinite(customerCoordinates.lng)
  ) {
    throw new Error("Invalid delivery address coordinates");
  }

  const deliveryDistanceInKm = await getMapboxRouteDistanceInKm(
    BRANCH_COORDINATES,
    customerCoordinates,
  );

  if (deliveryDistanceInKm > MAX_DELIVERY_DISTANCE_KM) {
    throw new Error("OUTSIDE_DELIVERY_COVERAGE_AREA");
  }

  const deliveryFee = calculateDeliveryFeeInCents(deliveryDistanceInKm);

  const [createdAddress] = await prisma.$queryRaw<DeliveryAddressRow[]>`
    INSERT INTO "DeliveryAddress" (
      "id",
      "State",
      "city",
      "description",
      "lat",
      "lng",
      "street",
      "zipCode",
      "complement",
      "customerId",
      "numberComplement",
      "number",
      "deliveryFee"
    )
    VALUES (
      ${randomUUID()},
      ${data.address.state},
      ${data.address.city},
      ${data.address.description},
      ${data.address.lat},
      ${data.address.lng},
      ${data.address.street},
      ${data.address.zipCode},
      ${data.address.complement ?? null},
      ${data.address.customerId ?? null},
      ${data.address.numberComplement ?? null},
      ${data.address.number},
      ${deliveryFee}
    )
    RETURNING
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
  `;

  return mapDeliveryAddress(createdAddress);
};

export default addNewDeliveryAddress;
