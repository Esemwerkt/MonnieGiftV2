-- Remove unused tables that are not referenced in the code
-- Based on code analysis, these tables are not used anywhere in the application

-- Drop notifications table (not used in code)
DROP TABLE IF EXISTS "notifications" CASCADE;

-- Drop platform_fees table (not used in code)
DROP TABLE IF EXISTS "platform_fees" CASCADE;

-- Keep only the tables that are actually used:
-- - users (used in API routes)
-- - gifts (used in API routes) 
-- - user_limits (used in limits.ts)
