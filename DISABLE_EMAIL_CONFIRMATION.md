# Disable Email Confirmation (Development)

## Problem
When signing in, you're getting "Email not confirmed" error. This is because Supabase Auth requires email confirmation by default.

## Solution: Disable Email Confirmation (Recommended for Development)

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard/project/optbrdgdsjncetnnzcvr
2. Click on **Authentication** in the left sidebar
3. Click on **Settings** (or go to Authentication → Settings)

### Step 2: Disable Email Confirmation
1. Scroll down to **Email Auth** section
2. Find **"Enable email confirmations"** toggle
3. **Turn it OFF** (disable it)
4. Click **Save**

### Step 3: Test
1. Try signing in again
2. It should work without email confirmation

## Alternative: Keep Email Confirmation Enabled

If you want to keep email confirmation enabled (for production-like testing):

1. After signing up, check your email inbox
2. Look for an email from Supabase
3. Click the confirmation link
4. Then try signing in

## Note for Production

- **Development**: Disable email confirmation for easier testing
- **Production**: Enable email confirmation for security
- You can also configure custom email templates in Supabase Auth settings

## Updated Sign In Page

The sign-in page has been updated to show a helpful error message if email confirmation is required.

