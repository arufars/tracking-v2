# 🚀 SETUP INSTRUCTIONS - Create Project Feature

## ⚠️ PENTING: Setup Database Trigger (Recommended)

Feature create project akan bekerja dengan 2 cara:

### **Option 1: With Auto-Assignment Trigger** ✅ Recommended
Trigger otomatis assign creator ke project. **Lebih flexible!**
- ✅ Tidak perlu update saat tambah column
- ✅ Clean separation of concerns
- ✅ Maintainable

### **Option 2: Manual Assignment** 
Code handle assignment manual. Works, tapi assignment bisa fail.

---

## 📝 Setup Trigger (Recommended)

### 1. Buka Supabase Dashboard
1. Login ke [supabase.com](https://supabase.com)
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar kiri

### 2. Jalankan SQL Trigger
Copy paste SQL berikut ke SQL Editor dan klik **RUN**:

**Source**: `docs/docs-fix/v3-trigger-FIXED.md` (bagian auto-assign project creator)

```sql
-- 🎯 AUTO-ASSIGN CREATOR TO PROJECT
-- Trigger untuk otomatis assign creator ke project setelah project dibuat

-- Trigger function
create or replace function auto_assign_project_creator()
returns trigger as $$
declare
  v_role text;
begin
  -- Get user role
  select role into v_role
  from users
  where id = NEW.created_by;

  -- Auto-assign creator to project
  insert into user_projects (
    user_id,
    project_id,
    access_level,
    team_role
  ) values (
    NEW.created_by,
    NEW.id,
    'admin',
    case 
      when v_role = 'admin' then 'admin'
      else 'production_manager'
    end
  );

  return NEW;
end;
$$ language plpgsql security definer;

-- Create trigger
drop trigger if exists trigger_auto_assign_project_creator on projects;

create trigger trigger_auto_assign_project_creator
  after insert on projects
  for each row
  execute function auto_assign_project_creator();
```

### 3. Verifikasi Trigger
Setelah run SQL, verifikasi dengan query:

```sql
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_auto_assign_project_creator';
```

Jika muncul 1 row, berarti trigger berhasil dibuat.

---

## 💡 Keuntungan Pakai Trigger

### ✅ Flexible
- Tambah column baru di `projects`? **Tidak perlu update trigger!**
- Code tetap simple: insert ke `projects`, trigger handle sisanya

### ✅ Atomic
- Project dan assignment dibuat dalam 1 transaksi
- Rollback otomatis jika ada error

### ✅ Maintainable
- Logic ada di database
- Code aplikasi tetap clean dan simple

### ✅ Reusable
- Trigger bekerja untuk semua insert (from app, SQL editor, import, dll)

---

## 🆚 Comparison: Function vs Trigger vs Manual

| Aspect | Database Function | Trigger | Manual Code |
|--------|------------------|---------|-------------|
| **Flexibility** | ❌ Harus update parameter | ✅ Auto-adapt | ✅ Flexible |
| **Maintainability** | ❌ Complex | ✅ Simple | ⚠️ Moderate |
| **Atomicity** | ✅ Yes | ✅ Yes | ❌ 2 separate calls |
| **Error Handling** | ✅ Rollback | ✅ Rollback | ⚠️ Partial failure |
| **Add Column** | ❌ Update function | ✅ No change | ✅ No change |

**Winner: Trigger** 🏆

---

## 🔍 Troubleshooting

### Error: "function create_project_with_assignment does not exist"
**Solution**: Jalankan ulang SQL function di step 2.

### Error: "Unauthorized: Only admin and production can create projects"
**Solution**: 
- Cek role user di table `users`
- Pastikan role adalah `admin` atau `production`
- Jalankan seed admin jika belum:
  ```sql
  update public.users 
  set role = 'admin'
  where email = 'your-email@example.com';
  ```

### Error: "Failed to create project"
**Solution**: 
1. Buka browser console (F12)
2. Lihat error message detail
3. Cek apakah:
   - User sudah login
   - Role sudah benar
   - Database function sudah ada
   - RLS policies sudah aktif

---

## ✅ Testing

Setelah setup, test dengan:

1. Login sebagai role `production`
2. Navigate ke `/dashboard/production/projects`
3. Click **Create Project** button
4. Fill form dan submit
5. Jika berhasil, akan muncul toast "Project created successfully!"

---

## 📂 File Reference

| File | Purpose |
|------|---------|
| `docs/docs-fix/create-project-function.sql` | SQL function untuk create project |
| `src/server/project-actions.ts` | Server action yang memanggil function |
| `src/components/projects/create-project-dialog.tsx` | UI form component |
| `docs/CREATE_PROJECT_FEATURE.md` | Feature documentation |

---

## 🎯 Summary

✅ **Before Using**:
- Run SQL function di Supabase
- Verify function exists
- Set user role to `admin` or `production`

✅ **After Setup**:
- Feature ready to use
- Production can create projects
- Auto-assigned as project admin

---

**Need Help?** Check browser console for detailed error messages.
