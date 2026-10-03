import type { Contagem, CountingMethod } from "@/src/types/IContagem";

type ReportStatus = "ready" | "completed" | "failed";

type BackendReportSummary = {
  id: string;
  eventName: string;
  eventDate: string;
  eventType: string;
  location: { address?: string };
  status: ReportStatus;
  countingMethod?: CountingMethod;
  estimatedCount?: number | null;
  createdAt: string;
};

type BackendReportDetail = BackendReportSummary & {
  updatedAt?: string;
  detectionPoints?: Array<{ x: number; y: number }>;
  densityReinforcement?: Contagem["densityReinforcement"];
  processingParams?: unknown;
  media?: {
    original?: { url: string; contentType: string };
    processed?: { url: string; contentType: string };
  };
};

type BackendReportList = {
  items: BackendReportSummary[];
  page: number;
  pageSize: number;
  total: number;
};

export function mapBackendReportToContagem(report: BackendReportDetail): Contagem {
  const detectionThreshold = extractDetectionThreshold(report.processingParams);

  return {
    ...mapBackendReportSummaryToContagem(report),
    imagePath: report.media?.original?.url ?? "",
    processedImagePath: report.media?.processed?.url,
    detectionPoints: report.detectionPoints,
    densityReinforcement: report.densityReinforcement,
    ...(detectionThreshold !== undefined ? { detectionThreshold } : {}),
  };
}

function extractDetectionThreshold(
  processingParams: unknown,
): number | undefined {
  if (!processingParams || typeof processingParams !== "object") {
    return undefined;
  }

  const value = (processingParams as Record<string, unknown>).threshold;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.min(0.95, Math.max(0.05, value));
}

export function mapBackendReportSummaryToContagem(
  report: BackendReportSummary,
): Contagem {
  return {
    id: report.id,
    eventName: report.eventName,
    eventDate: report.eventDate,
    eventType: report.eventType,
    location: {
      address: report.location?.address ?? "",
    },
    imagePath: "",
    countingMethod: report.countingMethod ?? "automatic",
    estimatedCount: report.estimatedCount ?? undefined,
    status: report.status,
    finalizada: report.status === "completed",
    createdAt: report.createdAt,
  };
}

export function mapBackendReportListToContagens(list: BackendReportList) {
  return {
    items: list.items.map(mapBackendReportSummaryToContagem),
    page: list.page,
    pageSize: list.pageSize,
    total: list.total,
  };
}
