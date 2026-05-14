import type {
  ForwardLegacyWebApiInput,
  ForwardLegacyWebApiOutput,
  LegacyWebApiGateway,
} from "../ports/LegacyWebApiGateway.js";

export class ForwardLegacyWebApiUseCase {
  constructor(private readonly legacyWebApiGateway: LegacyWebApiGateway) {}

  async execute(
    input: ForwardLegacyWebApiInput,
  ): Promise<ForwardLegacyWebApiOutput> {
    return this.legacyWebApiGateway.forward(input);
  }
}
