-- LMNL App Database Fix
-- Migration 004: Fix User Signup Trigger RLS Issue
--
-- Problem: The handle_new_user() trigger was being blocked by RLS policies
-- because auth.uid() is not set during the trigger execution context.
--
-- Solution: Recreate the function with explicit schema paths and proper
-- SECURITY DEFINER settings, plus add service_role policy.

-- ============================================
-- Drop existing trigger and function
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================
-- Recreate function with proper settings
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Extract username from metadata or generate from email
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    LOWER(SPLIT_PART(NEW.email, '@', 1))
  );

  -- Clean username (alphanumeric and underscores only)
  base_username := REGEXP_REPLACE(base_username, '[^a-z0-9_]', '', 'g');

  -- Ensure minimum length
  IF LENGTH(base_username) < 3 THEN
    base_username := 'user_' || SUBSTR(NEW.id::TEXT, 1, 8);
  END IF;

  -- Find unique username
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
  END LOOP;

  -- Create profile (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    final_username
  );

  RETURN NEW;
END;
$$;

-- ============================================
-- Recreate trigger on auth.users
-- ============================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Grant permissions
-- ============================================
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- ============================================
-- Add service_role policy for profiles
-- ============================================
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  TO service_role
  WITH CHECK (true);
