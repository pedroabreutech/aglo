import { z } from "zod";
import { registry } from "../../../config/zod/registry";

export const OutputReportMediaItemDTOSchema = z.object({
  url: z.string().url().openapi({
    description: "URL assinada temporaria para leitura da imagem",
    example:
      "https://storage.googleapis.com/bucket/reports/id/original/img.jpg?X-Goog-Signature=...",
  }),
  contentType: z.string().openapi({
    description: "Content-Type da imagem",
    example: "image/jpeg",
  }),
});

export const OutputReportMediaDTOSchema = z.object({
  original: OutputReportMediaItemDTOSchema.openapi({
    description: "Imagem original do relatorio",
  }),
  processed: OutputReportMediaItemDTOSchema.optional().openapi({
    description: "Imagem processada, quando existir",
  }),
});

export type OutputReportMediaItemDTO = z.infer<
  typeof OutputReportMediaItemDTOSchema
>;
export type OutputReportMediaDTO = z.infer<typeof OutputReportMediaDTOSchema>;

registry.register("OutputReportMediaItemDTO", OutputReportMediaItemDTOSchema);
registry.register("OutputReportMediaDTO", OutputReportMediaDTOSchema);
