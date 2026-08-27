import { ForwardLegacyWebApiUseCase } from "../../catalog/application/use-cases/ForwardLegacyWebApiUseCase.js";
import { FetchLegacyWebApiGateway } from "../../catalog/infrastructure/http/FetchLegacyWebApiGateway.js";
import { InventoryLegacyApiController } from "../presentation/controllers/InventoryLegacyApiController.js";

export function makeInventoryLegacyApiController() {
  const legacyWebApiGateway = new FetchLegacyWebApiGateway();
  const useCase = new ForwardLegacyWebApiUseCase(legacyWebApiGateway);

  return new InventoryLegacyApiController(useCase);
}
