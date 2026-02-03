-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'CABIN', 'VILLA', 'STUDIO', 'ROOM', 'PENSION', 'OTHER');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "propertyType" "PropertyType" NOT NULL DEFAULT 'APARTMENT';
