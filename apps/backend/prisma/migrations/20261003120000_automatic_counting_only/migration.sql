-- Relatórios combinados mantêm apenas a parcela automática já calculada.
UPDATE "Report"
SET
    "countingMethod" = CASE
        WHEN "processingParams"->>'automaticVariant' = 'automatic_conservative'
            OR ("processingParams"->>'automaticVariant' IS NULL
                AND "processingParams"->>'densityReinforcementApplied' = 'false')
        THEN 'automatic_conservative'::"CountingMethod"
        ELSE 'automatic'::"CountingMethod"
    END,
    "estimatedCount" = CASE
        WHEN "status" = 'completed'
        THEN COALESCE(
            ("processingParams"->>'automaticCount')::INTEGER,
            CASE WHEN jsonb_typeof("processingParams"->'detectionPoints') = 'array'
                THEN jsonb_array_length("processingParams"->'detectionPoints') END,
            CASE WHEN jsonb_typeof("processingParams"->'p2pnetResponse'->'points') = 'array'
                THEN jsonb_array_length("processingParams"->'p2pnetResponse'->'points') END,
            0
        )
        ELSE NULL
    END,
    "processingParams" = "processingParams" - 'mapCount'
WHERE "countingMethod" = 'combined';

-- Relatórios só de mapchecking não têm contagem automática: voltam para "ready".
UPDATE "Report"
SET
    "countingMethod" = 'automatic',
    "status" = 'ready',
    "estimatedCount" = NULL,
    "processingParams" = NULL,
    "failureReason" = NULL
WHERE "countingMethod" = 'mapchecking';

-- AlterEnum
CREATE TYPE "CountingMethod_new" AS ENUM ('automatic', 'automatic_conservative');
ALTER TABLE "Report" ALTER COLUMN "countingMethod" DROP DEFAULT;
ALTER TABLE "Report" ALTER COLUMN "countingMethod" TYPE "CountingMethod_new" USING ("countingMethod"::text::"CountingMethod_new");
ALTER TYPE "CountingMethod" RENAME TO "CountingMethod_old";
ALTER TYPE "CountingMethod_new" RENAME TO "CountingMethod";
DROP TYPE "CountingMethod_old";
ALTER TABLE "Report" ALTER COLUMN "countingMethod" SET DEFAULT 'automatic';

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "confidenceScore";

-- DropTable
DROP TABLE "ReportArea";
