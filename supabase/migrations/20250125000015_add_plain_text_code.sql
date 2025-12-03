-- Add plainTextCode field to gifts table for display/email purposes
-- The authenticationCode field will continue to store the hashed version for verification

ALTER TABLE "gifts" ADD COLUMN IF NOT EXISTS "plainTextCode" TEXT;

-- Create index for plainTextCode lookups (optional, but useful if we need to search by it)
CREATE INDEX IF NOT EXISTS "gifts_plainTextCode_idx" ON "gifts"("plainTextCode");

-- Note: We keep authenticationCode as the hashed version for security
-- plainTextCode is only used for display and email purposes

