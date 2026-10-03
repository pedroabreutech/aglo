import { Request, Response } from "express";
import { z } from "zod";
import { InputCreateReportDTO } from "../domain/DTOs/report/InputCreateReportDTO";
import { InputListReportsDTOSchema } from "../domain/DTOs/report/InputListReportsDTO";
import { InputUpdateReportDTO } from "../domain/DTOs/report/InputUpdateReportDTO";
import { ReportCreateService } from "../services/report/reportCreate.service";
import { ReportDeleteService } from "../services/report/reportDelete.service";
import { ReportGetByIdService } from "../services/report/reportGetById.service";
import { ReportListService } from "../services/report/reportList.service";
import { ReportUpdateService } from "../services/report/reportUpdate.service";
import { GcsStorageService } from "../services/storage/gcsStorage.service";
import { HttpStatus } from "../utils/httpStatus";
import { ResponseHandler } from "../utils/responseHandler";

const ReportIdParamSchema = z.object({ id: z.string().uuid() });

export class ReportController {
  private readonly storageService = new GcsStorageService();
  private readonly reportCreateService = new ReportCreateService(
    this.storageService,
  );
  private readonly reportListService = new ReportListService();
  private readonly reportGetByIdService = new ReportGetByIdService(
    this.storageService,
  );
  private readonly reportUpdateService = new ReportUpdateService();
  private readonly reportDeleteService = new ReportDeleteService(
    this.storageService,
  );

  public async create(
    req: Request<object, object, InputCreateReportDTO>,
    res: Response,
  ): Promise<void> {
    const response = await this.reportCreateService.run(req.body);

    ResponseHandler.success(
      res,
      response,
      HttpStatus.CREATED,
      "Report created with success!",
    );
  }

  public async list(req: Request, res: Response): Promise<void> {
    const query = InputListReportsDTOSchema.parse(req.query);
    const response = await this.reportListService.run(query);

    ResponseHandler.success(
      res,
      response,
      HttpStatus.OK,
      "Reports retrieved with success!",
    );
  }

  public async getById(req: Request, res: Response): Promise<void> {
    const { id } = ReportIdParamSchema.parse(req.params);
    const response = await this.reportGetByIdService.run(id);

    ResponseHandler.success(
      res,
      response,
      HttpStatus.OK,
      "Report retrieved with success!",
    );
  }

  public async update(
    req: Request<object, object, InputUpdateReportDTO>,
    res: Response,
  ): Promise<void> {
    const { id } = ReportIdParamSchema.parse(req.params);
    const response = await this.reportUpdateService.run(id, req.body);

    ResponseHandler.success(
      res,
      response,
      HttpStatus.OK,
      "Report updated with success!",
    );
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const { id } = ReportIdParamSchema.parse(req.params);
    const response = await this.reportDeleteService.run(id);

    ResponseHandler.success(
      res,
      response,
      HttpStatus.OK,
      "Report deleted with success!",
    );
  }
}
