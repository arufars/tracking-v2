-- 🔍 VERIFY & DEBUG: Check RLS Setup for Create Project
-- Jalankan query ini untuk troubleshoot error RLS

-- 1. Check apakah function has_role() ada
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'has_role'
AND routine_schema = 'public';
-- Expected: 1 row (has_role, FUNCTION)

-- 2. Check role user yang sedang login
SELECT id, email, full_name, role 
FROM users 
WHERE id = auth.uid();
-- Expected: Tampil data user dengan role 'production' atau 'admin'

-- 3. Test function has_role()
SELECT has_role('production') as is_production,
       has_role('admin') as is_admin;
-- Expected: is_production = true (jika role production)

-- 4. Check policy untuk projects insert
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'projects' AND policyname = 'project insert';
-- Expected: 1 row dengan with_check = has_role('admin') OR has_role('production')

-- 5. Check apakah RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'projects' AND schemaname = 'public';
-- Expected: rowsecurity = true

-- ⚠️ JIKA FUNCTION TIDAK ADA, JALANKAN INI:
-- (Copy dari v3-rls-FIXED.md bagian HELPER FUNCTIONS)

create or replace function has_role(role_name text)
returns boolean as $$
  select exists (
    select 1 from users
    where id = auth.uid()
      and role = role_name
  );
$$ language sql security definer;
