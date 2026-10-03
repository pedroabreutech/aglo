import { imageSize } from "image-size";

export interface DetectionPoint {
  x: number;
  y: number;
}

export interface DensityReinforcementMeta {
  applied: boolean;
  originalCount: number;
  densePoints: number;
  extraPointsAdded: number;
  reinforcedCount: number;
  adaptiveRadiusPx: number;
  offsetPx: number;
  minNeighbors: number;
  extraPerDensePoint: number;
}

export interface AutomaticMetrics {
  automaticCount: number;
  detectionPoints: DetectionPoint[];
  densityReinforcement: DensityReinforcementMeta;
}

export type AutomaticCountingMethod = "automatic" | "automatic_conservative";

const DENSE_AREA_REINFORCEMENT = 2.05;
const MIN_NEIGHBORS_FOR_DENSE = 5;
const RADIUS_RATIO = 0.04;
const MIN_RADIUS_PX = 25;
const MAX_RADIUS_PX = 120;
const OFFSET_SCALE = 0.35;

export function normalizeDetectionPoints(raw: unknown): DetectionPoint[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const points: DetectionPoint[] = [];
  for (const item of raw) {
    const point = parsePoint(item);
    if (point) {
      points.push(point);
    }
  }

  return points;
}

function parsePoint(item: unknown): DetectionPoint | null {
  if (Array.isArray(item) && item.length >= 2) {
    const x = Number(item[0]);
    const y = Number(item[1]);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      return { x, y };
    }
    return null;
  }

  if (item && typeof item === "object") {
    const record = item as Record<string, unknown>;
    const x = Number(record.x ?? record.cx);
    const y = Number(record.y ?? record.cy);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      return { x, y };
    }
  }

  return null;
}

function computeAdaptiveRadius(width: number, height: number): number {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return 50;
  }

  const smallerSide = Math.min(width, height);
  return Math.min(
    MAX_RADIUS_PX,
    Math.max(MIN_RADIUS_PX, smallerSide * RADIUS_RATIO),
  );
}

function findDensePointIndices(
  points: DetectionPoint[],
  radius: number,
): number[] {
  const radiusSq = radius * radius;
  const dense: number[] = [];

  for (let i = 0; i < points.length; i += 1) {
    const target = points[i];
    let neighbors = 0;

    for (const point of points) {
      const dx = point.x - target.x;
      const dy = point.y - target.y;
      if (dx * dx + dy * dy <= radiusSq) {
        neighbors += 1;
      }
    }

    if (neighbors >= MIN_NEIGHBORS_FOR_DENSE) {
      dense.push(i);
    }
  }

  return dense;
}

function extraPointsForDenseRank(
  rate: number,
  remainderRef: { value: number },
): number {
  remainderRef.value += rate;
  const whole = Math.floor(remainderRef.value);
  remainderRef.value -= whole;
  return whole;
}

function generateExtraPoints(
  cx: number,
  cy: number,
  offset: number,
  count: number,
  phase: number,
): DetectionPoint[] {
  if (count <= 0) {
    return [];
  }

  const extras: DetectionPoint[] = [];
  for (let i = 0; i < count; i += 1) {
    const angle = phase + (i * 2 * Math.PI) / count;
    extras.push({
      x: cx + Math.cos(angle) * offset,
      y: cy + Math.sin(angle) * offset,
    });
  }

  return extras;
}

export function reinforceDensePoints(
  points: DetectionPoint[],
  imageWidth: number,
  imageHeight: number,
): { points: DetectionPoint[]; meta: DensityReinforcementMeta } {
  const originalCount = points.length;
  const adaptiveRadiusPx = computeAdaptiveRadius(imageWidth, imageHeight);
  const offsetPx = adaptiveRadiusPx * OFFSET_SCALE;

  const buildMeta = (
    applied: boolean,
    reinforcedCount: number,
    densePoints = 0,
    extraPointsAdded = 0,
  ): DensityReinforcementMeta => ({
    applied,
    originalCount,
    densePoints,
    extraPointsAdded,
    reinforcedCount,
    adaptiveRadiusPx,
    offsetPx,
    minNeighbors: MIN_NEIGHBORS_FOR_DENSE,
    extraPerDensePoint: DENSE_AREA_REINFORCEMENT,
  });

  if (originalCount < 5) {
    return {
      points: [...points],
      meta: buildMeta(false, originalCount),
    };
  }

  const denseIndices = findDensePointIndices(points, adaptiveRadiusPx);
  if (denseIndices.length === 0) {
    return {
      points: [...points],
      meta: buildMeta(false, originalCount, 0, 0),
    };
  }

  const remainderRef = { value: 0 };
  const extraPoints: DetectionPoint[] = [];

  denseIndices.forEach((pointIndex, rank) => {
    const extrasForPoint = extraPointsForDenseRank(
      DENSE_AREA_REINFORCEMENT,
      remainderRef,
    );
    if (extrasForPoint <= 0) {
      return;
    }

    const base = points[pointIndex];
    const phase = (rank % 3) * (Math.PI / 3);
    extraPoints.push(
      ...generateExtraPoints(base.x, base.y, offsetPx, extrasForPoint, phase),
    );
  });

  const reinforcedCount = originalCount + extraPoints.length;
  return {
    points: [...points, ...extraPoints],
    meta: buildMeta(
      true,
      reinforcedCount,
      denseIndices.length,
      extraPoints.length,
    ),
  };
}

export function getImageSizeFromBuffer(imageBuffer: Buffer): {
  width: number;
  height: number;
} {
  const dimensions = imageSize(imageBuffer);
  return {
    width: dimensions.width ?? 0,
    height: dimensions.height ?? 0,
  };
}

/**
 * automatic: P2Pnet com reforço em zonas densas.
 * automatic_conservative: apenas os pontos detectados pelo P2Pnet.
 */
export function buildAutomaticMetrics(params: {
  method: AutomaticCountingMethod;
  predictionResponse: unknown;
  imageBuffer: Buffer;
}): AutomaticMetrics {
  const points = normalizeDetectionPoints(
    (params.predictionResponse as Record<string, unknown> | null)?.points,
  );

  if (params.method === "automatic_conservative") {
    return {
      automaticCount: points.length,
      detectionPoints: points,
      densityReinforcement: {
        applied: false,
        originalCount: points.length,
        densePoints: 0,
        extraPointsAdded: 0,
        reinforcedCount: points.length,
        adaptiveRadiusPx: 0,
        offsetPx: 0,
        minNeighbors: MIN_NEIGHBORS_FOR_DENSE,
        extraPerDensePoint: DENSE_AREA_REINFORCEMENT,
      },
    };
  }

  const { width, height } = getImageSizeFromBuffer(params.imageBuffer);
  const reinforced = reinforceDensePoints(points, width, height);

  return {
    automaticCount: reinforced.meta.reinforcedCount,
    detectionPoints: reinforced.points,
    densityReinforcement: reinforced.meta,
  };
}
