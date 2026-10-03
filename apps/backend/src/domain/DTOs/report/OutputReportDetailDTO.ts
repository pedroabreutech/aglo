import { z } from "zod";
import { registry } from "../../../config/zod/registry";
import { OutputReportMediaDTOSchema } from "./OutputReportMediaDTO";
import { OutputReportSummaryDTOSchema } from "./OutputReportSummaryDTO";

export const OutputReportDetailDTOSchema = OutputReportSummaryDTOSchema.extend({
  failureReason: z.string().nullable().optional().openapi({
    description: "Motivo da ultima falha de processamento, se houver",
    example: "P2Pnet request timed out",
  }),
  processingParams: z
    .unknown()
    .nullable()
    .optional()
    .openapi({
      description: "Parametros do ultimo processamento executado",
      example: {
        threshold: 0.5,
        weightPath: "./weights/SHTechA.pth",
        model: "P2Pnet",
      },
    }),
  detectionPoints: z
    .array(z.object({ x: z.number(), y: z.number() }))
    .nullable()
    .optional()
    .openapi({
      description: "Pontos de detecção finais exibidos no relatório",
    }),
  densityReinforcement: z.unknown().nullable().optional().openapi({
    description: "Metadados do reforço denso aplicado à contagem automática",
  }),
  updatedAt: z.iso.datetime().openapi({
    description: "Data de atualizacao do relatorio",
    example: "2026-07-07T12:30:00.000Z",
  }),
  media: OutputReportMediaDTOSchema.openapi({
    description: "URLs assinadas temporarias das imagens do relatorio",
  }),
});

export type OutputReportDetailDTO = z.infer<typeof OutputReportDetailDTOSchema>;

registry.register("OutputReportDetailDTO", OutputReportDetailDTOSchema);
