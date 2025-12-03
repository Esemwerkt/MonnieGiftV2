-- Fix remaining RLS performance issues
-- This migration ensures ALL policies are optimized, regardless of when they were created
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- Fix ALL policies on encrypted_data table
DO $$
DECLARE
    policy_record RECORD;
    new_using TEXT;
    new_with_check TEXT;
    policy_roles TEXT[];
    to_clause TEXT;
    valid_roles TEXT[];
    role_name TEXT;
BEGIN
    FOR policy_record IN
        SELECT 
            pol.polname, 
            pol.polcmd, 
            pg_get_expr(pol.polqual, pol.polrelid) as using_expr, 
            pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expr,
            ARRAY(
                SELECT DISTINCT r.rolname
                FROM unnest(pol.polroles) AS role_oid
                JOIN pg_roles r ON r.oid = role_oid
                WHERE r.rolname IS NOT NULL AND r.rolname != ''
            ) as roles
        FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'encrypted_data'
    LOOP
        -- Optimize auth and current_setting calls
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
        
        policy_roles := policy_record.roles;
        
        -- Build TO clause - filter out invalid roles and handle empty arrays
        valid_roles := ARRAY[]::TEXT[];
        IF array_length(policy_roles, 1) IS NOT NULL AND array_length(policy_roles, 1) > 0 THEN
            FOREACH role_name IN ARRAY policy_roles
            LOOP
                IF role_name IS NOT NULL AND role_name != '' AND role_name != '-' THEN
                    valid_roles := array_append(valid_roles, role_name);
                END IF;
            END LOOP;
        END IF;
        
        IF array_length(valid_roles, 1) IS NULL OR array_length(valid_roles, 1) = 0 THEN
            to_clause := '';
        ELSE
            to_clause := ' TO ' || array_to_string(valid_roles, ', ');
        END IF;
        
        -- Drop and recreate with optimized expressions
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.encrypted_data', policy_record.polname);
        
        IF policy_record.polcmd = 'a' THEN -- ALL
            EXECUTE format('CREATE POLICY %I ON public.encrypted_data FOR ALL%s USING (%s) WITH CHECK (%s)', 
                policy_record.polname, to_clause, new_using, new_with_check);
        ELSIF policy_record.polcmd = 'r' THEN -- SELECT
            EXECUTE format('CREATE POLICY %I ON public.encrypted_data FOR SELECT%s USING (%s)', 
                policy_record.polname, to_clause, new_using);
        ELSIF policy_record.polcmd = 'w' THEN -- UPDATE
            EXECUTE format('CREATE POLICY %I ON public.encrypted_data FOR UPDATE%s USING (%s) WITH CHECK (%s)', 
                policy_record.polname, to_clause, new_using, new_with_check);
        ELSIF policy_record.polcmd = 'd' THEN -- DELETE
            EXECUTE format('CREATE POLICY %I ON public.encrypted_data FOR DELETE%s USING (%s)', 
                policy_record.polname, to_clause, new_using);
        ELSIF policy_record.polcmd = 'i' THEN -- INSERT
            EXECUTE format('CREATE POLICY %I ON public.encrypted_data FOR INSERT%s WITH CHECK (%s)', 
                policy_record.polname, to_clause, new_with_check);
        END IF;
    END LOOP;
END $$;

-- Fix ALL policies on rate_limits table
DO $$
DECLARE
    policy_record RECORD;
    new_using TEXT;
    policy_roles TEXT[];
    to_clause TEXT;
    valid_roles TEXT[];
    role_name TEXT;
BEGIN
    FOR policy_record IN
        SELECT 
            pol.polname, 
            pol.polcmd, 
            pg_get_expr(pol.polqual, pol.polrelid) as using_expr,
            ARRAY(
                SELECT DISTINCT r.rolname
                FROM unnest(pol.polroles) AS role_oid
                JOIN pg_roles r ON r.oid = role_oid
                WHERE r.rolname IS NOT NULL AND r.rolname != ''
            ) as roles
        FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'rate_limits'
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
        
        policy_roles := policy_record.roles;
        
        -- Build TO clause - filter out invalid roles
        valid_roles := ARRAY[]::TEXT[];
        IF array_length(policy_roles, 1) IS NOT NULL AND array_length(policy_roles, 1) > 0 THEN
            FOREACH role_name IN ARRAY policy_roles
            LOOP
                IF role_name IS NOT NULL AND role_name != '' AND role_name != '-' THEN
                    valid_roles := array_append(valid_roles, role_name);
                END IF;
            END LOOP;
        END IF;
        
        IF array_length(valid_roles, 1) IS NULL OR array_length(valid_roles, 1) = 0 THEN
            to_clause := '';
        ELSE
            to_clause := ' TO ' || array_to_string(valid_roles, ', ');
        END IF;
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.rate_limits', policy_record.polname);
        EXECUTE format('CREATE POLICY %I ON public.rate_limits FOR ALL%s USING (%s)', 
            policy_record.polname, to_clause, new_using);
    END LOOP;
