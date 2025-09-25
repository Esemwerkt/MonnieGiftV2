-- AlterTable
ALTER TABLE "gifts" ADD COLUMN "platformFee" INTEGER;

-- CreateTable
CREATE TABLE "platform_fees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "giftId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_fees_giftId_key" ON "platform_fees"("giftId");
