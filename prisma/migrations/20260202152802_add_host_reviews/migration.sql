-- CreateTable
CREATE TABLE "HostReview" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HostReview_bookingId_key" ON "HostReview"("bookingId");

-- CreateIndex
CREATE INDEX "HostReview_guestId_idx" ON "HostReview"("guestId");

-- CreateIndex
CREATE INDEX "HostReview_hostId_idx" ON "HostReview"("hostId");

-- AddForeignKey
ALTER TABLE "HostReview" ADD CONSTRAINT "HostReview_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostReview" ADD CONSTRAINT "HostReview_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostReview" ADD CONSTRAINT "HostReview_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
