import type {
  DispatchRouteRepository,
  DispatchRouteSessionWithPoints,
} from "../ports/DispatchRouteRepository.js";
import { normalizeDispatchId } from "./dispatchRouteParsing.js";

export type GetDispatchRouteInput = {
  dispatchId: unknown;
};

export type GetDispatchRouteOutput = {
  dispatchId: string;
  sessions: DispatchRouteSessionWithPoints[];
};

export class GetDispatchRouteUseCase {
  constructor(private readonly repository: DispatchRouteRepository) {}

  async execute(input: GetDispatchRouteInput): Promise<GetDispatchRouteOutput> {
    const dispatchId = normalizeDispatchId(input.dispatchId);
    const sessions = await this.repository.listSessionsByDispatchId(dispatchId);

    return {
      dispatchId,
      sessions,
    };
  }
}

