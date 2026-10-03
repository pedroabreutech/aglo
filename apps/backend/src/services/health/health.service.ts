import { prisma } from "../../config/database/prisma";

export interface HealthCheckResult {
  status: string;
  uptime: number;
  timestamp: string;
  services: {
    database: string;
  };
  message?: string;
}

export class HealthService {
  public async check(): Promise<HealthCheckResult> {
    try {
      await prisma.$queryRaw`SELECT 1`;

      return {
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        services: {
          database: "connected",
        },
      };
    } catch (error) {
      return {
        status: "error",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        services: {
          database: "disconnected",
        },
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
