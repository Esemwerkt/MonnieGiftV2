-- Remove unused subscription fields from users table
ALTER TABLE "users" DROP COLUMN IF EXISTS "profilePicture";
ALTER TABLE "users" DROP COLUMN IF EXISTS "subscriptionPlan";
ALTER TABLE "users" DROP COLUMN IF EXISTS "subscriptionStatus";
ALTER TABLE "users" DROP COLUMN IF EXISTS "subscriptionEndsAt";
ALTER TABLE "users" DROP COLUMN IF EXISTS "stripeCustomerId";
ALTER TABLE "users" DROP COLUMN IF EXISTS "stripeSubscriptionId";
ALTER TABLE "users" DROP COLUMN IF EXISTS "subscriptionCurrentPeriodStart";
ALTER TABLE "users" DROP COLUMN IF EXISTS "subscriptionCurrentPeriodEnd";

-- Add missing fields to gifts table
ALTER TABLE "gifts" ADD COLUMN IF NOT EXISTS "animationPreset" TEXT;
ALTER TABLE "gifts" ADD COLUMN IF NOT EXISTS "platformFeeAmount" INTEGER DEFAULT 99;
ALTER TABLE "gifts" ADD COLUMN IF NOT EXISTS "applicationFeeAmount" INTEGER DEFAULT 0;
ALTER TABLE "gifts" ADD COLUMN IF NOT EXISTS "stripeConnectAccountId" TEXT;

-- Add index for the new field
CREATE INDEX IF NOT EXISTS "gifts_stripeConnectAccountId_idx" ON "gifts"("stripeConnectAccountId");

-- Update the gifts table to have proper defaults
ALTER TABLE "gifts" ALTER COLUMN "platformFeeAmount" SET DEFAULT 99;
ALTER TABLE "gifts" ALTER COLUMN "applicationFeeAmount" SET DEFAULT 0;
