import { OutputReportDetailDTO } from "../../domain/DTOs/report/OutputReportDetailDTO";
import { IReportRepository } from "../../domain/interfaces/repository/IReportRepository";
import { IStorageService } from "../../domain/interfaces/services/IStorageService";
import { NotFoundException } from "../../exceptions/notFound.exception";
import { ReportRepository } from "../../repositories/report.repository";
import { toReportDetailDTO } from "./reportMapper.service";
import { resolveSignedMedia } from "./reportMedia.service";

export class ReportGetByIdService {
  constructor(
    private storageService: IStorageService,
    private reportRepository: IReportRepository = new ReportRepository(),
  ) {}

  public async run(id: string): Promise<OutputReportDetailDTO> {
    const report = await this.reportRepository.findById(id);

    if (!report) {
      throw new NotFoundException("Report not found");
    }

    const media = await resolveSignedMedia(report, this.storageService);
    return toReportDetailDTO(report, media);
  }
}
