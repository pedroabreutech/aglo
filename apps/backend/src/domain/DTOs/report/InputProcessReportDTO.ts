import { z } from "zod";
import { registry } from "../../../config/zod/registry";
import { CountingMethodSchema } from "./reportCommonSchemas";

export const InputProcessReportDTOSchema = z.object({
  countingMethod: CountingMethodSchema.optional().openapi({
    description:
      "Modo da contagem automatica: automatic (P2Pnet com reforco em zonas densas) ou automatic_conservative (P2Pnet puro). Se omitido, usa o valor salvo no relatorio.",
    example: "automatic",
  }),
  threshold: z.number().min(0.05).max(0.95).optional().openapi({
    description:
      "Limiar de confianca do P2Pnet (0.05 a 0.95). Valores menores detectam mais pessoas; maiores sao mais rigorosos. Padrao: configuracao do servico.",
    example: 0.5,
  }),
});

export type InputProcessReportDTO = z.infer<typeof InputProcessReportDTOSchema>;

registry.register("InputProcessReportDTO", InputProcessReportDTOSchema);
