import { ReportModel, MediaAssetModel } from "../../../generated/prisma/models";
import type {
  ReportStatus,
  CountingMethod,
} from "../../../generated/prisma/enums";

export interface ReportWithRelations extends ReportModel {
  media: MediaAssetModel[];
}

export interface CreateReportRepositoryInput {
  eventName: string;
  eventDate: Date;
  eventType: string;
  locationLat?: number | null;
  locationLng?: number | null;
  locationAddress?: string | null;
  status?: ReportStatus;
  countingMethod?: CountingMethod;
}

export interface ListReportsRepositoryInput {
  search?: string;
  eventType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: ReportStatus;
  page: number;
  pageSize: number;
}

export interface ListReportsRepositoryOutput {
  items: ReportModel[];
  page: number;
  pageSize: number;
  total: number;
}

export interface UpdateReportRepositoryInput {
  eventName?: string;
  eventDate?: Date;
  eventType?: string;
  locationLat?: number | null;
  locationLng?: number | null;
  locationAddress?: string | null;
  status?: ReportStatus;
  countingMethod?: CountingMethod;
  estimatedCount?: number | null;
  processingParams?: unknown | null;
  failureReason?: string | null;
}

export interface IReportRepository {
  create(input: CreateReportRepositoryInput): Promise<ReportModel>;
  findById(id: string): Promise<ReportWithRelations | null>;
  list(input: ListReportsRepositoryInput): Promise<ListReportsRepositoryOutput>;
  update(id: string, input: UpdateReportRepositoryInput): Promise<ReportModel>;
  delete(id: string): Promise<boolean>;
}
