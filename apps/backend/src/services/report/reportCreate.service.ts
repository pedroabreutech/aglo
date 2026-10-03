import { env } from "../../config/env";
import { InputCreateReportDTO } from "../../domain/DTOs/report/InputCreateReportDTO";
import { OutputReportSummaryDTO } from "../../domain/DTOs/report/OutputReportSummaryDTO";
import { IMediaAssetRepository } from "../../domain/interfaces/repository/IMediaAssetRepository";
import { IReportRepository } from "../../domain/interfaces/repository/IReportRepository";
import { IStorageService } from "../../domain/interfaces/services/IStorageService";
import { GlobalErrorException } from "../../exceptions/globalError.exception";
import { MediaKind, ReportStatus } from "../../generated/prisma/enums";
import { MediaAssetRepository } from "../../repositories/mediaAsset.repository";
import { ReportRepository } from "../../repositories/report.repository";
import { HttpStatus } from "../../utils/httpStatus";
import { buildReportObjectKey, decodeImageBase64 } from "./reportImage.service";
import { toReportSummaryDTO } from "./reportMapper.service";

export class ReportCreateService {
  constructor(
    private storageService: IStorageService,
    private reportRepository: IReportRepository = new ReportRepository(),
    private mediaAssetRepository: IMediaAssetRepository = new MediaAssetRepository(),
    private bucketName: string = env.s3.bucketName,
  ) {}

  public async run(
    input: InputCreateReportDTO,
  ): Promise<OutputReportSummaryDTO> {
    this.ensureBucketConfigured();
    const image = decodeImageBase64(input.imageBase64, input.imageName);

    const report = await this.reportRepository.create({
      eventName: input.eventName,
      eventDate: parseIsoDate(input.eventDate),
      eventType: input.eventType,
      locationLat: input.location.lat,
      locationLng: input.location.lng,
      locationAddress: input.location.address,
      status: ReportStatus.ready,
    });

    const objectKey = buildReportObjectKey({
      reportId: report.id,
      kind: "original",
      extension: image.extension,
    });

    await this.storageService.upload({
      objectKey,
      buffer: image.buffer,
      contentType: image.contentType,
    });

    await this.mediaAssetRepository.create({
      reportId: report.id,
      kind: MediaKind.original_image,
      bucket: this.bucketName,
      objectKey,
      contentType: image.contentType,
      byteSize: image.byteSize,
    });

    return toReportSummaryDTO(report);
  }

  private ensureBucketConfigured(): void {
    if (!this.bucketName) {
      throw new GlobalErrorException(
        "S3_BUCKET is required to create reports with images",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}
