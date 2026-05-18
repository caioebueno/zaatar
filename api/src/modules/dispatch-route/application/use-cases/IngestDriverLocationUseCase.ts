import { DriverActiveDispatchNotFoundError } from "../errors/DriverActiveDispatchNotFoundError.js";
import type { DispatchRouteRepository } from "../ports/DispatchRouteRepository.js";
import { normalizeDriverId, normalizeLocationPoint } from "./dispatchRouteParsing.js";

export type IngestDriverLocationInput = {
  driverId: unknown;
  location: unknown;
};

export type IngestDriverLocationOutput = {
  dispatchId: string;
  insertedCount: number;
  lastSequence: number;
  sessionId: string;
};

export class IngestDriverLocationUseCase {
  constructor(private readonly repository: DispatchRouteRepository) {}

  async execute(
    input: IngestDriverLocationInput,
  ): Promise<IngestDriverLocationOutput> {
    const driverId = normalizeDriverId(input.driverId);
    const point = normalizeLocationPoint(input.location);

    const dispatchId = await this.repository.findActiveDispatchIdForDriver(driverId);
    if (!dispatchId) {
      throw new DriverActiveDispatchNotFoundError();
    }

    let session = await this.repository.findActiveSession(dispatchId, driverId);
    if (!session) {
      session = await this.repository.createSession({
        dispatchId,
        driverId,
        startedAt: new Date(),
      });
    }

    const result = await this.repository.insertPointsBatch(session.id, [point]);
    if (result.insertedCount > 0) {
      await this.repository.enqueueEtaRecalculation(dispatchId);
    }

    return {
      dispatchId,
      sessionId: session.id,
      insertedCount: result.insertedCount,
      lastSequence: result.lastSequence,
    };
  }
}
