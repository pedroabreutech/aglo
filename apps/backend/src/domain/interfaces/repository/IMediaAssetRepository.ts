import { MediaAssetModel } from "../../../generated/prisma/models";
import type { MediaKind } from "../../../generated/prisma/enums";

export interface CreateMediaAssetRepositoryInput {
  reportId?: string | null;
  kind: MediaKind;
  bucket: string;
  objectKey: string;
  contentType: string;
  byteSize: number;
}

export interface IMediaAssetRepository {
  create(input: CreateMediaAssetRepositoryInput): Promise<MediaAssetModel>;
  findByReportAndKind(
    reportId: string,
    kind: MediaKind,
  ): Promise<MediaAssetModel | null>;
  delete(id: string): Promise<boolean>;
}
