# Database Amendment Scripts

## Purpose
This document explains how to apply the database amendments to fix authentication issues.

## Issue Identified

1. **Missing Columns**: The `profiles` table was missing `first_name` and `last_name` columns that the backend expects
2. **RLS Policy Too Restrictive**: The Row Level Security policy on `profile_roles` only allowed admins to insert roles, preventing user registration

## Solution

The `amendment_auth_fix.sql` script fixes these issues by:

1. Adding `first_name` and `last_name` columns to the `profiles` table
2. Migrating existing `name` data to the new columns
3. Fixing RLS policies to allow the backend (using service role key) to create profiles and assign roles
4. Adding a trigger to auto-create profiles when users sign up
5. Setting up proper permissions for authenticated users

## How to Apply

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `amendment_auth_fix.sql`
5. Click **Run** to execute the script

### Option 2: Via Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push
```

### Option 3: Manual SQL Execution

If you have direct database access:

```bash
psql -h your-database-host -U postgres -d postgres -f db_scripts/amendment_auth_fix.sql
```

## Verification

After applying the script, verify it worked:

### 1. Check Profiles Table Structure

Run this query in Supabase SQL Editor:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;
```

Expected columns:
- `id` (uuid)
- `name` (text) 
- `email` (text)
- `avatar` (text)
- `created_at` (timestamp)
- `first_name` (text) ← NEW
- `last_name` (text) ← NEW

### 2. Check RLS Policies

```sql
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'profile_roles')
ORDER BY tablename, policyname;
```

Expected policies for `profile_roles`:
- `profile_roles_service_role_manage` (for service_role)
- `profile_roles_admin_full_access` (for authenticated admins)
- `profile_roles_users_read_own` (for authenticated users)

### 3. Test User Registration

Try registering a new student through your frontend:

1. Go to http://localhost:5173/register/student
2. Fill in the form with a valid class code
3. Submit the form
4. Check the backend console - should NOT see RLS policy violation errors
5. Check Supabase dashboard → Authentication → Users - should see new user
6. Check Supabase dashboard → Table Editor → profiles - should see new profile with first_name and last_name
7. Check Supabase dashboard → Table Editor → profile_roles - should see role assignment

## Important Notes

### Service Role Key

The backend uses the `SUPABASE_KEY` environment variable, which should be your **service role key** (not the anon key). The service role key bypasses RLS policies.

To verify you're using the correct key:

1. Go to Supabase Dashboard → Settings → API
2. Look for "service_role" key (secret)
3. Make sure your backend `.env` has:
   ```
   SUPABASE_KEY=eyJhbGc...your-service-role-key-here
   ```

**⚠️ NEVER expose the service role key in frontend code!**

### Anon Key vs Service Role Key

- **Anon Key**: Used in frontend, has RLS restrictions
- **Service Role Key**: Used in backend, bypasses RLS (admin access)

Your backend `.env` should look like:

```env
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGc...service-role-key  # NOT the anon key!
```

## Troubleshooting

### Still Getting "row violates row-level security policy"

1. **Check you're using the service role key in backend**
   - Not the anon key
   - Find it in Supabase Dashboard → Settings → API → service_role

2. **Verify the script ran successfully**
   - Check for errors in SQL Editor
   - Run the verification queries above

3. **Check table permissions**
   ```sql
   SELECT grantee, privilege_type 
   FROM information_schema.role_table_grants 
   WHERE table_name = 'profile_roles';
   ```

### Still Getting "Could not find column"

1. **Verify columns were added**
   ```sql
   SELECT * FROM information_schema.columns 
   WHERE table_name = 'profiles' 
   AND column_name IN ('first_name', 'last_name');
   ```

2. **Try manual column addition**
   ```sql
   ALTER TABLE public.profiles ADD COLUMN first_name TEXT;
   ALTER TABLE public.profiles ADD COLUMN last_name TEXT;
   ```

### Backend Still Failing

1. **Restart your backend server** after applying DB changes
2. **Clear any database schema cache** (restart completely)
3. **Check environment variables** are correct

## Rollback (if needed)

If you need to undo the changes:

```sql
-- Remove new columns (CAREFUL: this deletes data!)
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS first_name,
  DROP COLUMN IF EXISTS last_name;

-- Remove new policies
DROP POLICY IF EXISTS "profile_roles_service_role_manage" ON public.profile_roles;
DROP POLICY IF EXISTS "profile_roles_admin_full_access" ON public.profile_roles;
DROP POLICY IF EXISTS "profile_roles_users_read_own" ON public.profile_roles;
DROP POLICY IF EXISTS "profiles_service_role_manage" ON public.profiles;
DROP POLICY IF EXISTS "profiles_users_read_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_users_update_own" ON public.profiles;

-- Remove trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```

## Support

If you continue to experience issues after applying this amendment:

1. Check the backend console logs for detailed error messages
2. Check Supabase Dashboard → Logs for database errors
3. Verify all verification queries pass
4. Ensure you're using the service role key in backend

