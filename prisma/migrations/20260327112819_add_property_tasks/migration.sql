-- CreateTable
CREATE TABLE "PropertyTask" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyTask_propertyId_idx" ON "PropertyTask"("propertyId");

-- AddForeignKey
ALTER TABLE "PropertyTask" ADD CONSTRAINT "PropertyTask_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
