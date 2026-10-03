import "./config/zod/zod-setup";

import express from "express";
import { env } from "./config/env";
import { setupSwagger } from "./config/swagger";
import { healthRouter, routes } from "./routes";
import corsOptions from "./config/cors";
import cors from "cors";
import { createLogger } from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";

const logger = createLogger("server");

const app = express();
const healthApp = express();

const PORT = env.app.port;
const MANAGEMENT_PORT = env.app.managementPort;

app.use(cors(corsOptions));

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

app.use(routes);
healthApp.use(healthRouter);

setupSwagger(app);

app.use(errorHandler);

function start(): void {
  try {
    healthApp.listen(MANAGEMENT_PORT);
    app.listen(PORT);

    logger.info("start server", {
      message: `Server is running on http://localhost:${PORT}`,
    });
    logger.info("start health server", {
      message: `Healthcheck is running on http://localhost:${MANAGEMENT_PORT}`,
    });
  } catch (error) {
    logger.error("fail to initiate", {
      message: `Error trying to initiate server: ${error}`,
    });
    process.exit(1);
  }
}

start();
