import { Request, Response } from "express";
import { HealthService } from "../services/health/health.service";
import { ResponseHandler } from "../utils/responseHandler";
import { HttpStatus } from "../utils/httpStatus";

export class HealthController {
  constructor() {
    this.healthService = new HealthService();
  }

  private healthService: HealthService;

  public async check(req: Request, res: Response) {
    const result = await this.healthService.check();

    if (result.status === "ok") {
      ResponseHandler.success(res, result, HttpStatus.OK);
    } else {
      ResponseHandler.error(
        res,
        result,
        HttpStatus.SERVICE_UNAVAILABLE,
        null,
        "Service unavailable",
      );
    }
  }
}
