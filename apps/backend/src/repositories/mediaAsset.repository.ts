import { prisma } from "../config/database/prisma";
import {
  CreateMediaAssetRepositoryInput,
  IMediaAssetRepository,
} from "../domain/interfaces/repository/IMediaAssetRepository";
import { MediaKind } from "../generated/prisma/enums";
import { MediaAssetModel } from "../generated/prisma/models";

export class MediaAssetRepository implements IMediaAssetRepository {
  public async create(
    input: CreateMediaAssetRepositoryInput,
  ): Promise<MediaAssetModel> {
    return prisma.mediaAsset.create({
      data: input,
    });
  }

  public async findByReportAndKind(
    reportId: string,
    kind: MediaKind,
  ): Promise<MediaAssetModel | null> {
    return prisma.mediaAsset.findFirst({
      where: { reportId, kind },
      orderBy: { createdAt: "desc" },
    });
  }

  public async delete(id: string): Promise<boolean> {
    await prisma.mediaAsset.delete({
      where: { id },
    });

    return true;
  }
}
