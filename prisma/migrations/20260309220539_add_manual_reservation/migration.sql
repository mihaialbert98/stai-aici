-- CreateTable
CREATE TABLE "ManualReservation" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "guestName" TEXT,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL,
    "source" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ManualReservation_hostId_idx" ON "ManualReservation"("hostId");

-- CreateIndex
CREATE INDEX "ManualReservation_propertyId_idx" ON "ManualReservation"("propertyId");

-- AddForeignKey
ALTER TABLE "ManualReservation" ADD CONSTRAINT "ManualReservation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualReservation" ADD CONSTRAINT "ManualReservation_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
