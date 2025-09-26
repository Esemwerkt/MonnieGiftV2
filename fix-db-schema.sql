-- Fix the animationPreset column in the gifts table
-- This will remove any default value and make the column NOT NULL

-- First, check if there's a default value
SELECT column_name, column_default 
FROM information_schema.columns 
WHERE table_name = 'gifts' 
AND column_name = 'animationPreset';

-- Remove the default value if it exists
ALTER TABLE "gifts" 
ALTER COLUMN "animationPreset" DROP DEFAULT;

-- Make the column NOT NULL (this will fail if there are NULL values)
-- If it fails, we need to update NULL values first
UPDATE "gifts" 
SET "animationPreset" = 'confettiRealistic' 
WHERE "animationPreset" IS NULL;

-- Now make it NOT NULL
ALTER TABLE "gifts" 
ALTER COLUMN "animationPreset" SET NOT NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'gifts' 
AND column_name = 'animationPreset';
