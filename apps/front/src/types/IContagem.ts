export type CountingMethod = "automatic" | "automatic_conservative";

export interface EventLocation {
  address: string;
}

export interface NewContagem {
  eventName: string;
  eventDate: string;
  eventType: string;
  location: EventLocation;
  imagePath: string;
  processedImagePath?: string;
  /** Pontos de detecção do P2Pnet em coordenadas de pixel (x, y). */
  detectionPoints?: Array<{ x: number; y: number }>;
  /** Meta do reforço em zonas densas calculado pelo backend. */
  densityReinforcement?: {
    applied: boolean;
    originalCount: number;
    densePoints: number;
    extraPointsAdded: number;
    reinforcedCount: number;
    adaptiveRadiusPx?: number;
    offsetPx?: number;
    minNeighbors?: number;
    extraPerDensePoint?: number;
  };
  /** Contagem automática final (P2Pnet, com reforço quando aplicado). */
  estimatedCount?: number;
  /** Limiar de confiança do P2Pnet usado no processamento (0–1). */
  detectionThreshold?: number;
  countingMethod?: CountingMethod;
  status?: "ready" | "completed" | "failed";
  finalizada?: boolean;
}

export interface Contagem extends NewContagem {
  id: string;
  createdAt: string;
}
