-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "basePrice" DOUBLE PRECISION,
ADD COLUMN     "extraGuestFee" DOUBLE PRECISION,
ADD COLUMN     "nightlyPrices" JSONB;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "baseGuests" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "extraGuestPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PeriodPricing" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "pricePerNight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PeriodPricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PeriodPricing_propertyId_idx" ON "PeriodPricing"("propertyId");

-- AddForeignKey
ALTER TABLE "PeriodPricing" ADD CONSTRAINT "PeriodPricing_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
