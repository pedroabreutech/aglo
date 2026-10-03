import type { Contagem, CountingMethod } from "@/src/types/IContagem";

export const COUNTING_METHODS: CountingMethod[] = [
  "automatic",
  "automatic_conservative",
];

export const COUNTING_METHOD_LABELS: Record<CountingMethod, string> = {
  automatic: "Automática (P2Pnet + reforço)",
  automatic_conservative: "Automática conservadora (P2Pnet)",
};

export const COUNTING_METHOD_DESCRIPTIONS: Record<CountingMethod, string> = {
  automatic:
    "Contagem por IA (P2Pnet) com reforço em zonas densas. Indicada para multidões muito aglomeradas.",
  automatic_conservative:
    "Contagem por IA (P2Pnet) apenas com as detecções do modelo. Indicada para cenas de baixa ou média densidade.",
};

export type CountingMethodReferenceImage = {
  src: string;
  alt: string;
  caption: string;
};

/** Imagens de referência visual para ajudar na escolha do modo. */
export const COUNTING_METHOD_REFERENCE_IMAGES: Record<
  CountingMethod,
  CountingMethodReferenceImage
> = {
  automatic: {
    src: "/images/referencias/multidao-alta-densidade.jpg",
    alt: "Exemplo de multidão muito aglomerada em avenida urbana",
    caption: "Referência: multidão muito aglomerada",
  },
  automatic_conservative: {
    src: "/images/referencias/multidao-baixa-media-densidade.jpg",
    alt: "Exemplo de cena de baixa ou média densidade vista de cima",
    caption: "Referência: baixa ou média densidade",
  },
};

export function resolveCountingMethod(
  method?: CountingMethod | null,
): CountingMethod {
  return method === "automatic_conservative" ? method : "automatic";
}

export function getAutomaticCount(
  contagem: Pick<Contagem, "estimatedCount" | "finalizada">,
): number | undefined {
  if (
    contagem.finalizada &&
    typeof contagem.estimatedCount === "number" &&
    Number.isFinite(contagem.estimatedCount)
  ) {
    return contagem.estimatedCount;
  }

  return undefined;
}
