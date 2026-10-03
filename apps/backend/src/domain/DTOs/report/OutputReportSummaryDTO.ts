import { z } from "zod";
import { registry } from "../../../config/zod/registry";
import {
  LocationDTOSchema,
  ReportStatusSchema,
  CountingMethodSchema,
} from "./reportCommonSchemas";

export const OutputReportSummaryDTOSchema = z.object({
  id: z.string().uuid().openapi({
    description: "ID do relatorio",
    example: "f7dbf78b-04e7-44f8-bb9a-2c0c49dbe814",
  }),
  eventName: z.string().openapi({
    description: "Nome do evento",
    example: "Show no estadio",
  }),
  location: LocationDTOSchema.openapi({
    description: "Localizacao resumida do evento",
  }),
  eventDate: z.iso.datetime().openapi({
    description: "Data do evento em ISO 8601",
    example: "2026-07-07T00:00:00.000Z",
  }),
  eventType: z.string().openapi({
    description: "Tipo do evento",
    example: "show",
  }),
  status: ReportStatusSchema.openapi({
    description: "Status do relatorio",
    example: "ready",
  }),
  countingMethod: CountingMethodSchema.openapi({
    description: "Modo da contagem automatica utilizado no relatorio",
    example: "automatic",
  }),
  estimatedCount: z.number().int().nullable().optional().openapi({
    description: "Contagem automatica do P2Pnet, quando processada",
    example: 12655,
  }),
  createdAt: z.iso.datetime().openapi({
    description: "Data de criacao do relatorio",
    example: "2026-07-07T12:00:00.000Z",
  }),
});

export type OutputReportSummaryDTO = z.infer<
  typeof OutputReportSummaryDTOSchema
>;

registry.register("OutputReportSummaryDTO", OutputReportSummaryDTOSchema);
