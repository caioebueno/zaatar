import { DriverDispatchAccessDeniedError } from "../errors/DriverDispatchAccessDeniedError.js";
import { DispatchRouteSessionClosedError } from "../errors/DispatchRouteSessionClosedError.js";
import type { DispatchRouteRepository } from "../ports/DispatchRouteRepository.js";
import {
  normalizeDispatchId,
  normalizeDriverId,
  normalizePoints,
} from "./dispatchRouteParsing.js";

export type AddDispatchRoutePointsBatchInput = {
  dispatchId: unknown;
  driverId: unknown;
  points: unknown;
};

export type AddDispatchRoutePointsBatchOutput = {
  ignored: boolean;
  insertedCount: number;
  lastSequence: number;
  sessionId: string | null;
};

export class AddDispatchRoutePointsBatchUseCase {
  constructor(private readonly repository: DispatchRouteRepository) {}

  async execute(
    input: AddDispatchRoutePointsBatchInput,
  ): Promise<AddDispatchRoutePointsBatchOutput> {
    const dispatchId = normalizeDispatchId(input.dispatchId);
    const driverId = normalizeDriverId(input.driverId);
    const points = normalizePoints(input.points);

    const activeDispatchId = await this.repository.findActiveDispatchIdForDriver(driverId);
    if (!activeDispatchId || activeDispatchId !== dispatchId) {
      return {
        ignored: true,
        sessionId: null,
        insertedCount: 0,
        lastSequence: 0,
      };
    }

    const driverOwnsDispatch = await this.repository.driverOwnsDispatch(
      dispatchId,
      driverId,
    );
    if (!driverOwnsDispatch) {
      throw new DriverDispatchAccessDeniedError();
    }

    const session = await this.repository.findActiveSession(dispatchId, driverId);
    if (!session) {
      return {
        ignored: true,
        sessionId: null,
        insertedCount: 0,
        lastSequence: 0,
      };
    }

    if (session.status !== "ACTIVE") {
      throw new DispatchRouteSessionClosedError();
    }

    const result = await this.repository.insertPointsBatch(session.id, points);
    if (result.insertedCount > 0) {
      await this.repository.enqueueEtaRecalculation(dispatchId);
    }

    return {
      ignored: false,
      sessionId: session.id,
      insertedCount: result.insertedCount,
      lastSequence: result.lastSequence,
    };
  }
}
