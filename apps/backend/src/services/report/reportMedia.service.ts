import { OutputReportMediaDTO } from "../../domain/DTOs/report/OutputReportMediaDTO";
import { ReportWithRelations } from "../../domain/interfaces/repository/IReportRepository";
import { IStorageService } from "../../domain/interfaces/services/IStorageService";
import { NotFoundException } from "../../exceptions/notFound.exception";
import { MediaKind } from "../../generated/prisma/enums";
import { MediaAssetModel } from "../../generated/prisma/models";

export async function resolveSignedMedia(
  report: ReportWithRelations,
  storageService: IStorageService,
): Promise<OutputReportMediaDTO> {
  const original = findReportMedia(report, MediaKind.original_image);
  const processed = findReportMedia(report, MediaKind.processed_image);

  if (!original) {
    throw new NotFoundException("Original image not found for report");
  }

  return {
    original: {
      url: await storageService.getSignedReadUrl(original.objectKey),
      contentType: original.contentType,
    },
    ...(processed
      ? {
          processed: {
            url: await storageService.getSignedReadUrl(processed.objectKey),
            contentType: processed.contentType,
          },
        }
      : {}),
  };
}

export function findReportMedia(
  report: ReportWithRelations,
  kind: MediaKind,
): MediaAssetModel | undefined {
  return report.media.find((media) => media.kind === kind);
}
