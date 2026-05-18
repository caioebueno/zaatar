import { InvalidOwnerAuthPayloadError } from "../../application/errors/InvalidOwnerAuthPayloadError.js";
import { OwnerNotFoundError } from "../../application/errors/OwnerNotFoundError.js";
import { OwnerOtpExpiredOrNotFoundError } from "../../application/errors/OwnerOtpExpiredOrNotFoundError.js";
import { OwnerOtpInvalidError } from "../../application/errors/OwnerOtpInvalidError.js";
import type { SendOwnerOtpUseCase } from "../../application/use-cases/SendOwnerOtpUseCase.js";
import type { VerifyOwnerOtpUseCase } from "../../application/use-cases/VerifyOwnerOtpUseCase.js";
import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";

export class OwnerAuthController implements HttpController {
  constructor(
    private readonly sendOwnerOtpUseCase: SendOwnerOtpUseCase,
    private readonly verifyOwnerOtpUseCase: VerifyOwnerOtpUseCase,
  ) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const url = new URL(request.path, "http://localhost");
    const pathname = url.pathname;

    try {
      if (request.method === "POST" && pathname === "/owners/auth/otp/send") {
        const body = toObject(request.body);
        const result = await this.sendOwnerOtpUseCase.execute({
          phone: body.phone,
          language: body.language,
        });

        return {
          statusCode: 200,
          body: result,
        };
      }

      if (request.method === "POST" && pathname === "/owners/auth/otp/verify") {
        const body = toObject(request.body);
        const result = await this.verifyOwnerOtpUseCase.execute({
          phone: body.phone,
          code: body.code,
        });

        return {
          statusCode: 200,
          body: result,
        };
      }

      return {
        statusCode: 404,
        body: {
          error: "Not found",
        },
      };
    } catch (error) {
      if (error instanceof InvalidOwnerAuthPayloadError) {
        return {
          statusCode: 400,
          body: {
            error: "Invalid payload",
            field: error.field,
          },
        };
      }

      if (error instanceof OwnerNotFoundError) {
        return {
          statusCode: 404,
          body: {
            error: "Owner not found",
          },
        };
      }

      if (error instanceof OwnerOtpExpiredOrNotFoundError) {
        return {
          statusCode: 400,
          body: {
            error: "OTP expired or not found",
            reason: "OTP_NOT_FOUND_OR_EXPIRED",
            field: "code",
          },
        };
      }

      if (error instanceof OwnerOtpInvalidError) {
        return {
          statusCode: 400,
          body: {
            error: "Invalid OTP code",
            reason: "OTP_INVALID",
            field: "code",
            remainingAttempts: error.remainingAttempts,
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
