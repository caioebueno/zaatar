import type {
  OrdersByStationItem,
  OrdersRepository,
} from "../ports/OrdersRepository.js";

export type GetOrdersByStationInput = {
  stationId: string;
};

function buildDayWindow(referenceDate: Date) {
  return {
    start: new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate(),
      0,
      0,
      0,
      0,
    ),
    end: new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate() + 1,
      0,
      0,
      0,
      0,
    ),
  };
}

export class GetOrdersByStationUseCase {
  constructor(private readonly repository: OrdersRepository) {}

  async execute(input: GetOrdersByStationInput): Promise<OrdersByStationItem[]> {
    return this.repository.findByStation(
      input.stationId,
      buildDayWindow(new Date()),
    );
  }
}
