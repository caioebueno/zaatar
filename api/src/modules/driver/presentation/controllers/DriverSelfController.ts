import { DriverNotFoundError } from "../../application/errors/DriverNotFoundError.js";
import type { GetDriverByIdUseCase } from "../../application/use-cases/GetDriverByIdUseCase.js";
import type { UpdateDriverUseCase } from "../../application/use-cases/UpdateDriverUseCase.js";
import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";

export class DriverSelfController implements HttpController {
  constructor(
    private readonly getDriverByIdUseCase: GetDriverByIdUseCase,
    private readonly updateDriverUseCase: UpdateDriverUseCase,
  ) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    if (!request.driverAuth?.driverId) {
      return { statusCode: 401, body: { error: "Unauthorized" } };
    }

    const driverId = request.driverAuth.driverId;

    try {
      const url = new URL(request.path, "http://localhost");
      const pathname = url.pathname;

      const isActivate   = pathname === "/drivers/me/activate";
      const isDeactivate = pathname === "/drivers/me/deactivate";

      if (!isActivate && !isDeactivate) {
        return { statusCode: 404, body: { error: "Not Found" } };
      }

      const current = await this.getDriverByIdUseCase.execute({ driverId });

      const result = await this.updateDriverUseCase.execute({
        driverId,
        name: current.name,
        phone: current.phone,
        active: isActivate,
        priorityLevel: current.priorityLevel,
      });

      return {
        statusCode: 200,
        body: {
          ok: true,
          active: result.active,
          activatedAt: result.activatedAt,
          deactivatedAt: result.deactivatedAt,
        },
      };
    } catch (err) {
      if (err instanceof DriverNotFoundError) {
        return { statusCode: 404, body: { error: "Driver not found" } };
      }
      throw err;
    }
  }
}
