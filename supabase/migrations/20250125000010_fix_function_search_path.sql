-- Fix function search_path security warnings
-- This migration sets the search_path for all functions to prevent SQL injection attacks
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- Fix cleanup_expired_sessions function (handle any signature)
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT p.oid, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
          AND p.proname = 'cleanup_expired_sessions'
    LOOP
        IF func_record.args = '' THEN
            EXECUTE format('ALTER FUNCTION %s() SET search_path = public', func_record.oid::regproc);
        ELSE
            EXECUTE format('ALTER FUNCTION %s(%s) SET search_path = public', 
                func_record.oid::regproc, func_record.args);
        END IF;
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        -- Function doesn't exist or error, skip
        NULL;
END $$;

-- Fix cleanup_expired_rate_limits function (handle any signature)
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT p.oid, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
          AND p.proname = 'cleanup_expired_rate_limits'
    LOOP
        IF func_record.args = '' THEN
            EXECUTE format('ALTER FUNCTION %s() SET search_path = public', func_record.oid::regproc);
        ELSE
            EXECUTE format('ALTER FUNCTION %s(%s) SET search_path = public', 
                func_record.oid::regproc, func_record.args);
        END IF;
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        -- Function doesn't exist or error, skip
        NULL;
END $$;

-- Fix log_security_event function (handle any signature)
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT p.oid, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
          AND p.proname = 'log_security_event'
    LOOP
        IF func_record.args = '' THEN
            EXECUTE format('ALTER FUNCTION %s() SET search_path = public', func_record.oid::regproc);
        ELSE
            EXECUTE format('ALTER FUNCTION %s(%s) SET search_path = public', 
                func_record.oid::regproc, func_record.args);
        END IF;
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        -- Function doesn't exist or error, skip
        NULL;
END $$;

-- Fix check_rate_limit function (handle any signature)
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT p.oid, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
          AND p.proname = 'check_rate_limit'
    LOOP
        IF func_record.args = '' THEN
            EXECUTE format('ALTER FUNCTION %s() SET search_path = public', func_record.oid::regproc);
        ELSE
            EXECUTE format('ALTER FUNCTION %s(%s) SET search_path = public', 
                func_record.oid::regproc, func_record.args);
        END IF;
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        -- Function doesn't exist or error, skip
        NULL;
END $$;

-- Note: If these functions don't exist yet, they will be skipped silently.
-- When they are created, they should be created with SET search_path = public in their definition.

