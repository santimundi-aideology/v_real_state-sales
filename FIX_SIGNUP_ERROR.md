# Fix Signup Error

## Problem
When signing up, you're getting an error: "Error creating user record: {}"

This happens because there's no RLS policy allowing users to insert their own record into the `public.users` table.

## Solution

Run this migration in your Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase/migrations/003_fix_user_signup.sql`
3. Copy and paste the entire contents
4. Click "Run"

This migration will:
- ✅ Add an RLS policy allowing users to insert their own record
- ✅ Create a database trigger that automatically creates user records
- ✅ Handle both new signups and updates

## What Changed

### Before
- Users could sign up in Supabase Auth
- But couldn't create their record in `public.users` table
- Signup would fail silently

### After
- Users can sign up successfully
- Database trigger automatically creates user record
- RLS policy allows manual insertion as fallback
- Signup works reliably

## Alternative: Manual Fix

If you prefer to only use the RLS policy (without the trigger), run:

```sql
CREATE POLICY IF NOT EXISTS "Users can insert own record" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);
```

But the trigger approach is recommended as it's more reliable.

## Testing

After running the migration:

1. Try signing up again at `/auth/signup`
2. The user record should be created automatically
3. You should be able to sign in successfully

## Note

The signup page has been updated to handle errors more gracefully. Even if the manual insert fails, the trigger should create the record automatically.