END $$;

-- Fix ALL policies on security_audit_log table
DO $$
DECLARE
    policy_record RECORD;
    new_using TEXT;
    policy_roles TEXT[];
    to_clause TEXT;
    valid_roles TEXT[];
    role_name TEXT;
BEGIN
    FOR policy_record IN
        SELECT 
            pol.polname, 
            pol.polcmd, 
            pg_get_expr(pol.polqual, pol.polrelid) as using_expr,
            ARRAY(
                SELECT DISTINCT r.rolname
                FROM unnest(pol.polroles) AS role_oid
                JOIN pg_roles r ON r.oid = role_oid
                WHERE r.rolname IS NOT NULL AND r.rolname != ''
            ) as roles
        FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'security_audit_log'
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
        
        policy_roles := policy_record.roles;
        
        -- Build TO clause - filter out invalid roles
        valid_roles := ARRAY[]::TEXT[];
        IF array_length(policy_roles, 1) IS NOT NULL AND array_length(policy_roles, 1) > 0 THEN
            FOREACH role_name IN ARRAY policy_roles
            LOOP
                IF role_name IS NOT NULL AND role_name != '' AND role_name != '-' THEN
                    valid_roles := array_append(valid_roles, role_name);
                END IF;
            END LOOP;
        END IF;
        
        IF array_length(valid_roles, 1) IS NULL OR array_length(valid_roles, 1) = 0 THEN
            to_clause := '';
        ELSE
            to_clause := ' TO ' || array_to_string(valid_roles, ', ');
        END IF;
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.security_audit_log', policy_record.polname);
        EXECUTE format('CREATE POLICY %I ON public.security_audit_log FOR ALL%s USING (%s)', 
            policy_record.polname, to_clause, new_using);
    END LOOP;
END $$;

-- Fix ALL policies on user_limits table and consolidate duplicates
DO $$
DECLARE
    policy_record RECORD;
    new_using TEXT;
    new_with_check TEXT;
    policy_roles TEXT[];
    system_policy_exists BOOLEAN;
    user_policy_exists BOOLEAN;
    to_clause TEXT;
    valid_roles TEXT[];
    role_name TEXT;
