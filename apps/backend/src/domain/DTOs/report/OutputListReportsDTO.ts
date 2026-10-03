import { z } from "zod";
import { registry } from "../../../config/zod/registry";
import { OutputReportSummaryDTOSchema } from "./OutputReportSummaryDTO";

export const OutputListReportsDTOSchema = z.object({
  items: z.array(OutputReportSummaryDTOSchema).openapi({
    description: "Relatorios da pagina atual",
  }),
  page: z.number().int().positive().openapi({
    description: "Pagina atual",
    example: 1,
  }),
  pageSize: z.number().int().positive().openapi({
    description: "Quantidade de itens por pagina",
    example: 10,
  }),
  total: z.number().int().min(0).openapi({
    description: "Total de relatorios encontrados",
    example: 42,
  }),
});

export type OutputListReportsDTO = z.infer<typeof OutputListReportsDTOSchema>;

registry.register("OutputListReportsDTO", OutputListReportsDTOSchema);
