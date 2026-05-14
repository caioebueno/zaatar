import type {
  UberEatsConnectionRepository,
  UberEatsConnectionView,
} from "../ports/UberEatsConnectionRepository.js";

export class GetUberEatsConnectionUseCase {
  constructor(private readonly repository: UberEatsConnectionRepository) {}

  async execute(userId: string): Promise<UberEatsConnectionView | null> {
    return this.repository.findForUser(userId);
  }
}