BEGIN
    -- Check which policies exist
    SELECT EXISTS(
        SELECT 1 FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'user_limits'
          AND pol.polname = 'System can manage user limits'
    ) INTO system_policy_exists;
    
    SELECT EXISTS(
        SELECT 1 FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'user_limits'
          AND pol.polname = 'Users can view their own limits'
    ) INTO user_policy_exists;
    
    -- If both exist, we need to make them target different roles to avoid duplicates
    -- "System can manage user limits" should target service_role only
    -- "Users can view their own limits" should target authenticated only
    IF system_policy_exists AND user_policy_exists THEN
        -- Drop both and recreate with proper role targeting
        EXECUTE 'DROP POLICY IF EXISTS "System can manage user limits" ON public.user_limits';
        EXECUTE 'DROP POLICY IF EXISTS "Users can view their own limits" ON public.user_limits';
        
        -- Recreate "System can manage user limits" for service_role only
        EXECUTE 'CREATE POLICY "System can manage user limits" ON public.user_limits FOR ALL TO service_role USING (true) WITH CHECK (true)';
        
        -- Recreate "Users can view their own limits" for authenticated only, with optimized auth calls
        -- Cast auth.uid() to text to match userId column type
        EXECUTE 'CREATE POLICY "Users can view their own limits" ON public.user_limits FOR SELECT TO authenticated USING ((select auth.uid())::text = "userId")';
        
        RAISE NOTICE 'Consolidated user_limits policies - separated by roles';
    ELSE
        -- Just optimize existing policies
        FOR policy_record IN
            SELECT 
                pol.polname, 
                pol.polcmd, 
                pg_get_expr(pol.polqual, pol.polrelid) as using_expr,
                pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expr,
                ARRAY(
                SELECT DISTINCT r.rolname
                FROM unnest(pol.polroles) AS role_oid
                JOIN pg_roles r ON r.oid = role_oid
                WHERE r.rolname IS NOT NULL AND r.rolname != ''
            ) as roles
            FROM pg_policy pol
            JOIN pg_class cls ON pol.polrelid = cls.oid
            JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
            WHERE nsp.nspname = 'public' 
              AND cls.relname = 'user_limits'
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
            
            policy_roles := policy_record.roles;
            
            -- Build TO clause - filter out invalid roles
            valid_roles := ARRAY[]::TEXT[];
            IF array_length(policy_roles, 1) IS NOT NULL AND array_length(policy_roles, 1) > 0 THEN
                FOREACH role_name IN ARRAY policy_roles
                LOOP
                    IF role_name IS NOT NULL AND role_name != '' AND role_name != '-' THEN
                        valid_roles := array_append(valid_roles, role_name);
                    END IF;
                END LOOP;
            END IF;
            
            IF array_length(valid_roles, 1) IS NULL OR array_length(valid_roles, 1) = 0 THEN
                to_clause := '';
            ELSE
                to_clause := ' TO ' || array_to_string(valid_roles, ', ');
            END IF;
            
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_limits', policy_record.polname);
            
            IF policy_record.polcmd = 'a' THEN
                EXECUTE format('CREATE POLICY %I ON public.user_limits FOR ALL%s USING (%s) WITH CHECK (%s)', 
                    policy_record.polname, to_clause, new_using, new_with_check);
            ELSIF policy_record.polcmd = 'r' THEN
                EXECUTE format('CREATE POLICY %I ON public.user_limits FOR SELECT%s USING (%s)', 
                    policy_record.polname, to_clause, new_using);
            END IF;
        END LOOP;
    END IF;
END $$;

-- Fix ALL policies on users table
DO $$
DECLARE
    policy_record RECORD;
    new_using TEXT;
    new_with_check TEXT;
    policy_roles TEXT[];
    to_clause TEXT;
    valid_roles TEXT[];
    role_name TEXT;
BEGIN
    FOR policy_record IN
        SELECT 
            pol.polname, 
            pol.polcmd, 
            pg_get_expr(pol.polqual, pol.polrelid) as using_expr,
            pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expr,
            ARRAY(
                SELECT DISTINCT r.rolname
                FROM unnest(pol.polroles) AS role_oid
                JOIN pg_roles r ON r.oid = role_oid
                WHERE r.rolname IS NOT NULL AND r.rolname != ''
            ) as roles
        FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'users'
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
        
        policy_roles := policy_record.roles;
        
        -- Build TO clause - filter out invalid roles
        valid_roles := ARRAY[]::TEXT[];
        IF array_length(policy_roles, 1) IS NOT NULL AND array_length(policy_roles, 1) > 0 THEN
            FOREACH role_name IN ARRAY policy_roles
            LOOP
                IF role_name IS NOT NULL AND role_name != '' AND role_name != '-' THEN
                    valid_roles := array_append(valid_roles, role_name);
                END IF;
            END LOOP;
        END IF;
        
        IF array_length(valid_roles, 1) IS NULL OR array_length(valid_roles, 1) = 0 THEN
            to_clause := '';
        ELSE
            to_clause := ' TO ' || array_to_string(valid_roles, ', ');
        END IF;
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', policy_record.polname);
        
        IF policy_record.polcmd = 'i' THEN
            EXECUTE format('CREATE POLICY %I ON public.users FOR INSERT%s WITH CHECK (%s)', 
                policy_record.polname, to_clause, new_with_check);
        ELSIF policy_record.polcmd = 'r' THEN
            EXECUTE format('CREATE POLICY %I ON public.users FOR SELECT%s USING (%s)', 
                policy_record.polname, to_clause, new_using);
        ELSIF policy_record.polcmd = 'w' THEN
            EXECUTE format('CREATE POLICY %I ON public.users FOR UPDATE%s USING (%s) WITH CHECK (%s)', 
                policy_record.polname, to_clause, new_using, new_with_check);
        END IF;
    END LOOP;
END $$;

-- Fix ALL policies on user_sessions table
DO $$
DECLARE
    policy_record RECORD;
    new_using TEXT;
    new_with_check TEXT;
    policy_roles TEXT[];
    to_clause TEXT;
    valid_roles TEXT[];
    role_name TEXT;
