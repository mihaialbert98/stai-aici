-- AlterTable
ALTER TABLE "GuestFormLink" ADD COLUMN     "activeGuestCount" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "GuestSubmission" ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "wordFileContent" BYTEA;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "guestCapacity" INTEGER NOT NULL DEFAULT 1;
