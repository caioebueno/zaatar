import { DriverNotFoundError } from "../../application/errors/DriverNotFoundError.js";
import { DriverOtpExpiredOrNotFoundError } from "../../application/errors/DriverOtpExpiredOrNotFoundError.js";
import { DriverOtpInvalidError } from "../../application/errors/DriverOtpInvalidError.js";
import { InvalidDriverAuthPayloadError } from "../../application/errors/InvalidDriverAuthPayloadError.js";
import type { SendDriverOtpUseCase } from "../../application/use-cases/SendDriverOtpUseCase.js";
import type { VerifyDriverOtpUseCase } from "../../application/use-cases/VerifyDriverOtpUseCase.js";
import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";

export class DriverAuthController implements HttpController {
  constructor(
    private readonly sendDriverOtpUseCase: SendDriverOtpUseCase,
    private readonly verifyDriverOtpUseCase: VerifyDriverOtpUseCase,
  ) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const url = new URL(request.path, "http://localhost");
    const pathname = url.pathname;

    try {
      if (request.method === "POST" && pathname === "/drivers/auth/otp/send") {
        const body = toObject(request.body);
        const result = await this.sendDriverOtpUseCase.execute({
          phone: body.phone,
          channel: body.channel,
          language: body.language,
          sendAlsoSms: body.sendAlsoSms,
          sendAlsoWhatsApp: body.sendAlsoWhatsApp,
        });

        return {
          statusCode: 200,
          body: result,
        };
      }

      if (request.method === "POST" && pathname === "/drivers/auth/otp/verify") {
        const body = toObject(request.body);
        const result = await this.verifyDriverOtpUseCase.execute({
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
      if (error instanceof InvalidDriverAuthPayloadError) {
        return {
          statusCode: 400,
          body: {
            error: "Invalid payload",
            field: error.field,
          },
        };
      }

      if (error instanceof DriverNotFoundError) {
        return {
          statusCode: 404,
          body: {
            error: "Driver not found",
          },
        };
      }

      if (error instanceof DriverOtpExpiredOrNotFoundError) {
        return {
          statusCode: 400,
          body: {
            error: "OTP expired or not found",
            reason: "OTP_NOT_FOUND_OR_EXPIRED",
            field: "code",
          },
        };
      }

      if (error instanceof DriverOtpInvalidError) {
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
