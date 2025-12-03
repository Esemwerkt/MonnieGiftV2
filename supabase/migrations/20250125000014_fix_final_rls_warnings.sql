-- Final fix for remaining RLS performance warnings
-- This migration specifically targets the policies that still have warnings
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- Fix "Users can view their own encrypted data" policy
DO $$
DECLARE
    policy_using TEXT;
    policy_roles TEXT[];
BEGIN
    -- Get the current policy expression
    SELECT 
        pg_get_expr(pol.polqual, pol.polrelid),
        ARRAY(
            SELECT DISTINCT r.rolname
            FROM unnest(pol.polroles) AS role_oid
            JOIN pg_roles r ON r.oid = role_oid
            WHERE r.rolname IS NOT NULL AND r.rolname != ''
        )
    INTO policy_using, policy_roles
    FROM pg_policy pol
    JOIN pg_class cls ON pol.polrelid = cls.oid
    JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
    WHERE nsp.nspname = 'public' 
      AND cls.relname = 'encrypted_data'
      AND pol.polname = 'Users can view their own encrypted data'
      AND pol.polcmd = 'r'
    LIMIT 1;
    
    IF policy_using IS NOT NULL THEN
        -- Optimize auth and current_setting calls - handle all variations
        policy_using := regexp_replace(
            policy_using,
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        policy_using := regexp_replace(
            policy_using,
            '\bcurrent_setting\(([^)]+)\)',
            '(select current_setting(\1))',
            'g'
        );
        
        -- Build TO clause
        DECLARE
            to_clause TEXT;
        BEGIN
            IF array_length(policy_roles, 1) IS NULL OR array_length(policy_roles, 1) = 0 THEN
                to_clause := '';
            ELSE
                to_clause := ' TO ' || array_to_string(policy_roles, ', ');
            END IF;
            
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.encrypted_data', 'Users can view their own encrypted data');
            EXECUTE format('CREATE POLICY %I ON public.encrypted_data FOR SELECT%s USING (%s)', 
                'Users can view their own encrypted data', to_clause, policy_using);
        END;
    END IF;
END $$;

-- Fix "Only service role can access rate limits" policy
DO $$
DECLARE
    policy_using TEXT;
    policy_roles TEXT[];
    to_clause TEXT;
BEGIN
    SELECT 
        pg_get_expr(pol.polqual, pol.polrelid),
        ARRAY(
            SELECT DISTINCT r.rolname
            FROM unnest(pol.polroles) AS role_oid
            JOIN pg_roles r ON r.oid = role_oid
            WHERE r.rolname IS NOT NULL AND r.rolname != ''
        )
    INTO policy_using, policy_roles
    FROM pg_policy pol
    JOIN pg_class cls ON pol.polrelid = cls.oid
    JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
    WHERE nsp.nspname = 'public' 
      AND cls.relname = 'rate_limits'
      AND pol.polname = 'Only service role can access rate limits'
    LIMIT 1;
    
    IF policy_using IS NOT NULL THEN
        policy_using := regexp_replace(
            policy_using,
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        policy_using := regexp_replace(
            policy_using,
            '\bcurrent_setting\(([^)]+)\)',
            '(select current_setting(\1))',
            'g'
        );
        
        IF array_length(policy_roles, 1) IS NULL OR array_length(policy_roles, 1) = 0 THEN
            to_clause := '';
        ELSE
            to_clause := ' TO ' || array_to_string(policy_roles, ', ');
        END IF;
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.rate_limits', 'Only service role can access rate limits');
        EXECUTE format('CREATE POLICY %I ON public.rate_limits FOR ALL%s USING (%s)', 
            'Only service role can access rate limits', to_clause, policy_using);
    END IF;
END $$;

-- Fix "Only service role can access audit logs" policy
DO $$
DECLARE
    policy_using TEXT;
    policy_roles TEXT[];
    to_clause TEXT;
BEGIN
    SELECT 
        pg_get_expr(pol.polqual, pol.polrelid),
        ARRAY(
            SELECT DISTINCT r.rolname
            FROM unnest(pol.polroles) AS role_oid
            JOIN pg_roles r ON r.oid = role_oid
            WHERE r.rolname IS NOT NULL AND r.rolname != ''
        )
    INTO policy_using, policy_roles
    FROM pg_policy pol
    JOIN pg_class cls ON pol.polrelid = cls.oid
    JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
    WHERE nsp.nspname = 'public' 
      AND cls.relname = 'security_audit_log'
      AND pol.polname = 'Only service role can access audit logs'
    LIMIT 1;
    
    IF policy_using IS NOT NULL THEN
        policy_using := regexp_replace(
            policy_using,
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        policy_using := regexp_replace(
            policy_using,
            '\bcurrent_setting\(([^)]+)\)',
            '(select current_setting(\1))',
            'g'
        );
        
        IF array_length(policy_roles, 1) IS NULL OR array_length(policy_roles, 1) = 0 THEN
            to_clause := '';
        ELSE
            to_clause := ' TO ' || array_to_string(policy_roles, ', ');
        END IF;
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.security_audit_log', 'Only service role can access audit logs');
        EXECUTE format('CREATE POLICY %I ON public.security_audit_log FOR ALL%s USING (%s)', 
            'Only service role can access audit logs', to_clause, policy_using);
    END IF;
END $$;

-- Fix "Users can update their own data" policy on users table
DO $$
DECLARE
    policy_using TEXT;
    policy_with_check TEXT;
    policy_roles TEXT[];
    to_clause TEXT;
BEGIN
    SELECT 
        pg_get_expr(pol.polqual, pol.polrelid),
        pg_get_expr(pol.polwithcheck, pol.polrelid),
        ARRAY(
            SELECT DISTINCT r.rolname
            FROM unnest(pol.polroles) AS role_oid
            JOIN pg_roles r ON r.oid = role_oid
            WHERE r.rolname IS NOT NULL AND r.rolname != ''
        )
    INTO policy_using, policy_with_check, policy_roles
    FROM pg_policy pol
    JOIN pg_class cls ON pol.polrelid = cls.oid
    JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
    WHERE nsp.nspname = 'public' 
      AND cls.relname = 'users'
      AND pol.polname = 'Users can update their own data'
      AND pol.polcmd = 'w'
    LIMIT 1;
    
    IF policy_using IS NOT NULL THEN
        policy_using := regexp_replace(
            policy_using,
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        policy_using := regexp_replace(
            policy_using,
            '\bcurrent_setting\(([^)]+)\)',
            '(select current_setting(\1))',
            'g'
        );
        policy_with_check := regexp_replace(
            COALESCE(policy_with_check, 'true'),
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        policy_with_check := regexp_replace(
            policy_with_check,
            '\bcurrent_setting\(([^)]+)\)',
            '(select current_setting(\1))',
            'g'
        );
        
        IF array_length(policy_roles, 1) IS NULL OR array_length(policy_roles, 1) = 0 THEN
            to_clause := '';
        ELSE
            to_clause := ' TO ' || array_to_string(policy_roles, ', ');
        END IF;
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', 'Users can update their own data');
        EXECUTE format('CREATE POLICY %I ON public.users FOR UPDATE%s USING (%s) WITH CHECK (%s)', 
            'Users can update their own data', to_clause, policy_using, policy_with_check);
    END IF;
END $$;

-- Fix "Users can view their own data" policy on users table
DO $$
DECLARE
    policy_using TEXT;
    policy_roles TEXT[];
    to_clause TEXT;
BEGIN
    SELECT 
        pg_get_expr(pol.polqual, pol.polrelid),
        ARRAY(
            SELECT DISTINCT r.rolname
            FROM unnest(pol.polroles) AS role_oid
            JOIN pg_roles r ON r.oid = role_oid
            WHERE r.rolname IS NOT NULL AND r.rolname != ''
        )
    INTO policy_using, policy_roles
    FROM pg_policy pol
    JOIN pg_class cls ON pol.polrelid = cls.oid
    JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
    WHERE nsp.nspname = 'public' 
      AND cls.relname = 'users'
      AND pol.polname = 'Users can view their own data'
      AND pol.polcmd = 'r'
    LIMIT 1;
    
    IF policy_using IS NOT NULL THEN
        policy_using := regexp_replace(
            policy_using,
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        policy_using := regexp_replace(
            policy_using,
            '\bcurrent_setting\(([^)]+)\)',
            '(select current_setting(\1))',
            'g'
        );
        
        IF array_length(policy_roles, 1) IS NULL OR array_length(policy_roles, 1) = 0 THEN
            to_clause := '';
        ELSE
            to_clause := ' TO ' || array_to_string(policy_roles, ', ');
        END IF;
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', 'Users can view their own data');
        EXECUTE format('CREATE POLICY %I ON public.users FOR SELECT%s USING (%s)', 
            'Users can view their own data', to_clause, policy_using);
    END IF;
END $$;

-- Fix "Users can delete their own sessions" policy
DO $$
DECLARE
    policy_using TEXT;
    policy_roles TEXT[];
    to_clause TEXT;
BEGIN
    SELECT 
        pg_get_expr(pol.polqual, pol.polrelid),
        ARRAY(
            SELECT DISTINCT r.rolname
            FROM unnest(pol.polroles) AS role_oid
            JOIN pg_roles r ON r.oid = role_oid
            WHERE r.rolname IS NOT NULL AND r.rolname != ''
        )
    INTO policy_using, policy_roles
    FROM pg_policy pol
    JOIN pg_class cls ON pol.polrelid = cls.oid
    JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
    WHERE nsp.nspname = 'public' 
      AND cls.relname = 'user_sessions'
      AND pol.polname = 'Users can delete their own sessions'
      AND pol.polcmd = 'd'
    LIMIT 1;
    
    IF policy_using IS NOT NULL THEN
        policy_using := regexp_replace(
            policy_using,
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        policy_using := regexp_replace(
            policy_using,
            '\bcurrent_setting\(([^)]+)\)',
            '(select current_setting(\1))',
            'g'
        );
        
        IF array_length(policy_roles, 1) IS NULL OR array_length(policy_roles, 1) = 0 THEN
            to_clause := '';
        ELSE
            to_clause := ' TO ' || array_to_string(policy_roles, ', ');
        END IF;
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_sessions', 'Users can delete their own sessions');
        EXECUTE format('CREATE POLICY %I ON public.user_sessions FOR DELETE%s USING (%s)', 
            'Users can delete their own sessions', to_clause, policy_using);
    END IF;
END $$;

-- Fix "Users can view their own sessions" policy
DO $$
DECLARE
    policy_using TEXT;
    policy_roles TEXT[];
    to_clause TEXT;
BEGIN
    SELECT 
        pg_get_expr(pol.polqual, pol.polrelid),
        ARRAY(
            SELECT DISTINCT r.rolname
            FROM unnest(pol.polroles) AS role_oid
            JOIN pg_roles r ON r.oid = role_oid
            WHERE r.rolname IS NOT NULL AND r.rolname != ''
        )
    INTO policy_using, policy_roles
    FROM pg_policy pol
    JOIN pg_class cls ON pol.polrelid = cls.oid
    JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
    WHERE nsp.nspname = 'public' 
      AND cls.relname = 'user_sessions'
      AND pol.polname = 'Users can view their own sessions'
      AND pol.polcmd = 'r'
    LIMIT 1;
    
    IF policy_using IS NOT NULL THEN
        policy_using := regexp_replace(
            policy_using,
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        policy_using := regexp_replace(
            policy_using,
            '\bcurrent_setting\(([^)]+)\)',
            '(select current_setting(\1))',
            'g'
        );
        
        IF array_length(policy_roles, 1) IS NULL OR array_length(policy_roles, 1) = 0 THEN
            to_clause := '';
        ELSE
            to_clause := ' TO ' || array_to_string(policy_roles, ', ');
        END IF;
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_sessions', 'Users can view their own sessions');
        EXECUTE format('CREATE POLICY %I ON public.user_sessions FOR SELECT%s USING (%s)', 
            'Users can view their own sessions', to_clause, policy_using);
    END IF;
END $$;

-- Fix "Users can update gifts they sent" policy
DO $$
DECLARE
    policy_using TEXT;
    policy_with_check TEXT;
    policy_roles TEXT[];
    to_clause TEXT;
BEGIN
    SELECT 
        pg_get_expr(pol.polqual, pol.polrelid),
        pg_get_expr(pol.polwithcheck, pol.polrelid),
        ARRAY(
            SELECT DISTINCT r.rolname
            FROM unnest(pol.polroles) AS role_oid
            JOIN pg_roles r ON r.oid = role_oid
            WHERE r.rolname IS NOT NULL AND r.rolname != ''
        )
    INTO policy_using, policy_with_check, policy_roles
    FROM pg_policy pol
    JOIN pg_class cls ON pol.polrelid = cls.oid
    JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
    WHERE nsp.nspname = 'public' 
      AND cls.relname = 'gifts'
      AND pol.polname = 'Users can update gifts they sent'
      AND pol.polcmd = 'w'
    LIMIT 1;
    
    IF policy_using IS NOT NULL THEN
        policy_using := regexp_replace(
            policy_using,
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        policy_using := regexp_replace(
            policy_using,
            '\bcurrent_setting\(([^)]+)\)',
            '(select current_setting(\1))',
            'g'
        );
        policy_with_check := regexp_replace(
            COALESCE(policy_with_check, 'true'),
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        policy_with_check := regexp_replace(
            policy_with_check,
            '\bcurrent_setting\(([^)]+)\)',
            '(select current_setting(\1))',
            'g'
        );
        
        IF array_length(policy_roles, 1) IS NULL OR array_length(policy_roles, 1) = 0 THEN
            to_clause := '';
        ELSE
            to_clause := ' TO ' || array_to_string(policy_roles, ', ');
        END IF;
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.gifts', 'Users can update gifts they sent');
        EXECUTE format('CREATE POLICY %I ON public.gifts FOR UPDATE%s USING (%s) WITH CHECK (%s)', 
            'Users can update gifts they sent', to_clause, policy_using, policy_with_check);
    END IF;
END $$;

