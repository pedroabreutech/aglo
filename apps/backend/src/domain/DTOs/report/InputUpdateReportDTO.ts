import { z } from "zod";
import { registry } from "../../../config/zod/registry";
import { CountingMethodSchema, LocationDTOSchema } from "./reportCommonSchemas";

export const InputUpdateReportDTOSchema = z
  .object({
    eventName: z.string().min(1).optional().openapi({
      description: "Novo nome do evento",
      example: "Show no estadio atualizado",
    }),
    eventDate: z.iso.date().optional().openapi({
      description: "Nova data do evento em formato ISO 8601 YYYY-MM-DD",
      example: "2026-07-08",
    }),
    eventType: z.string().min(1).optional().openapi({
      description: "Novo tipo do evento",
      example: "festival",
    }),
    location: LocationDTOSchema.optional().openapi({
      description: "Nova localizacao do evento",
    }),
    countingMethod: CountingMethodSchema.optional().openapi({
      description: "Modo da contagem automatica escolhido para o relatorio",
      example: "automatic",
    }),
  })
  .refine(
    (data) =>
      data.eventName !== undefined ||
      data.eventDate !== undefined ||
      data.eventType !== undefined ||
      data.location !== undefined ||
      data.countingMethod !== undefined,
    {
      message:
        "Pelo menos um campo (eventName, eventDate, eventType, location ou countingMethod) deve ser fornecido",
    },
  );

export type InputUpdateReportDTO = z.infer<typeof InputUpdateReportDTOSchema>;

registry.register("InputUpdateReportDTO", InputUpdateReportDTOSchema);
