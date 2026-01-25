-- Migration: Add function to lookup email by username for login
-- This allows users to sign in with either email or username

-- Function to get email by username (case-insensitive)
CREATE OR REPLACE FUNCTION get_email_by_username(input_username TEXT)
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Join profiles with auth.users to get the email
  SELECT u.email INTO user_email
  FROM auth.users u
  JOIN profiles p ON u.id = p.id
  WHERE LOWER(p.username) = LOWER(input_username);

  RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anonymous users
-- (anonymous needed for login attempts)
GRANT EXECUTE ON FUNCTION get_email_by_username(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_email_by_username(TEXT) TO authenticated;
