-- Fix RLS performance issues by wrapping auth functions in SELECT subqueries
-- This prevents re-evaluation of auth functions for each row
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- Helper function to update policy expressions
-- This will replace auth.uid() with (select auth.uid()) in policy expressions

-- Fix policies for encrypted_data table
DO $$
DECLARE
    policy_record RECORD;
    new_using TEXT;
    new_with_check TEXT;
BEGIN
    -- Fix "Users can manage their own encrypted data" policy
    FOR policy_record IN
        SELECT pol.polname, pol.polcmd, pg_get_expr(pol.polqual, pol.polrelid) as using_expr, 
               pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expr
        FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'encrypted_data'
          AND pol.polname = 'Users can manage their own encrypted data'
    LOOP
        -- Replace auth.uid(), auth.role(), auth.jwt(), and current_setting() with (select ...)
        new_using := regexp_replace(
            COALESCE(policy_record.using_expr, 'true'),
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        new_using := regexp_replace(
            new_using,
            '\bcurrent_setting\(([^)]+)\)',
            '(select current_setting(\1))',
            'g'
        );
        new_with_check := regexp_replace(
            COALESCE(policy_record.with_check_expr, 'true'),
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        new_with_check := regexp_replace(
            new_with_check,
            '\bcurrent_setting\(([^)]+)\)',
            '(select current_setting(\1))',
            'g'
        );
        
        -- Drop and recreate policy with optimized expression
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.encrypted_data', policy_record.polname);
        
        IF policy_record.polcmd = 'a' THEN -- ALL
            EXECUTE format('CREATE POLICY %I ON public.encrypted_data FOR ALL USING (%s) WITH CHECK (%s)', 
                policy_record.polname, new_using, new_with_check);
        ELSIF policy_record.polcmd = 'r' THEN -- SELECT
            EXECUTE format('CREATE POLICY %I ON public.encrypted_data FOR SELECT USING (%s)', 
                policy_record.polname, new_using);
        ELSIF policy_record.polcmd = 'w' THEN -- UPDATE
            EXECUTE format('CREATE POLICY %I ON public.encrypted_data FOR UPDATE USING (%s) WITH CHECK (%s)', 
                policy_record.polname, new_using, new_with_check);
        ELSIF policy_record.polcmd = 'd' THEN -- DELETE
            EXECUTE format('CREATE POLICY %I ON public.encrypted_data FOR DELETE USING (%s)', 
                policy_record.polname, new_using);
        ELSIF policy_record.polcmd = 'i' THEN -- INSERT
            EXECUTE format('CREATE POLICY %I ON public.encrypted_data FOR INSERT WITH CHECK (%s)', 
                policy_record.polname, new_with_check);
        END IF;
    END LOOP;
    
    -- Fix "Users can view their own encrypted data" policy
    FOR policy_record IN
        SELECT pol.polname, pol.polcmd, pg_get_expr(pol.polqual, pol.polrelid) as using_expr, 
               pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expr
        FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'encrypted_data'
          AND pol.polname = 'Users can view their own encrypted data'
    LOOP
        new_using := regexp_replace(
            COALESCE(policy_record.using_expr, 'true'),
            '\bauth\.uid\(\)',
            '(select auth.uid())',
            'g'
        );
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.encrypted_data', policy_record.polname);
        EXECUTE format('CREATE POLICY %I ON public.encrypted_data FOR SELECT USING (%s)', 
            policy_record.polname, new_using);
    END LOOP;
END $$;

-- Fix policies for rate_limits table
DO $$
DECLARE
    policy_record RECORD;
    new_using TEXT;
BEGIN
    FOR policy_record IN
        SELECT pol.polname, pol.polcmd, pg_get_expr(pol.polqual, pol.polrelid) as using_expr
        FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'rate_limits'
          AND pol.polname = 'Only service role can access rate limits'
    LOOP
        new_using := regexp_replace(
            COALESCE(policy_record.using_expr, 'true'),
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        new_using := regexp_replace(
            new_using,
            '\bcurrent_setting\(([^)]+)\)',
            '(select current_setting(\1))',
            'g'
        );
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.rate_limits', policy_record.polname);
        EXECUTE format('CREATE POLICY %I ON public.rate_limits FOR ALL USING (%s)', 
            policy_record.polname, new_using);
    END LOOP;
END $$;

-- Fix policies for security_audit_log table
DO $$
DECLARE
    policy_record RECORD;
    new_using TEXT;
BEGIN
    FOR policy_record IN
        SELECT pol.polname, pol.polcmd, pg_get_expr(pol.polqual, pol.polrelid) as using_expr
        FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'security_audit_log'
          AND pol.polname = 'Only service role can access audit logs'
    LOOP
        new_using := regexp_replace(
            COALESCE(policy_record.using_expr, 'true'),
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        new_using := regexp_replace(
            new_using,
            '\bcurrent_setting\(([^)]+)\)',
            '(select current_setting(\1))',
            'g'
        );
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.security_audit_log', policy_record.polname);
        EXECUTE format('CREATE POLICY %I ON public.security_audit_log FOR ALL USING (%s)', 
            policy_record.polname, new_using);
    END LOOP;
END $$;

-- Fix policies for user_limits table
DO $$
DECLARE
    policy_record RECORD;
    new_using TEXT;
    new_with_check TEXT;
BEGIN
    -- Fix "System can manage user limits" policy
    FOR policy_record IN
        SELECT pol.polname, pol.polcmd, pg_get_expr(pol.polqual, pol.polrelid) as using_expr, 
               pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expr
        FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'user_limits'
          AND pol.polname = 'System can manage user limits'
    LOOP
        new_using := regexp_replace(
            COALESCE(policy_record.using_expr, 'true'),
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        new_using := regexp_replace(
            new_using,
            '\bcurrent_setting\(([^)]+)\)',
            '(select current_setting(\1))',
            'g'
        );
        new_with_check := regexp_replace(
            COALESCE(policy_record.with_check_expr, 'true'),
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        new_with_check := regexp_replace(
            new_with_check,
            '\bcurrent_setting\(([^)]+)\)',
            '(select current_setting(\1))',
            'g'
        );
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_limits', policy_record.polname);
        EXECUTE format('CREATE POLICY %I ON public.user_limits FOR ALL USING (%s) WITH CHECK (%s)', 
            policy_record.polname, new_using, new_with_check);
    END LOOP;
    
    -- Fix "Users can view their own limits" policy
    FOR policy_record IN
        SELECT pol.polname, pol.polcmd, pg_get_expr(pol.polqual, pol.polrelid) as using_expr
        FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'user_limits'
          AND pol.polname = 'Users can view their own limits'
    LOOP
        new_using := regexp_replace(
            COALESCE(policy_record.using_expr, 'true'),
            '\bauth\.uid\(\)',
            '(select auth.uid())',
            'g'
        );
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_limits', policy_record.polname);
        EXECUTE format('CREATE POLICY %I ON public.user_limits FOR SELECT USING (%s)', 
            policy_record.polname, new_using);
    END LOOP;
END $$;

-- Fix policies for users table
DO $$
DECLARE
    policy_record RECORD;
    new_using TEXT;
    new_with_check TEXT;
BEGIN
    FOR policy_record IN
        SELECT pol.polname, pol.polcmd, pg_get_expr(pol.polqual, pol.polrelid) as using_expr, 
               pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expr
        FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'users'
          AND pol.polname IN ('Users can insert their own data', 'Users can update their own data', 'Users can view their own data')
    LOOP
        new_using := regexp_replace(
            COALESCE(policy_record.using_expr, 'true'),
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        new_using := regexp_replace(
            new_using,
            '\bcurrent_setting\(([^)]+)\)',
            '(select current_setting(\1))',
            'g'
        );
        new_with_check := regexp_replace(
            COALESCE(policy_record.with_check_expr, 'true'),
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        new_with_check := regexp_replace(
            new_with_check,
            '\bcurrent_setting\(([^)]+)\)',
            '(select current_setting(\1))',
            'g'
        );
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', policy_record.polname);
        
        IF policy_record.polcmd = 'i' THEN
            EXECUTE format('CREATE POLICY %I ON public.users FOR INSERT WITH CHECK (%s)', 
                policy_record.polname, new_with_check);
        ELSIF policy_record.polcmd = 'r' THEN
            EXECUTE format('CREATE POLICY %I ON public.users FOR SELECT USING (%s)', 
                policy_record.polname, new_using);
        ELSIF policy_record.polcmd = 'w' THEN
            EXECUTE format('CREATE POLICY %I ON public.users FOR UPDATE USING (%s) WITH CHECK (%s)', 
                policy_record.polname, new_using, new_with_check);
        END IF;
    END LOOP;
END $$;

-- Fix policies for user_sessions table
DO $$
DECLARE
    policy_record RECORD;
    new_using TEXT;
    new_with_check TEXT;
BEGIN
    FOR policy_record IN
        SELECT pol.polname, pol.polcmd, pg_get_expr(pol.polqual, pol.polrelid) as using_expr, 
               pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expr
        FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'user_sessions'
          AND pol.polname IN ('System can manage sessions', 'Users can delete their own sessions', 'Users can view their own sessions')
    LOOP
        new_using := regexp_replace(
            COALESCE(policy_record.using_expr, 'true'),
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        new_using := regexp_replace(
            new_using,
            '\bcurrent_setting\(([^)]+)\)',
            '(select current_setting(\1))',
            'g'
        );
        new_with_check := regexp_replace(
            COALESCE(policy_record.with_check_expr, 'true'),
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        new_with_check := regexp_replace(
            new_with_check,
            '\bcurrent_setting\(([^)]+)\)',
            '(select current_setting(\1))',
            'g'
        );
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_sessions', policy_record.polname);
        
        IF policy_record.polcmd = 'r' THEN
            EXECUTE format('CREATE POLICY %I ON public.user_sessions FOR SELECT USING (%s)', 
                policy_record.polname, new_using);
        ELSIF policy_record.polcmd = 'd' THEN
            EXECUTE format('CREATE POLICY %I ON public.user_sessions FOR DELETE USING (%s)', 
                policy_record.polname, new_using);
        ELSIF policy_record.polcmd = 'a' THEN
            EXECUTE format('CREATE POLICY %I ON public.user_sessions FOR ALL USING (%s) WITH CHECK (%s)', 
                policy_record.polname, new_using, new_with_check);
        END IF;
    END LOOP;
END $$;

-- Fix policies for gifts table
DO $$
DECLARE
    policy_record RECORD;
    new_using TEXT;
    new_with_check TEXT;
BEGIN
    FOR policy_record IN
        SELECT pol.polname, pol.polcmd, pg_get_expr(pol.polqual, pol.polrelid) as using_expr, 
               pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expr
        FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'gifts'
          AND pol.polname IN ('Users can create gifts', 'Users can update gifts they sent', 'Users can view gifts they sent or received', 'Users can view all gifts', 'Users can update gifts')
    LOOP
        new_using := regexp_replace(
            COALESCE(policy_record.using_expr, 'true'),
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        new_using := regexp_replace(
            new_using,
            '\bcurrent_setting\(([^)]+)\)',
            '(select current_setting(\1))',
            'g'
        );
        new_with_check := regexp_replace(
            COALESCE(policy_record.with_check_expr, 'true'),
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        new_with_check := regexp_replace(
            new_with_check,
            '\bcurrent_setting\(([^)]+)\)',
            '(select current_setting(\1))',
            'g'
        );
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.gifts', policy_record.polname);
        
        IF policy_record.polcmd = 'i' THEN
            EXECUTE format('CREATE POLICY %I ON public.gifts FOR INSERT WITH CHECK (%s)', 
                policy_record.polname, new_with_check);
        ELSIF policy_record.polcmd = 'r' THEN
            EXECUTE format('CREATE POLICY %I ON public.gifts FOR SELECT USING (%s)', 
                policy_record.polname, new_using);
        ELSIF policy_record.polcmd = 'w' THEN
            EXECUTE format('CREATE POLICY %I ON public.gifts FOR UPDATE USING (%s) WITH CHECK (%s)', 
                policy_record.polname, new_using, new_with_check);
        END IF;
    END LOOP;
END $$;

