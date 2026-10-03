import { InputUpdateReportDTO } from "../../domain/DTOs/report/InputUpdateReportDTO";
import { OutputReportSummaryDTO } from "../../domain/DTOs/report/OutputReportSummaryDTO";
import { IReportRepository } from "../../domain/interfaces/repository/IReportRepository";
import { NotFoundException } from "../../exceptions/notFound.exception";
import { ReportRepository } from "../../repositories/report.repository";
import { toReportSummaryDTO } from "./reportMapper.service";

export class ReportUpdateService {
  constructor(
    private reportRepository: IReportRepository = new ReportRepository(),
  ) {}

  public async run(
    id: string,
    input: InputUpdateReportDTO,
  ): Promise<OutputReportSummaryDTO> {
    const current = await this.reportRepository.findById(id);

    if (!current) {
      throw new NotFoundException("Report not found");
    }

    const report = await this.reportRepository.update(id, {
      eventName: input.eventName,
      eventDate: input.eventDate ? parseIsoDate(input.eventDate) : undefined,
      eventType: input.eventType,
      locationLat: input.location?.lat,
      locationLng: input.location?.lng,
      locationAddress: input.location?.address,
      countingMethod: input.countingMethod,
    });

    return toReportSummaryDTO(report);
  }
}

function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}
