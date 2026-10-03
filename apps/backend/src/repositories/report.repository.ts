import { prisma } from "../config/database/prisma";
import {
  CreateReportRepositoryInput,
  IReportRepository,
  ListReportsRepositoryInput,
  ListReportsRepositoryOutput,
  ReportWithRelations,
  UpdateReportRepositoryInput,
} from "../domain/interfaces/repository/IReportRepository";
import { Prisma } from "../generated/prisma/client";
import { ReportModel } from "../generated/prisma/models";

export class ReportRepository implements IReportRepository {
  public async create(
    input: CreateReportRepositoryInput,
  ): Promise<ReportModel> {
    return prisma.report.create({
      data: input,
    });
  }

  public async findById(id: string): Promise<ReportWithRelations | null> {
    return prisma.report.findUnique({
      where: { id },
      include: {
        media: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  public async list(
    input: ListReportsRepositoryInput,
  ): Promise<ListReportsRepositoryOutput> {
    const where = this.buildWhere(input);
    const skip = (input.page - 1) * input.pageSize;

    const [items, total] = await prisma.$transaction([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: input.pageSize,
      }),
      prisma.report.count({ where }),
    ]);

    return {
      items,
      page: input.page,
      pageSize: input.pageSize,
      total,
    };
  }

  public async update(
    id: string,
    input: UpdateReportRepositoryInput,
  ): Promise<ReportModel> {
    const { processingParams, ...rest } = input;
    const data: Prisma.ReportUpdateInput = { ...rest };

    if ("processingParams" in input) {
      data.processingParams =
        processingParams === null
          ? Prisma.JsonNull
          : (processingParams as Prisma.InputJsonValue);
    }

    return prisma.report.update({
      where: { id },
      data,
    });
  }

  public async delete(id: string): Promise<boolean> {
    await prisma.report.delete({
      where: { id },
    });

    return true;
  }

  private buildWhere(input: ListReportsRepositoryInput) {
    return {
      ...(input.eventType ? { eventType: input.eventType } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.dateFrom || input.dateTo
        ? {
            createdAt: {
              ...(input.dateFrom ? { gte: input.dateFrom } : {}),
              ...(input.dateTo ? { lte: input.dateTo } : {}),
            },
          }
        : {}),
      ...(input.search
        ? {
            OR: [
              {
                eventName: {
                  contains: input.search,
                  mode: "insensitive" as const,
                },
              },
              {
                locationAddress: {
                  contains: input.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };
  }
}
