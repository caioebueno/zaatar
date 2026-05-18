import { DriverDispatchAccessDeniedError } from "../errors/DriverDispatchAccessDeniedError.js";
import type {
  DispatchRouteRepository,
  DispatchRouteSessionRecord,
} from "../ports/DispatchRouteRepository.js";
import {
  normalizeDispatchId,
  normalizeDriverId,
} from "./dispatchRouteParsing.js";

export type StartDispatchRouteSessionInput = {
  dispatchId: unknown;
  driverId: unknown;
};

export type StartDispatchRouteSessionOutput = {
  created: boolean;
  session: DispatchRouteSessionRecord;
};

export class StartDispatchRouteSessionUseCase {
  constructor(private readonly repository: DispatchRouteRepository) {}

  async execute(
    input: StartDispatchRouteSessionInput,
  ): Promise<StartDispatchRouteSessionOutput> {
    const dispatchId = normalizeDispatchId(input.dispatchId);
    const driverId = normalizeDriverId(input.driverId);
    const startedAt = new Date();

    const driverOwnsDispatch = await this.repository.driverOwnsDispatch(
      dispatchId,
      driverId,
    );
    if (!driverOwnsDispatch) {
      throw new DriverDispatchAccessDeniedError();
    }

    const activeSession = await this.repository.findActiveSession(dispatchId, driverId);
    if (activeSession) {
      return {
        created: false,
        session: activeSession,
      };
    }

    const createdSession = await this.repository.createSession({
      dispatchId,
      driverId,
      startedAt,
    });

    return {
      created: true,
      session: createdSession,
    };
  }
}
