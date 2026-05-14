import { ForwardLegacyWebApiUseCase } from "../application/use-cases/ForwardLegacyWebApiUseCase.js";
import { FetchLegacyWebApiGateway } from "../infrastructure/http/FetchLegacyWebApiGateway.js";
import { ForwardLegacyWebApiController } from "../presentation/controllers/ForwardLegacyWebApiController.js";

export function makeForwardLegacyWebApiController() {
  const legacyWebApiGateway = new FetchLegacyWebApiGateway();
  const useCase = new ForwardLegacyWebApiUseCase(legacyWebApiGateway);

  return new ForwardLegacyWebApiController(useCase);
}
