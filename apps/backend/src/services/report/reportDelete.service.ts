import { IReportRepository } from "../../domain/interfaces/repository/IReportRepository";
import { IStorageService } from "../../domain/interfaces/services/IStorageService";
import { NotFoundException } from "../../exceptions/notFound.exception";
import { ReportRepository } from "../../repositories/report.repository";
import { createLogger } from "../../utils/logger";

const logger = createLogger("ReportDeleteService");

export class ReportDeleteService {
  constructor(
    private storageService: IStorageService,
    private reportRepository: IReportRepository = new ReportRepository(),
  ) {}

  public async run(id: string): Promise<boolean> {
    const report = await this.reportRepository.findById(id);

    if (!report) {
      throw new NotFoundException("Report not found");
    }

    for (const media of report.media) {
      await this.deleteStorageObject(media.objectKey);
    }

    await this.reportRepository.delete(id);
    return true;
  }

  private async deleteStorageObject(objectKey: string): Promise<void> {
    try {
      await this.storageService.delete(objectKey);
    } catch (error) {
      logger.warn("storage delete failed", { objectKey, error });
    }
  }
}
