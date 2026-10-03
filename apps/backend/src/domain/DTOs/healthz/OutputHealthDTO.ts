import z from "zod";
import { registry } from "../../../config/zod/registry";

export const OutputHealthDTOSchema = z.object({
  status: z.boolean().openapi({ description: "Server status", example: true }),
  uptime: z
    .number()
    .openapi({ description: "How much time server is up", example: 1.292899 }),
  timestamp: z.string().openapi({
    description: "Time of request",
    example: "2026-07-02T16:09:48.634Z",
  }),
  services: z.object({
    database: z.string().openapi({
      description: "Database status",
      example: "connected || disconnected",
    }),
  }),
});

export type OutputHealthDTO = z.infer<typeof OutputHealthDTOSchema>;

registry.register("OutputHealthDTO", OutputHealthDTOSchema);
