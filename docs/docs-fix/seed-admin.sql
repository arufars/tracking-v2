-- SEED SCRIPT: Create Admin User
-- Jalankan ini setelah register user pertama kali

-- Update user pertama jadi admin
-- Ganti email sesuai dengan email yang sudah register
update public.users 
set role = 'admin'
where email = 'admin@example.com'; -- GANTI EMAIL INI!

-- Verifikasi
select id, email, full_name, role, created_at 
from public.users 
where role = 'admin';
