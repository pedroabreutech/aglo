import { env } from "../../config/env";
import { InputProcessReportDTO } from "../../domain/DTOs/report/InputProcessReportDTO";
import { OutputReportDetailDTO } from "../../domain/DTOs/report/OutputReportDetailDTO";
import { IMediaAssetRepository } from "../../domain/interfaces/repository/IMediaAssetRepository";
import { IReportRepository } from "../../domain/interfaces/repository/IReportRepository";
import { IP2PNetClient } from "../../domain/interfaces/services/IP2PNetClient";
import { IStorageService } from "../../domain/interfaces/services/IStorageService";
import { GlobalErrorException } from "../../exceptions/globalError.exception";
import { NotFoundException } from "../../exceptions/notFound.exception";
import { ProcessingFailedException } from "../../exceptions/processingFailed.exception";
import {
  CountingMethod,
  MediaKind,
  ReportStatus,
} from "../../generated/prisma/enums";
import { MediaAssetRepository } from "../../repositories/mediaAsset.repository";
import { ReportRepository } from "../../repositories/report.repository";
import { HttpStatus } from "../../utils/httpStatus";
import { createLogger } from "../../utils/logger";
import { annotateImageBufferWithPoints } from "../processing/annotateImage.service";
import {
  AutomaticMetrics,
  buildAutomaticMetrics,
} from "../processing/reportMetrics.service";
import { P2PNetClientService } from "../processing/p2pnetClient.service";
import { buildReportObjectKey, decodeImageBase64 } from "./reportImage.service";
import { toReportDetailDTO } from "./reportMapper.service";
import { findReportMedia, resolveSignedMedia } from "./reportMedia.service";

const logger = createLogger("ReportProcessService");

function sanitizeP2pnetResponseForStorage(response: unknown): unknown | null {
  if (response === undefined || response === null) {
    return null;
  }

  if (typeof response !== "object" || Array.isArray(response)) {
    return response;
  }

  const {
    annotated_image_base64: _annotatedSnake,
    annotatedImageBase64: _annotatedCamel,
    ...rest
  } = response as Record<string, unknown>;

  return rest;
}

export class ReportProcessService {
  constructor(
    private storageService: IStorageService,
    private reportRepository: IReportRepository = new ReportRepository(),
    private mediaAssetRepository: IMediaAssetRepository = new MediaAssetRepository(),
    private p2pNetClient: IP2PNetClient = new P2PNetClientService(),
    private bucketName: string = env.s3.bucketName,
  ) {}

  public async run(
    reportId: string,
    input: InputProcessReportDTO = {},
  ): Promise<OutputReportDetailDTO> {
    this.ensureBucketConfigured();
    const report = await this.findReport(reportId);
    const countingMethod =
      input.countingMethod ?? report.countingMethod ?? CountingMethod.automatic;
    const threshold = input.threshold ?? env.p2pnet.defaultThreshold;

    await this.reportRepository.update(reportId, {
      countingMethod,
      failureReason: null,
    });

    try {
      const originalMedia = findReportMedia(report, MediaKind.original_image);

      if (!originalMedia) {
        throw new NotFoundException("Original image not found for report");
      }

      const imageBuffer = await this.storageService.download(
        originalMedia.objectKey,
      );
      const prediction = await this.p2pNetClient.predict({
        imageBuffer,
        contentType: originalMedia.contentType,
        threshold,
        weightPath: env.p2pnet.defaultWeightPath,
      });

      const metrics = buildAutomaticMetrics({
        method: countingMethod,
        predictionResponse: prediction.rawResponse,
        imageBuffer,
      });

      await this.saveProcessedImage({
        reportId,
        imageBuffer,
        detectionPoints: metrics.detectionPoints,
        fallbackAnnotatedBase64: prediction.annotatedImageBase64,
        fallbackContentType: originalMedia.contentType,
      });

      await this.persistMetrics(
        reportId,
        countingMethod,
        metrics,
        prediction.rawResponse,
        threshold,
      );

      return this.getDetail(reportId);
    } catch (error) {
      if (error instanceof ProcessingFailedException) {
        await this.markAsFailed(reportId, error.message);
      }

      throw error;
    }
  }

