import type { SquareLocationSummary, SquareOrdersGateway } from "../ports/SquareOrdersGateway.js";

export class ListSquareLocationsUseCase {
  constructor(private readonly squareOrdersGateway: SquareOrdersGateway) {}

  async execute(): Promise<{
    environment: "PRODUCTION" | "SANDBOX";
    locations: SquareLocationSummary[];
  }> {
    return {
      environment: resolveSquareEnvironment(),
      locations: await this.squareOrdersGateway.listLocations(),
    };
  }
}

function resolveSquareEnvironment(): "PRODUCTION" | "SANDBOX" {
  const normalized = process.env.SQUARE_ENVIRONMENT?.trim().toUpperCase();
  return normalized === "PRODUCTION" ? "PRODUCTION" : "SANDBOX";
}
