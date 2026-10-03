import { Request, Response, Router } from "express";
import { ReportController } from "../../controllers/report.controller";
import { ReportProcessController } from "../../controllers/reportProcess.controller";
import { InputCreateReportDTOSchema } from "../../domain/DTOs/report/InputCreateReportDTO";
import { InputProcessReportDTOSchema } from "../../domain/DTOs/report/InputProcessReportDTO";
import { InputUpdateReportDTOSchema } from "../../domain/DTOs/report/InputUpdateReportDTO";
import { logRequest } from "../../middleware/log";
import { validate } from "../../middleware/validation";

const reportRoutes = Router();
const reportController = new ReportController();
const reportProcessController = new ReportProcessController();

reportRoutes.post(
  "/",
  logRequest("ReportCreateService"),
  validate(InputCreateReportDTOSchema),
  (req: Request, res: Response) => reportController.create(req, res),
);

reportRoutes.get(
  "/",
  logRequest("ReportListService"),
  (req: Request, res: Response) => reportController.list(req, res),
);

reportRoutes.get(
  "/:id",
  logRequest("ReportGetByIdService"),
  (req: Request, res: Response) => reportController.getById(req, res),
);

reportRoutes.patch(
  "/:id",
  logRequest("ReportUpdateService"),
  validate(InputUpdateReportDTOSchema),
  (req: Request, res: Response) => reportController.update(req, res),
);

reportRoutes.delete(
  "/:id",
  logRequest("ReportDeleteService"),
  (req: Request, res: Response) => reportController.delete(req, res),
);

reportRoutes.post(
  "/:id/process",
  logRequest("ReportProcessService"),
  validate(InputProcessReportDTOSchema),
  (req: Request, res: Response) => reportProcessController.process(req, res),
);

export default reportRoutes;
