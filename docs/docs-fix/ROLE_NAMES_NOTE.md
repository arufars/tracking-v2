# ⚠️ Catatan Penting: Role Names

**Date**: January 8, 2026

## 🔄 **PERUBAHAN ROLE NAMES**

Role names dalam sistem menggunakan **huruf kecil** dan berbeda dari dokumentasi awal:

| Dokumentasi Awal | Role Name Sebenarnya | Keterangan                          |
| ---------------- | -------------------- | ----------------------------------- |
| `TIM_PRODUKSI`   | `production`         | Role untuk internal production team |
| `BROADCASTER`    | `broadcaster`        | Role untuk client/broadcaster       |
| `INVESTOR`       | `investor`           | Role untuk investor/stakeholder     |

---

## ✅ **FILE YANG SUDAH DIPERBAIKI**

### **SQL File**

- ✅ `rls-policies-corrected.sql` - File SQL dengan role names yang benar

### **⚠️ File Dokumentasi yang Masih Perlu Update**

Jika ingin konsisten, file-file berikut masih menggunakan nama lama:

- `DOKUMENTASI_ROLE_BASED_ACCESS_CONTROL.md`
- `RBAC_IMPLEMENTATION_SUMMARY.md`
- `RBAC_IMPLEMENTATION_CHECKLIST.md`
- `RBAC_QUICK_REFERENCE.md`

**Catatan**: File dokumentasi masih menggunakan `TIM_PRODUKSI`, `BROADCASTER`, `INVESTOR` dengan huruf besar untuk konsistensi dan kemudahan membaca. Saat implementasi kode, pastikan menggunakan lowercase: `production`, `broadcaster`, `investor`.

---

## 📝 **CARA IMPLEMENTASI**

### **1. Database (SQL)**

```sql
-- Gunakan lowercase
WHERE users.role = 'production'
WHERE users.role = 'broadcaster'
WHERE users.role = 'investor'
```

### **2. Backend Code (TypeScript/JavaScript)**

```typescript
// Enum definition
enum UserRole {
  PRODUCTION = "production",
  BROADCASTER = "broadcaster",
  INVESTOR = "investor",
}

// Checking role
if (user.role === "production") {
}
if (user.role === "broadcaster") {
}
if (user.role === "investor") {
}
```

### **3. Prisma Schema**

```prisma
enum Role {
  production
  broadcaster
  investor
}

model User {
  id    String @id @default(cuid())
  email String @unique
  role  Role   @default(production)
}
```

---

## 🔍 **FIND & REPLACE GUIDE**

Jika ingin update dokumentasi untuk konsistensi penuh:

```
Find: TIM_PRODUKSI
Replace: production

Find: BROADCASTER
Replace: broadcaster

Find: INVESTOR
Replace: investor

Find: Tim Produksi
Replace: Production

Find: Broadcaster/Client
Replace: Broadcaster
```

**Note**: Pastikan case-sensitive saat find & replace!

---

## 🎯 **REKOMENDASI**

### **Opsi 1: Dokumentasi Display Name (Recommended)**

- Dokumentasi menggunakan nama display: "Tim Produksi", "Broadcaster", "Investor"
- Kode & database menggunakan: `production`, `broadcaster`, `investor`
- Pros: Dokumentasi lebih mudah dibaca
- Cons: Ada perbedaan antara docs vs code

### **Opsi 2: Konsistensi Penuh**

- Update semua dokumentasi ke lowercase
- Pros: 100% konsisten
- Cons: Dokumentasi kurang natural untuk dibaca

---

## 💡 **KESIMPULAN**

**Yang Penting:**

- ✅ **Database & Code HARUS pakai lowercase**: `production`, `broadcaster`, `investor`
- ✅ **SQL file sudah benar**: `rls-policies-corrected.sql`
- 📚 **Dokumentasi**: Bisa tetap pakai display name untuk kemudahan membaca

**File yang Ready untuk Production:**

- ✅ `rls-policies-corrected.sql` - Siap execute di database

---

**Last Updated**: January 8, 2026
