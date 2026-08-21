import type {
  OrdersByStationItem,
  OrdersRepository,
} from "../ports/OrdersRepository.js";

export type GetOrdersByStationInput = {
  stationId: string;
};

function buildRecentWindow(referenceDate: Date) {
  return {
    start: new Date(referenceDate.getTime() - 24 * 60 * 60 * 1000),
    end: referenceDate,
  };
}

export class GetOrdersByStationUseCase {
  constructor(private readonly repository: OrdersRepository) {}

  async execute(input: GetOrdersByStationInput): Promise<OrdersByStationItem[]> {
    return this.repository.findByStation(
      input.stationId,
      buildRecentWindow(new Date()),
    );
  }
}
