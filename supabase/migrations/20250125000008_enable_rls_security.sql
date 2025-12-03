-- Enable Row Level Security (RLS) on tables that have policies but RLS disabled
-- This fixes the security linter errors for tables in the public schema

-- Enable RLS on encrypted_data table
-- Policies: "Users can manage their own encrypted data", "Users can view their own encrypted data"
ALTER TABLE IF EXISTS "public"."encrypted_data" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on rate_limits table
-- Policy: "Only service role can access rate limits"
ALTER TABLE IF EXISTS "public"."rate_limits" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on security_audit_log table
-- Policy: "Only service role can access audit logs"
ALTER TABLE IF EXISTS "public"."security_audit_log" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_sessions table
-- Policies: "System can manage sessions", "Users can delete their own sessions", "Users can view their own sessions"
ALTER TABLE IF EXISTS "public"."user_sessions" ENABLE ROW LEVEL SECURITY;

-- Note: The policies mentioned in the linter errors should already exist.
-- This migration only enables RLS on the tables. If policies don't exist,
-- they would need to be created separately, but the linter indicates they do exist.

