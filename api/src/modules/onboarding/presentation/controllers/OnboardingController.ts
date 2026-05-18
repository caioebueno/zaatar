import { BusinessContextRequiredError } from "../../application/errors/BusinessContextRequiredError.js";
import { BusinessNotFoundError } from "../../application/errors/BusinessNotFoundError.js";
import { BranchNotFoundError } from "../../application/errors/BranchNotFoundError.js";
import { InvalidOnboardingPayloadError } from "../../application/errors/InvalidOnboardingPayloadError.js";
import { StripeNotConfiguredError } from "../../application/errors/StripeNotConfiguredError.js";
import { StripeRequestFailedError } from "../../application/errors/StripeRequestFailedError.js";
import type { CreateStripeOnboardingLinkUseCase } from "../../application/use-cases/CreateStripeOnboardingLinkUseCase.js";
import type { CreateOnboardingBranchUseCase } from "../../application/use-cases/CreateOnboardingBranchUseCase.js";
import type { DeleteOnboardingBranchUseCase } from "../../application/use-cases/DeleteOnboardingBranchUseCase.js";
import type { GetBusinessOnboardingStatusUseCase } from "../../application/use-cases/GetBusinessOnboardingStatusUseCase.js";
import type { RefreshStripeOnboardingStatusUseCase } from "../../application/use-cases/RefreshStripeOnboardingStatusUseCase.js";
import type { UpdateStripeBankingProfileUseCase } from "../../application/use-cases/UpdateStripeBankingProfileUseCase.js";
import type { UpdateBusinessOnboardingBasicInfoUseCase } from "../../application/use-cases/UpdateBusinessOnboardingBasicInfoUseCase.js";
import type { UpdateOnboardingBranchUseCase } from "../../application/use-cases/UpdateOnboardingBranchUseCase.js";
import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";

export class OnboardingController implements HttpController {
  constructor(
    private readonly getOnboardingStatusUseCase: GetBusinessOnboardingStatusUseCase,
    private readonly updateBusinessBasicInfoUseCase: UpdateBusinessOnboardingBasicInfoUseCase,
    private readonly createOnboardingBranchUseCase: CreateOnboardingBranchUseCase,
    private readonly updateOnboardingBranchUseCase: UpdateOnboardingBranchUseCase,
    private readonly deleteOnboardingBranchUseCase: DeleteOnboardingBranchUseCase,
    private readonly createStripeOnboardingLinkUseCase: CreateStripeOnboardingLinkUseCase,
    private readonly refreshStripeOnboardingStatusUseCase: RefreshStripeOnboardingStatusUseCase,
    private readonly updateStripeBankingProfileUseCase: UpdateStripeBankingProfileUseCase,
  ) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const url = new URL(request.path, "http://localhost");
    const pathname = url.pathname;

    try {
      if (request.method === "GET" && pathname === "/businesses/current/onboarding") {
        const result = await this.getOnboardingStatusUseCase.execute({
          businessId: request.auth?.businessId,
        });

        return {
          statusCode: 200,
          body: result,
        };
      }

      if (request.method === "PATCH" && pathname === "/businesses/current/onboarding") {
        const body = toObject(request.body);
        const result = await this.updateBusinessBasicInfoUseCase.execute({
          businessId: request.auth?.businessId,
          name: body.name,
          brandColor: body.brandColor,
          logoUrl: body.logoUrl,
          bannerPhotoUrl: body.bannerPhotoUrl,
        });

        return {
          statusCode: 200,
          body: result,
        };
      }

      if (
        request.method === "POST" &&
        pathname === "/businesses/current/onboarding/branches"
      ) {
        const body = toObject(request.body);
        const result = await this.createOnboardingBranchUseCase.execute({
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

      if (
        request.method === "PATCH" &&
        pathname.startsWith("/businesses/current/onboarding/branches/")
      ) {
        const branchId = pathname.split("/").at(-1) ?? "";
        const body = toObject(request.body);
        const result = await this.updateOnboardingBranchUseCase.execute({
          businessId: request.auth?.businessId,
          branchId,
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
          statusCode: 200,
          body: result,
        };
      }

      if (
        request.method === "DELETE" &&
        pathname.startsWith("/businesses/current/onboarding/branches/")
      ) {
        const branchId = pathname.split("/").at(-1) ?? "";
        await this.deleteOnboardingBranchUseCase.execute({
          businessId: request.auth?.businessId,
          branchId,
        });

        return {
          statusCode: 204,
          body: {},
        };
      }

      if (
        request.method === "POST" &&
        pathname === "/integrations/stripe/connect/onboarding-link"
      ) {
        const body = toObject(request.body);
        const result = await this.createStripeOnboardingLinkUseCase.execute({
          businessId: request.auth?.businessId,
          userId: request.auth?.userId ?? "",
          ownerEmail: request.auth?.email ?? null,
          refreshUrl: body.refreshUrl,
          returnUrl: body.returnUrl,
        });

        return {
          statusCode: 200,
          body: result,
        };
      }

      if (request.method === "GET" && pathname === "/integrations/stripe/connect/status") {
        const result = await this.refreshStripeOnboardingStatusUseCase.execute({
          businessId: request.auth?.businessId,
        });
        return {
          statusCode: 200,
          body: result,
        };
      }

      if (request.method === "POST" && pathname === "/integrations/stripe/connect/banking-profile") {
        const body = toObject(request.body);
        const result = await this.updateStripeBankingProfileUseCase.execute({
          businessId: request.auth?.businessId,
          userId: request.auth?.userId ?? "",
          ownerEmail:
            typeof body.ownerEmail === "string" ? body.ownerEmail : request.auth?.email ?? null,
          ownerName:
            typeof body.ownerName === "string" ? body.ownerName : request.auth?.name ?? null,
          birthDate: body.birthDate,
          accountHolderName: body.accountHolderName,
          accountHolderType: body.accountHolderType,
          routingNumber: body.routingNumber,
          accountNumber: body.accountNumber,
          country: body.country,
          currency: body.currency,
        });

        return {
          statusCode: 200,
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

      if (error instanceof BranchNotFoundError) {
        return {
          statusCode: 404,
          body: {
            error: "Branch not found",
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

      if (error instanceof StripeNotConfiguredError) {
        return {
          statusCode: 503,
          body: {
            error: "Stripe not configured",
            reason: "STRIPE_NOT_CONFIGURED",
          },
        };
      }

      if (error instanceof StripeRequestFailedError) {
        return {
          statusCode: 502,
          body: {
            error: "Stripe request failed",
            reason: "STRIPE_REQUEST_FAILED",
            message: error.message,
            statusCode: error.statusCode,
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
