-- Drop and recreate tables with clean schema
-- This will remove all the unused subscription fields and fix the structure

-- Drop foreign key constraints first
ALTER TABLE "platform_fees" DROP CONSTRAINT IF EXISTS "platform_fees_giftId_fkey";
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_userId_fkey";
ALTER TABLE "user_limits" DROP CONSTRAINT IF EXISTS "user_limits_userId_fkey";

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS "user_limits";
DROP TABLE IF EXISTS "notifications";
DROP TABLE IF EXISTS "platform_fees";
DROP TABLE IF EXISTS "gifts";
DROP TABLE IF EXISTS "users";

-- Recreate users table with clean schema
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "stripeConnectAccountId" TEXT UNIQUE,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "identityVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Recreate gifts table with all needed fields
CREATE TABLE "gifts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "message" TEXT,
    "senderEmail" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "authenticationCode" TEXT NOT NULL UNIQUE,
    "isClaimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP(3),
    "stripePaymentIntentId" TEXT,
    "stripeTransferId" TEXT,
    "platformFee" INTEGER,
    "animationPreset" TEXT,
    "platformFeeAmount" INTEGER DEFAULT 99,
    "applicationFeeAmount" INTEGER DEFAULT 0,
    "stripeConnectAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Recreate platform_fees table
CREATE TABLE "platform_fees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "giftId" TEXT UNIQUE,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "platform_fees_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "gifts"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Recreate notifications table
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "data" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Recreate user_limits table
CREATE TABLE "user_limits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "giftCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_limits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_limits_userId_month_year_key" UNIQUE ("userId", "month", "year")
);

-- Recreate indexes
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "gifts_authenticationCode_idx" ON "gifts"("authenticationCode");
CREATE INDEX "gifts_recipientEmail_idx" ON "gifts"("recipientEmail");
CREATE INDEX "gifts_stripeConnectAccountId_idx" ON "gifts"("stripeConnectAccountId");
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX "user_limits_userId_idx" ON "user_limits"("userId");
