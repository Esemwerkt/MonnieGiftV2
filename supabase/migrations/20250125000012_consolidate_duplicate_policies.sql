-- Consolidate duplicate permissive RLS policies for better performance
-- Multiple permissive policies for the same role/action are inefficient
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies

-- Fix gifts table: Consolidate "Users can view all gifts" and "Users can view gifts they sent or received"
-- Since "Users can view all gifts" is more permissive, we'll keep that one and drop the other
-- Also ensure the kept policy uses (select auth.uid()) for performance
DO $$
DECLARE
    all_gifts_policy_exists BOOLEAN;
    own_gifts_policy_exists BOOLEAN;
    all_gifts_using TEXT;
    all_gifts_roles TEXT[];
BEGIN
    -- Check if both policies exist
    SELECT EXISTS(
        SELECT 1 FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'gifts'
          AND pol.polname = 'Users can view all gifts'
          AND pol.polcmd = 'r'
    ) INTO all_gifts_policy_exists;
    
    SELECT EXISTS(
        SELECT 1 FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'gifts'
          AND pol.polname = 'Users can view gifts they sent or received'
          AND pol.polcmd = 'r'
    ) INTO own_gifts_policy_exists;
    
    -- If both exist, get the "Users can view all gifts" policy details and recreate it with optimized auth calls
    IF all_gifts_policy_exists AND own_gifts_policy_exists THEN
        -- Get the using expression and roles from the "all gifts" policy
        SELECT 
            pg_get_expr(pol.polqual, pol.polrelid),
            ARRAY(SELECT unnest(pol.polroles)::regrole::text)
        INTO all_gifts_using, all_gifts_roles
        FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'gifts'
          AND pol.polname = 'Users can view all gifts'
          AND pol.polcmd = 'r'
        LIMIT 1;
        
        -- Optimize auth function calls
        all_gifts_using := regexp_replace(
            COALESCE(all_gifts_using, 'true'),
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        
        -- Drop both policies
        EXECUTE 'DROP POLICY IF EXISTS "Users can view all gifts" ON public.gifts';
        EXECUTE 'DROP POLICY IF EXISTS "Users can view gifts they sent or received" ON public.gifts';
        
        -- Recreate the "all gifts" policy with optimized expression
        EXECUTE format('CREATE POLICY "Users can view all gifts" ON public.gifts FOR SELECT TO %s USING (%s)',
            array_to_string(all_gifts_roles, ', '), all_gifts_using);
        
        RAISE NOTICE 'Consolidated gifts SELECT policies - kept "Users can view all gifts" with optimized auth calls';
    ELSIF own_gifts_policy_exists AND NOT all_gifts_policy_exists THEN
        -- If only the restrictive one exists, keep it but optimize it
        SELECT 
            pg_get_expr(pol.polqual, pol.polrelid),
            ARRAY(SELECT unnest(pol.polroles)::regrole::text)
        INTO all_gifts_using, all_gifts_roles
        FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'gifts'
          AND pol.polname = 'Users can view gifts they sent or received'
          AND pol.polcmd = 'r'
        LIMIT 1;
        
        all_gifts_using := regexp_replace(
            COALESCE(all_gifts_using, 'true'),
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        
        EXECUTE 'DROP POLICY IF EXISTS "Users can view gifts they sent or received" ON public.gifts';
        EXECUTE format('CREATE POLICY "Users can view gifts they sent or received" ON public.gifts FOR SELECT TO %s USING (%s)',
            array_to_string(all_gifts_roles, ', '), all_gifts_using);
        
        RAISE NOTICE 'Optimized "Users can view gifts they sent or received" policy';
    END IF;
END $$;

-- Fix gifts table UPDATE policies: Consolidate "Users can update gifts" and "Users can update gifts they sent"
-- Keep the more restrictive one (users can only update their own) and optimize it
DO $$
DECLARE
    all_update_policy_exists BOOLEAN;
    own_update_policy_exists BOOLEAN;
    update_using TEXT;
    update_with_check TEXT;
    update_roles TEXT[];
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'gifts'
          AND pol.polname = 'Users can update gifts'
          AND pol.polcmd = 'w'
    ) INTO all_update_policy_exists;
    
    SELECT EXISTS(
        SELECT 1 FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'gifts'
          AND pol.polname = 'Users can update gifts they sent'
          AND pol.polcmd = 'w'
    ) INTO own_update_policy_exists;
    
    -- If both exist, keep the more restrictive one and optimize it
    IF all_update_policy_exists AND own_update_policy_exists THEN
        -- Get the "update gifts they sent" policy details
        SELECT 
            pg_get_expr(pol.polqual, pol.polrelid),
            pg_get_expr(pol.polwithcheck, pol.polrelid),
            ARRAY(SELECT unnest(pol.polroles)::regrole::text)
        INTO update_using, update_with_check, update_roles
        FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'gifts'
          AND pol.polname = 'Users can update gifts they sent'
          AND pol.polcmd = 'w'
        LIMIT 1;
        
        -- Optimize auth function calls
        update_using := regexp_replace(
            COALESCE(update_using, 'true'),
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        update_with_check := regexp_replace(
            COALESCE(update_with_check, 'true'),
            '\bauth\.(uid|role|jwt)\(\)',
            '(select auth.\1())',
            'g'
        );
        
        -- Drop both policies
        EXECUTE 'DROP POLICY IF EXISTS "Users can update gifts" ON public.gifts';
        EXECUTE 'DROP POLICY IF EXISTS "Users can update gifts they sent" ON public.gifts';
        
        -- Recreate the restrictive policy with optimized expressions
        EXECUTE format('CREATE POLICY "Users can update gifts they sent" ON public.gifts FOR UPDATE TO %s USING (%s) WITH CHECK (%s)',
            array_to_string(update_roles, ', '), update_using, update_with_check);
        
        RAISE NOTICE 'Consolidated gifts UPDATE policies - kept "Users can update gifts they sent" with optimized auth calls';
    END IF;
END $$;

-- Fix encrypted_data table: Consolidate duplicate SELECT policies
DO $$
BEGIN
    -- Check if both policies exist
    IF EXISTS(
        SELECT 1 FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'encrypted_data'
          AND pol.polname = 'Users can manage their own encrypted data'
          AND pol.polcmd = 'r'
    ) AND EXISTS(
        SELECT 1 FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'encrypted_data'
          AND pol.polname = 'Users can view their own encrypted data'
          AND pol.polcmd = 'r'
    ) THEN
        -- "Users can manage their own encrypted data" likely covers SELECT, UPDATE, DELETE
        -- "Users can view their own encrypted data" is redundant for SELECT
        EXECUTE 'DROP POLICY IF EXISTS "Users can view their own encrypted data" ON public.encrypted_data';
        RAISE NOTICE 'Dropped redundant policy "Users can view their own encrypted data"';
    END IF;
END $$;

-- Fix user_limits table: Consolidate duplicate SELECT policies
DO $$
BEGIN
    -- Check if both policies exist
    IF EXISTS(
        SELECT 1 FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'user_limits'
          AND pol.polname = 'System can manage user limits'
          AND pol.polcmd = 'r'
    ) AND EXISTS(
        SELECT 1 FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'user_limits'
          AND pol.polname = 'Users can view their own limits'
          AND pol.polcmd = 'r'
    ) THEN
        -- Keep both but they serve different purposes:
        -- "System can manage user limits" - for service role/system
        -- "Users can view their own limits" - for authenticated users
        -- These might need different roles, so we'll keep both but ensure they're optimized
        -- (already done in previous migration with SELECT subqueries)
        RAISE NOTICE 'Both user_limits policies kept - they serve different roles';
    END IF;
END $$;

-- Fix user_sessions table: Consolidate duplicate policies
DO $$
BEGIN
    -- Check if both policies exist for SELECT
    IF EXISTS(
        SELECT 1 FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'user_sessions'
          AND pol.polname = 'System can manage sessions'
          AND pol.polcmd = 'r'
    ) AND EXISTS(
        SELECT 1 FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'user_sessions'
          AND pol.polname = 'Users can view their own sessions'
          AND pol.polcmd = 'r'
    ) THEN
        -- These serve different purposes (system vs users), keep both
        RAISE NOTICE 'Both user_sessions SELECT policies kept - they serve different purposes';
    END IF;
    
    -- Check if both policies exist for DELETE
    IF EXISTS(
        SELECT 1 FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'user_sessions'
          AND pol.polname = 'System can manage sessions'
          AND pol.polcmd = 'd'
    ) AND EXISTS(
        SELECT 1 FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'user_sessions'
          AND pol.polname = 'Users can delete their own sessions'
          AND pol.polcmd = 'd'
    ) THEN
        -- These serve different purposes (system vs users), keep both
        RAISE NOTICE 'Both user_sessions DELETE policies kept - they serve different purposes';
    END IF;
END $$;

