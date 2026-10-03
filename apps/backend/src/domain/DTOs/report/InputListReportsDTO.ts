import { z } from "zod";
import { registry } from "../../../config/zod/registry";
import { ReportStatusSchema } from "./reportCommonSchemas";

export const InputListReportsDTOSchema = z.object({
  search: z.string().min(1).optional().openapi({
    description: "Busca por nome do evento ou endereco",
    example: "estadio",
  }),
  eventType: z.string().min(1).optional().openapi({
    description: "Filtro por tipo de evento",
    example: "show",
  }),
  dateFrom: z.iso.date().optional().openapi({
    description: "Data inicial em formato ISO 8601 YYYY-MM-DD",
    example: "2026-07-01",
  }),
  dateTo: z.iso.date().optional().openapi({
    description: "Data final em formato ISO 8601 YYYY-MM-DD",
    example: "2026-07-31",
  }),
  status: ReportStatusSchema.optional().openapi({
    description: "Filtro por status do relatorio",
    example: "ready",
  }),
  page: z.coerce.number().int().positive().default(1).openapi({
    description: "Pagina da listagem",
    example: 1,
  }),
  pageSize: z.coerce.number().int().min(1).max(50).default(10).openapi({
    description: "Quantidade de itens por pagina, maximo 50",
    example: 10,
  }),
});

export type InputListReportsDTO = z.infer<typeof InputListReportsDTOSchema>;

registry.register("InputListReportsDTO", InputListReportsDTOSchema);
