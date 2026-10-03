import { InputListReportsDTO } from "../../domain/DTOs/report/InputListReportsDTO";
import { OutputListReportsDTO } from "../../domain/DTOs/report/OutputListReportsDTO";
import { IReportRepository } from "../../domain/interfaces/repository/IReportRepository";
import { ReportRepository } from "../../repositories/report.repository";
import { toListReportsDTO } from "./reportMapper.service";

export class ReportListService {
  constructor(
    private reportRepository: IReportRepository = new ReportRepository(),
  ) {}

  public async run(input: InputListReportsDTO): Promise<OutputListReportsDTO> {
    const result = await this.reportRepository.list({
      search: input.search,
      eventType: input.eventType,
      dateFrom: input.dateFrom ? parseIsoDate(input.dateFrom) : undefined,
      dateTo: input.dateTo ? parseIsoDateEndOfDay(input.dateTo) : undefined,
      status: input.status,
      page: input.page,
      pageSize: input.pageSize,
    });

    return toListReportsDTO(result);
  }
}

function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function parseIsoDateEndOfDay(value: string): Date {
  return new Date(`${value}T23:59:59.999Z`);
}
