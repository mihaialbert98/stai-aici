-- CreateTable
CREATE TABLE "CheckInLink" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "wifiName" TEXT,
    "wifiPassword" TEXT,
    "videoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckInLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestFormLink" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestFormLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestSubmission" (
    "id" TEXT NOT NULL,
    "formLinkId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "bookingId" TEXT,
    "lastName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "citizenship" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "checkInDate" TIMESTAMP(3) NOT NULL,
    "checkOutDate" TIMESTAMP(3) NOT NULL,
    "numberOfGuests" INTEGER NOT NULL,
    "gdprConsent" BOOLEAN NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retentionDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CheckInLink_propertyId_key" ON "CheckInLink"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "CheckInLink_token_key" ON "CheckInLink"("token");

-- CreateIndex
CREATE UNIQUE INDEX "GuestFormLink_propertyId_key" ON "GuestFormLink"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "GuestFormLink_token_key" ON "GuestFormLink"("token");

-- CreateIndex
CREATE INDEX "GuestSubmission_propertyId_idx" ON "GuestSubmission"("propertyId");

-- CreateIndex
CREATE INDEX "GuestSubmission_retentionDate_idx" ON "GuestSubmission"("retentionDate");

-- AddForeignKey
ALTER TABLE "CheckInLink" ADD CONSTRAINT "CheckInLink_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestFormLink" ADD CONSTRAINT "GuestFormLink_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestSubmission" ADD CONSTRAINT "GuestSubmission_formLinkId_fkey" FOREIGN KEY ("formLinkId") REFERENCES "GuestFormLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestSubmission" ADD CONSTRAINT "GuestSubmission_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
