/*
  Warnings:

  - A unique constraint covering the columns `[stripeCustomerId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeSubscriptionId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN "profilePicture" TEXT;
ALTER TABLE "users" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "users" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "users" ADD COLUMN "subscriptionCurrentPeriodEnd" DATETIME;
ALTER TABLE "users" ADD COLUMN "subscriptionCurrentPeriodStart" DATETIME;

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "data" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_platform_fees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "giftId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "platform_fees_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "gifts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_platform_fees" ("amount", "createdAt", "currency", "giftId", "id", "isProcessed", "processedAt", "updatedAt") SELECT "amount", "createdAt", "currency", "giftId", "id", "isProcessed", "processedAt", "updatedAt" FROM "platform_fees";
DROP TABLE "platform_fees";
ALTER TABLE "new_platform_fees" RENAME TO "platform_fees";
CREATE UNIQUE INDEX "platform_fees_giftId_key" ON "platform_fees"("giftId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "users_stripeCustomerId_key" ON "users"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripeSubscriptionId_key" ON "users"("stripeSubscriptionId");
