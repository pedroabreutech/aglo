-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('ready', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('original_image', 'processed_image');

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "createdBy" INTEGER,
    "eventName" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "eventType" TEXT NOT NULL,
    "locationLat" DECIMAL(10,7),
    "locationLng" DECIMAL(10,7),
    "locationAddress" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'ready',
    "estimatedCount" INTEGER,
    "confidenceScore" DECIMAL(5,2),
    "processingParams" JSONB,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportArea" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "label" TEXT,
    "areaM2" DECIMAL(12,2) NOT NULL,
    "density" DECIMAL(10,4) NOT NULL,
    "polygonPath" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "reportId" TEXT,
    "kind" "MediaKind" NOT NULL,
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Report_eventType_idx" ON "Report"("eventType");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "ReportArea_reportId_idx" ON "ReportArea"("reportId");

-- CreateIndex
CREATE INDEX "MediaAsset_reportId_kind_idx" ON "MediaAsset"("reportId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_bucket_objectKey_key" ON "MediaAsset"("bucket", "objectKey");

-- AddForeignKey
ALTER TABLE "ReportArea" ADD CONSTRAINT "ReportArea_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;
