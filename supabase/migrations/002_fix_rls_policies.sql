-- Fix RLS policy recursion issue
-- The admin check policy was causing infinite recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;

-- Create a better policy that doesn't cause recursion
-- This uses a security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create the admin policy using the function
CREATE POLICY "Admins can read all users" ON public.users
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Also allow service role to bypass RLS (for migrations and admin operations)
-- This is safe as service role key should never be exposed to client

-- For development/testing, allow anonymous reads on some tables
-- Remove these in production or refine based on your needs
CREATE POLICY "Allow anonymous read properties" ON public.properties
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read integrations" ON public.integrations
  FOR SELECT USING (true);

-- Allow authenticated users to insert/update properties (for now)
CREATE POLICY "Allow authenticated insert properties" ON public.properties
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update properties" ON public.properties
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert integrations" ON public.integrations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update integrations" ON public.integrations
  FOR UPDATE USING (auth.role() = 'authenticated');

