import { registry } from "../../config/zod/registry";
import { ApiResponseSchema } from "../../domain/DTOs/common/ApiResponse";
import { OutputHealthDTOSchema } from "../../domain/DTOs/healthz/OutputHealthDTO";

const V1_PREFIX = "/api/v1/healthz";

const HealthApiResponse = ApiResponseSchema(OutputHealthDTOSchema);

registry.register("HealthzResponse", HealthApiResponse);

registry.registerPath({
  method: "get",
  path: V1_PREFIX,
  summary: "Health check",
  tags: ["Healthz"],
  responses: {
    200: {
      description: "Server response",
      content: {
        "application/json": {
          schema: HealthApiResponse,
        },
      },
    },
  },
});
