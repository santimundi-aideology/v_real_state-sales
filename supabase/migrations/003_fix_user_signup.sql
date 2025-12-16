-- Fix user signup: Allow users to insert their own record AND create automatic trigger
-- This migration combines both approaches for maximum reliability

-- 1. Allow authenticated users to insert their own user record (RLS policy)
CREATE POLICY IF NOT EXISTS "Users can insert own record" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 2. Create a trigger function to automatically create a user record
-- when a new user signs up in auth.users
-- This is more reliable than client-side insertion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'sales_rep'),
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = COALESCE(EXCLUDED.name, public.users.name),
    email = EXCLUDED.email,
    role = COALESCE(EXCLUDED.role, public.users.role),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

