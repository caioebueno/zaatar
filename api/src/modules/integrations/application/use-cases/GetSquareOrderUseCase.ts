import type { SquareOrdersGateway } from "../ports/SquareOrdersGateway.js";

export class GetSquareOrderUseCase {
  constructor(private readonly squareOrdersGateway: SquareOrdersGateway) {}

  async execute(input: { orderId: string }): Promise<{
    environment: "PRODUCTION" | "SANDBOX";
    order: unknown;
  }> {
    const result = await this.squareOrdersGateway.retrieveOrder({
      orderId: input.orderId,
    });

    return {
      environment: resolveSquareEnvironment(),
      order: result.order,
    };
  }
}

function resolveSquareEnvironment(): "PRODUCTION" | "SANDBOX" {
  const normalized = process.env.SQUARE_ENVIRONMENT?.trim().toUpperCase();
  return normalized === "PRODUCTION" ? "PRODUCTION" : "SANDBOX";
}