  private async persistMetrics(
    reportId: string,
    countingMethod: CountingMethod,
    metrics: AutomaticMetrics,
    p2pnetResponse: unknown,
    threshold: number,
  ): Promise<void> {
    await this.reportRepository.update(reportId, {
      status: ReportStatus.completed,
      estimatedCount: metrics.automaticCount,
      failureReason: null,
      processingParams: {
        countingMethod,
        threshold,
        weightPath: env.p2pnet.defaultWeightPath,
        model: "P2Pnet",
        densityReinforcementApplied:
          countingMethod === CountingMethod.automatic,
        automaticCount: metrics.automaticCount,
        detectionPoints: metrics.detectionPoints,
        densityReinforcement: metrics.densityReinforcement,
        p2pnetResponse: sanitizeP2pnetResponseForStorage(p2pnetResponse),
      },
    });
  }

  private async saveProcessedImage(params: {
    reportId: string;
    imageBuffer: Buffer;
    detectionPoints: Array<{ x: number; y: number }>;
    fallbackAnnotatedBase64?: string;
    fallbackContentType: string;
  }): Promise<void> {
    let processedImage: {
      buffer: Buffer;
      contentType: string;
      extension: string;
      byteSize: number;
    };

    if (params.detectionPoints.length > 0) {
      try {
        processedImage = await annotateImageBufferWithPoints(
          params.imageBuffer,
          params.detectionPoints,
        );
      } catch (error) {
        logger.warn(
          "reinforced annotation failed; using P2Pnet annotated image",
          {
            reportId: params.reportId,
            error,
          },
        );
        if (!params.fallbackAnnotatedBase64) {
          return;
        }
        processedImage = decodeImageBase64(
          params.fallbackAnnotatedBase64,
          undefined,
          params.fallbackContentType,
        );
      }
    } else if (params.fallbackAnnotatedBase64) {
      processedImage = decodeImageBase64(
        params.fallbackAnnotatedBase64,
        undefined,
        params.fallbackContentType,
      );
    } else {
      return;
    }

    await this.removePreviousProcessedImage(params.reportId);

    const objectKey = buildReportObjectKey({
      reportId: params.reportId,
      kind: "processed",
      extension: processedImage.extension,
    });

    await this.storageService.upload({
      objectKey,
      buffer: processedImage.buffer,
      contentType: processedImage.contentType,
    });
    await this.mediaAssetRepository.create({
      reportId: params.reportId,
      kind: MediaKind.processed_image,
      bucket: this.bucketName,
      objectKey,
      contentType: processedImage.contentType,
      byteSize: processedImage.byteSize,
    });
  }

  private async findReport(reportId: string) {
    const report = await this.reportRepository.findById(reportId);

    if (!report) {
      throw new NotFoundException("Report not found");
    }

    return report;
  }

  private async removePreviousProcessedImage(reportId: string): Promise<void> {
    const previous = await this.mediaAssetRepository.findByReportAndKind(
      reportId,
      MediaKind.processed_image,
    );

    if (!previous) {
      return;
    }

    try {
      await this.storageService.delete(previous.objectKey);
    } catch (error) {
      logger.warn("processed storage delete failed", {
        objectKey: previous.objectKey,
        error,
      });
    }

    await this.mediaAssetRepository.delete(previous.id);
  }

  private async markAsFailed(
    reportId: string,
    failureReason: string,
  ): Promise<void> {
    await this.reportRepository.update(reportId, {
      status: ReportStatus.failed,
      failureReason,
    });
  }

  private async getDetail(reportId: string): Promise<OutputReportDetailDTO> {
    const updatedReport = await this.findReport(reportId);
    const media = await resolveSignedMedia(updatedReport, this.storageService);
    return toReportDetailDTO(updatedReport, media);
  }

  private ensureBucketConfigured(): void {
    if (!this.bucketName) {
      throw new GlobalErrorException(
        "S3_BUCKET is required to process reports",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
