-- Migration: Clean up unused schema fields and tables
-- This migration removes unused fields and tables from the simplified gift flow

-- Remove unused columns from users table
ALTER TABLE "users" DROP COLUMN IF EXISTS "avatar";
ALTER TABLE "users" DROP COLUMN IF EXISTS "subscriptionPlan";
ALTER TABLE "users" DROP COLUMN IF EXISTS "subscriptionEndsAt";
ALTER TABLE "users" DROP COLUMN IF EXISTS "stripeCustomerId";
ALTER TABLE "users" DROP COLUMN IF EXISTS "stripeSubscriptionId";
ALTER TABLE "users" DROP COLUMN IF EXISTS "subscriptionCurrentPeriodStart";
ALTER TABLE "users" DROP COLUMN IF EXISTS "subscriptionCurrentPeriodEnd";

-- Remove unused column from gifts table
ALTER TABLE "gifts" DROP COLUMN IF EXISTS "platformFee";

-- Drop unused tables
DROP TABLE IF EXISTS "platform_fees";
DROP TABLE IF EXISTS "notifications";

-- Add default value for animationPreset if it doesn't exist
ALTER TABLE "gifts" ALTER COLUMN "animationPreset" SET DEFAULT 'confettiRealistic';

-- Verify the changes
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('users', 'gifts', 'user_limits')
ORDER BY table_name, ordinal_position;
