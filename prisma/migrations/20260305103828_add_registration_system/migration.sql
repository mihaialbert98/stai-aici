-- AlterTable
ALTER TABLE "User" ADD COLUMN     "receptionistSignature" TEXT;

-- CreateTable
CREATE TABLE "FormRequest" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "bookingId" TEXT,
    "arrivalDate" TIMESTAMP(3) NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "totalGuests" INTEGER NOT NULL,
    "publicToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestForm" (
    "id" TEXT NOT NULL,
    "formRequestId" TEXT NOT NULL,
    "guestIndex" INTEGER NOT NULL,
    "fullName" TEXT,
    "dateOfBirth" TEXT,
    "placeOfBirth" TEXT,
    "nationality" TEXT,
    "city" TEXT,
    "street" TEXT,
    "streetNumber" TEXT,
    "country" TEXT,
    "arrivalDate" TEXT,
    "departureDate" TEXT,
    "purposeOfTravel" TEXT,
    "idType" TEXT,
    "idSeries" TEXT,
    "idNumber" TEXT,
    "signatureImage" TEXT,
    "submittedAt" TIMESTAMP(3),
    "wordFilePath" TEXT,

    CONSTRAINT "GuestForm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FormRequest_publicToken_key" ON "FormRequest"("publicToken");

-- CreateIndex
CREATE INDEX "FormRequest_hostId_idx" ON "FormRequest"("hostId");

-- CreateIndex
CREATE INDEX "FormRequest_propertyId_idx" ON "FormRequest"("propertyId");

-- CreateIndex
CREATE INDEX "GuestForm_formRequestId_idx" ON "GuestForm"("formRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "GuestForm_formRequestId_guestIndex_key" ON "GuestForm"("formRequestId", "guestIndex");

-- AddForeignKey
ALTER TABLE "FormRequest" ADD CONSTRAINT "FormRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormRequest" ADD CONSTRAINT "FormRequest_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestForm" ADD CONSTRAINT "GuestForm_formRequestId_fkey" FOREIGN KEY ("formRequestId") REFERENCES "FormRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
