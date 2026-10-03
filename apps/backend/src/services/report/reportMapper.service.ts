import { OutputListReportsDTO } from "../../domain/DTOs/report/OutputListReportsDTO";
import { OutputReportDetailDTO } from "../../domain/DTOs/report/OutputReportDetailDTO";
import { OutputReportMediaDTO } from "../../domain/DTOs/report/OutputReportMediaDTO";
import { OutputReportSummaryDTO } from "../../domain/DTOs/report/OutputReportSummaryDTO";
import { ReportWithRelations } from "../../domain/interfaces/repository/IReportRepository";
import { ReportModel } from "../../generated/prisma/models";

function extractProcessingMetrics(processingParams: unknown) {
  if (!processingParams || typeof processingParams !== "object") {
    return {};
  }

  const params = processingParams as Record<string, unknown>;
  return {
    detectionPoints: Array.isArray(params.detectionPoints)
      ? params.detectionPoints
      : undefined,
    densityReinforcement:
      params.densityReinforcement &&
      typeof params.densityReinforcement === "object" &&
      !Array.isArray(params.densityReinforcement)
        ? params.densityReinforcement
        : undefined,
  };
}

export function toReportSummaryDTO(
  report: ReportModel,
): OutputReportSummaryDTO {
  return {
    id: report.id,
    eventName: report.eventName,
    location: {
      lat: toOptionalNumber(report.locationLat),
      lng: toOptionalNumber(report.locationLng),
      address: report.locationAddress ?? undefined,
    },
    eventDate: report.eventDate.toISOString(),
    eventType: report.eventType,
    status: report.status,
    countingMethod: report.countingMethod,
    estimatedCount: report.estimatedCount,
    createdAt: report.createdAt.toISOString(),
  };
}

export function toListReportsDTO(params: {
  items: ReportModel[];
  page: number;
  pageSize: number;
  total: number;
}): OutputListReportsDTO {
  return {
    items: params.items.map(toReportSummaryDTO),
    page: params.page,
    pageSize: params.pageSize,
    total: params.total,
  };
}

export function toReportDetailDTO(
  report: ReportWithRelations,
  media: OutputReportMediaDTO,
): OutputReportDetailDTO {
  const metrics = extractProcessingMetrics(report.processingParams);
  return {
    ...toReportSummaryDTO(report),
    failureReason: report.failureReason,
    processingParams: report.processingParams,
    detectionPoints: metrics.detectionPoints,
    densityReinforcement: metrics.densityReinforcement,
    updatedAt: report.updatedAt.toISOString(),
    media,
  };
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  return Number(value);
}