BEGIN
    FOR policy_record IN
        SELECT 
            pol.polname, 
            pol.polcmd, 
            pg_get_expr(pol.polqual, pol.polrelid) as using_expr,
            pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expr,
            ARRAY(
                SELECT DISTINCT r.rolname
                FROM unnest(pol.polroles) AS role_oid
                JOIN pg_roles r ON r.oid = role_oid
                WHERE r.rolname IS NOT NULL AND r.rolname != ''
            ) as roles
        FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'user_sessions'
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
        
        policy_roles := policy_record.roles;
        
        -- Build TO clause - filter out invalid roles
        valid_roles := ARRAY[]::TEXT[];
        IF array_length(policy_roles, 1) IS NOT NULL AND array_length(policy_roles, 1) > 0 THEN
            FOREACH role_name IN ARRAY policy_roles
            LOOP
                IF role_name IS NOT NULL AND role_name != '' AND role_name != '-' THEN
                    valid_roles := array_append(valid_roles, role_name);
                END IF;
            END LOOP;
        END IF;
        
        IF array_length(valid_roles, 1) IS NULL OR array_length(valid_roles, 1) = 0 THEN
            to_clause := '';
        ELSE
            to_clause := ' TO ' || array_to_string(valid_roles, ', ');
        END IF;
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_sessions', policy_record.polname);
        
        IF policy_record.polcmd = 'r' THEN
            EXECUTE format('CREATE POLICY %I ON public.user_sessions FOR SELECT%s USING (%s)', 
                policy_record.polname, to_clause, new_using);
        ELSIF policy_record.polcmd = 'd' THEN
            EXECUTE format('CREATE POLICY %I ON public.user_sessions FOR DELETE%s USING (%s)', 
                policy_record.polname, to_clause, new_using);
        ELSIF policy_record.polcmd = 'a' THEN
            EXECUTE format('CREATE POLICY %I ON public.user_sessions FOR ALL%s USING (%s) WITH CHECK (%s)', 
                policy_record.polname, to_clause, new_using, new_with_check);
        END IF;
    END LOOP;
END $$;

-- Fix ALL policies on gifts table
DO $$
DECLARE
    policy_record RECORD;
    new_using TEXT;
    new_with_check TEXT;
    policy_roles TEXT[];
    to_clause TEXT;
    valid_roles TEXT[];
    role_name TEXT;
BEGIN
    FOR policy_record IN
        SELECT 
            pol.polname, 
            pol.polcmd, 
            pg_get_expr(pol.polqual, pol.polrelid) as using_expr,
            pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expr,
            ARRAY(
                SELECT DISTINCT r.rolname
                FROM unnest(pol.polroles) AS role_oid
                JOIN pg_roles r ON r.oid = role_oid
                WHERE r.rolname IS NOT NULL AND r.rolname != ''
            ) as roles
        FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'gifts'
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
        
        policy_roles := policy_record.roles;
        
        -- Build TO clause - filter out invalid roles
        valid_roles := ARRAY[]::TEXT[];
        IF array_length(policy_roles, 1) IS NOT NULL AND array_length(policy_roles, 1) > 0 THEN
            FOREACH role_name IN ARRAY policy_roles
            LOOP
                IF role_name IS NOT NULL AND role_name != '' AND role_name != '-' THEN
                    valid_roles := array_append(valid_roles, role_name);
                END IF;
            END LOOP;
        END IF;
        
        IF array_length(valid_roles, 1) IS NULL OR array_length(valid_roles, 1) = 0 THEN
            to_clause := '';
        ELSE
            to_clause := ' TO ' || array_to_string(valid_roles, ', ');
        END IF;
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.gifts', policy_record.polname);
        
        IF policy_record.polcmd = 'i' THEN
            EXECUTE format('CREATE POLICY %I ON public.gifts FOR INSERT%s WITH CHECK (%s)', 
                policy_record.polname, to_clause, new_with_check);
        ELSIF policy_record.polcmd = 'r' THEN
            EXECUTE format('CREATE POLICY %I ON public.gifts FOR SELECT%s USING (%s)', 
                policy_record.polname, to_clause, new_using);
        ELSIF policy_record.polcmd = 'w' THEN
            EXECUTE format('CREATE POLICY %I ON public.gifts FOR UPDATE%s USING (%s) WITH CHECK (%s)', 
                policy_record.polname, to_clause, new_using, new_with_check);
        END IF;
    END LOOP;
END $$;

