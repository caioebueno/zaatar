"use server";

import { getOrdersByStationUseCase } from "@/src/modules/station/application/getOrdersByStation";
import { prismaStationRepository } from "@/src/modules/station/infrastructure/prisma/prismaStationRepository";
import { TOrder } from "./types/order";

export default async function getOrdersByStation(
  stationId: string,
): Promise<TOrder[]> {
  return getOrdersByStationUseCase(prismaStationRepository, stationId);
}
