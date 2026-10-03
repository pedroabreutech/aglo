import { Request, Response } from "express";
import { z } from "zod";
import { InputProcessReportDTOSchema } from "../domain/DTOs/report/InputProcessReportDTO";
import { ReportProcessService } from "../services/report/reportProcess.service";
import { GcsStorageService } from "../services/storage/gcsStorage.service";
import { HttpStatus } from "../utils/httpStatus";
import { ResponseHandler } from "../utils/responseHandler";

const ReportIdParamSchema = z.object({ id: z.string().uuid() });

export class ReportProcessController {
  private readonly reportProcessService = new ReportProcessService(
    new GcsStorageService(),
  );

  public async process(req: Request, res: Response): Promise<void> {
    const { id } = ReportIdParamSchema.parse(req.params);
    const body = InputProcessReportDTOSchema.parse(req.body ?? {});
    const response = await this.reportProcessService.run(id, body);

    ResponseHandler.success(
      res,
      response,
      HttpStatus.OK,
      "Report processed with success!",
    );
  }
}
