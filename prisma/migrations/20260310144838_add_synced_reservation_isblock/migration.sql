-- AlterTable
ALTER TABLE "SyncedReservation" ADD COLUMN     "isBlock" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "summary" TEXT;
