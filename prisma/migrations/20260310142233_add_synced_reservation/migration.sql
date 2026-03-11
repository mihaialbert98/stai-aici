-- CreateTable
CREATE TABLE "SyncedReservation" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "guestName" TEXT,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncedReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SyncedReservation_propertyId_idx" ON "SyncedReservation"("propertyId");

-- CreateIndex
CREATE INDEX "SyncedReservation_propertyId_source_idx" ON "SyncedReservation"("propertyId", "source");

-- AddForeignKey
ALTER TABLE "SyncedReservation" ADD CONSTRAINT "SyncedReservation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
