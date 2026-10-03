-- CreateEnum
CREATE TYPE "CountingMethod" AS ENUM ('mapchecking', 'automatic', 'combined');

-- AlterTable
ALTER TABLE "Report" ADD COLUMN "countingMethod" "CountingMethod" NOT NULL DEFAULT 'combined';
