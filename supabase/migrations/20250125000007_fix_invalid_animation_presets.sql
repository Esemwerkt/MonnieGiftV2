-- Fix invalid animation presets in gifts table
-- Update any gifts with invalid 'confetti' preset to 'confettiRealistic'
UPDATE "gifts" 
SET "animationPreset" = 'confettiRealistic' 
WHERE "animationPreset" = 'confetti' 
   OR "animationPreset" IS NULL 
   OR "animationPreset" NOT IN ('customShapes', 'schoolPride', 'snow', 'stars', 'fireworks', 'confettiRealistic');

