import { PrismaPaymentsRepository } from "../infrastructure/prisma/PrismaPaymentsRepository.js";
import { PaymentsController } from "../presentation/controllers/PaymentsController.js";

export function makePaymentsController() {
  const repository = new PrismaPaymentsRepository();
  return new PaymentsController(repository);
}
