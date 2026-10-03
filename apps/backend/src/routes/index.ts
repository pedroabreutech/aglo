import { Router } from "express";
import healthRoutes from "./health/health.routes";
import reportRoutes from "./report/report.routes";

const routes = Router();
const healthRouter = Router();

const V1_PREFIX = "/api/v1";

healthRouter.use(`${V1_PREFIX}/healthz`, healthRoutes);

routes.use(`${V1_PREFIX}/reports`, reportRoutes);

export { routes, healthRouter };
