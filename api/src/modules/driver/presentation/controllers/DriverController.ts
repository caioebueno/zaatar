import { DriverNotFoundError } from "../../application/errors/DriverNotFoundError.js";
import { DriverPhoneAlreadyInUseError } from "../../application/errors/DriverPhoneAlreadyInUseError.js";
import { InvalidCreateDriverPayloadError } from "../../application/errors/InvalidCreateDriverPayloadError.js";
import { InvalidDriverIdError } from "../../application/errors/InvalidDriverIdError.js";
import { InvalidUpdateDriverPayloadError } from "../../application/errors/InvalidUpdateDriverPayloadError.js";
import type { CreateDriverUseCase } from "../../application/use-cases/CreateDriverUseCase.js";
import type { DeleteDriverUseCase } from "../../application/use-cases/DeleteDriverUseCase.js";
import type { GetDriverByIdUseCase } from "../../application/use-cases/GetDriverByIdUseCase.js";
import type { ListDriversUseCase } from "../../application/use-cases/ListDriversUseCase.js";
import type { UpdateDriverUseCase } from "../../application/use-cases/UpdateDriverUseCase.js";
import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";

export class DriverController implements HttpController {
  constructor(
    private readonly createDriverUseCase: CreateDriverUseCase,
    private readonly listDriversUseCase: ListDriversUseCase,
    private readonly getDriverByIdUseCase: GetDriverByIdUseCase,
    private readonly updateDriverUseCase: UpdateDriverUseCase,
    private readonly deleteDriverUseCase: DeleteDriverUseCase,
  ) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const url = new URL(request.path, "http://localhost");
    const pathname = url.pathname;

    if (!request.auth?.userId) {
      return {
        statusCode: 401,
        body: {
          error: "Unauthorized",
        },
      };
    }

    try {
      if (request.method === "POST" && pathname === "/drivers") {
        const body = toObject(request.body);
        const result = await this.createDriverUseCase.execute({
          name: body.name,
          phone: body.phone,
          active: body.active,
          priorityLevel: body.priorityLevel,
        });

        return {
          statusCode: 201,
          body: result,
        };
      }

      if (request.method === "GET" && pathname === "/drivers") {
        const result = await this.listDriversUseCase.execute();
        return {
          statusCode: 200,
          body: result,
        };
      }

      const driverId = extractDriverId(pathname);

      if (request.method === "GET" && driverId) {
        const result = await this.getDriverByIdUseCase.execute({
          driverId,
        });

        return {
          statusCode: 200,
          body: result,
        };
      }

      if (request.method === "PATCH" && driverId) {
        const body = toObject(request.body);
        const result = await this.updateDriverUseCase.execute({
          driverId,
          name: body.name,
          phone: body.phone,
          active: body.active,
          priorityLevel: body.priorityLevel,
        });

        return {
          statusCode: 200,
          body: result,
        };
      }

      if (request.method === "DELETE" && driverId) {
        await this.deleteDriverUseCase.execute({
          driverId,
        });

        return {
          statusCode: 200,
          body: {
            ok: true,
          },
        };
      }

      return {
        statusCode: 404,
        body: {
          error: "Not found",
        },
      };
    } catch (error) {
      if (
        error instanceof InvalidCreateDriverPayloadError ||
        error instanceof InvalidUpdateDriverPayloadError
      ) {
        return {
          statusCode: 400,
          body: {
            error: "Invalid payload",
            field: error.field,
          },
        };
      }

      if (error instanceof InvalidDriverIdError) {
        return {
          statusCode: 400,
          body: {
            error: "Invalid payload",
            field: "driverId",
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

      if (error instanceof DriverPhoneAlreadyInUseError) {
        return {
          statusCode: 409,
          body: {
            error: "Driver phone already in use",
            field: "phone",
            reason: "PHONE_ALREADY_IN_USE",
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

function extractDriverId(pathname: string): string | null {
  const match = pathname.match(/^\/drivers\/([^/]+)$/);
  if (!match) return null;

  const driverId = match[1]?.trim();
  if (!driverId) return null;

  return driverId;
}
