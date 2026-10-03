import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import { env } from "./env";
import { registry } from "./zod/registry";

import "../routes/health/health.registry";
import "../routes/report/report.registry";

export const setupSwagger = (app: Express): void => {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  const swaggerDocument = generator.generateDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Documentação: Aglo",
      description:
        "Documentação da API do Aglo (contagem automática de pessoas), gerada com Zod",
    },
    servers: [
      { url: env.app.publicUrl || `http://localhost:${env.app.port}` },
      { url: `http://localhost:${env.app.managementPort}` },
    ],
  });

  app.get("/api-docs.json", (_req, res) => res.json(swaggerDocument));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
