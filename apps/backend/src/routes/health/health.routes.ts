import { Request, Response, Router } from "express";
import { HealthController } from "../../controllers/health.controller";
import { logRequest } from "../../middleware/log";

const healthRoutes = Router();
const healthController = new HealthController();

healthRoutes.get(
  "/",
  logRequest("HealthService"),
  (req: Request, res: Response) => healthController.check(req, res),
);

export default healthRoutes;
