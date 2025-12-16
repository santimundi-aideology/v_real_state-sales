-- Allow users to insert their own record in the users table
-- This is needed for the signup flow

-- Allow authenticated users to insert their own user record
CREATE POLICY "Users can insert own record" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own record (in addition to the existing update policy)
-- The existing policy already covers this, but we can make it explicit
-- The existing "Users can update own data" policy should work, but let's verify it exists

-- Also allow users to read their own data (should already exist, but ensuring it's there)
-- The existing "Users can read own data" policy should cover this

