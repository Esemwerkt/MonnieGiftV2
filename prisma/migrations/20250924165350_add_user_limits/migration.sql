/*
  Warnings:

  - You are about to drop the column `previewAnimationStyle` on the `gifts` table. All the data in the column will be lost.
  - You are about to drop the column `previewConfettiType` on the `gifts` table. All the data in the column will be lost.
  - You are about to drop the column `previewConfettiVariant` on the `gifts` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_gifts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "message" TEXT,
    "senderEmail" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "authenticationCode" TEXT NOT NULL,
    "isClaimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" DATETIME,
    "stripePaymentIntentId" TEXT,
    "stripeTransferId" TEXT,
    "platformFee" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_gifts" ("amount", "authenticationCode", "claimedAt", "createdAt", "currency", "id", "isClaimed", "message", "platformFee", "recipientEmail", "senderEmail", "stripePaymentIntentId", "stripeTransferId", "updatedAt") SELECT "amount", "authenticationCode", "claimedAt", "createdAt", "currency", "id", "isClaimed", "message", "platformFee", "recipientEmail", "senderEmail", "stripePaymentIntentId", "stripeTransferId", "updatedAt" FROM "gifts";
DROP TABLE "gifts";
ALTER TABLE "new_gifts" RENAME TO "gifts";
CREATE UNIQUE INDEX "gifts_authenticationCode_key" ON "gifts"("authenticationCode");
CREATE TABLE "new_user_limits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "giftCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_limits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_limits" ("createdAt", "giftCount", "id", "month", "totalAmount", "updatedAt", "userId", "year") SELECT "createdAt", "giftCount", "id", "month", "totalAmount", "updatedAt", "userId", "year" FROM "user_limits";
DROP TABLE "user_limits";
ALTER TABLE "new_user_limits" RENAME TO "user_limits";
CREATE UNIQUE INDEX "user_limits_userId_month_year_key" ON "user_limits"("userId", "month", "year");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
