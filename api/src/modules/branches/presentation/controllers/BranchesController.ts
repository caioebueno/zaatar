import { BusinessContextRequiredError } from "../../../onboarding/application/errors/BusinessContextRequiredError.js";
import { BusinessNotFoundError } from "../../../onboarding/application/errors/BusinessNotFoundError.js";
import { InvalidOnboardingPayloadError } from "../../../onboarding/application/errors/InvalidOnboardingPayloadError.js";
import type { CreateBranchUseCase } from "../../application/use-cases/CreateBranchUseCase.js";
import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";

export class BranchesController implements HttpController {
  constructor(private readonly createBranchUseCase: CreateBranchUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const url = new URL(request.path, "http://localhost");
    const pathname = url.pathname;

    try {
      if (request.method === "POST" && pathname === "/businesses/current/branches") {
        const body = toObject(request.body);
        const result = await this.createBranchUseCase.execute({
          businessId: request.auth?.businessId,
          name: body.name,
          addressDescription: body.addressDescription,
          addressGoogleMapsUrl: body.addressGoogleMapsUrl,
          mapboxPlaceId: body.mapboxPlaceId,
          mapboxLatitude: body.mapboxLatitude,
          mapboxLongitude: body.mapboxLongitude,
          addressStreet: body.addressStreet,
          addressNumber: body.addressNumber,
          addressCity: body.addressCity,
          addressState: body.addressState,
          addressZipCode: body.addressZipCode,
          addressComplement: body.addressComplement,
          addressNumberComplement: body.addressNumberComplement,
          operationHours: body.operationHours,
        });

        return {
          statusCode: 201,
          body: result,
        };
      }

      return {
        statusCode: 404,
        body: { error: "Not found" },
      };
    } catch (error) {
      if (error instanceof BusinessContextRequiredError) {
        return {
          statusCode: 400,
          body: {
            error: "Invalid payload",
            field: "businessId",
            reason: "BUSINESS_CONTEXT_REQUIRED",
          },
        };
      }

      if (error instanceof BusinessNotFoundError) {
        return {
          statusCode: 404,
          body: {
            error: "Business not found",
          },
        };
      }

      if (error instanceof InvalidOnboardingPayloadError) {
        return {
          statusCode: 400,
          body: {
            error: "Invalid payload",
            field: error.field,
          },
        };
      }

      throw error;
    }
  }
}

function toObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}
