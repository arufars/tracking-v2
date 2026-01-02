# 📚 Dokumentasi Struktur Kode - Studio Admin Dashboard

> Dokumentasi lengkap struktur folder dan file proyek Next.js Admin Dashboard Template

---

## 📑 **DAFTAR ISI**

### **Pengenalan**
- [🏗️ Arsitektur Proyek](#️-arsitektur-proyek)
- [📁 Struktur Folder Utama](#-struktur-folder-utama)

### **Folder Struktur Detail**
1. [📂 src/app/ - Halaman & Routing](#1-srcapp---struktur-halaman-aplikasi)
2. [📂 src/components/ - Komponen UI](#2-srccomponents---komponen-ui-reusable)
3. [📂 src/config/ - Konfigurasi](#3-srcconfig---konfigurasi-aplikasi)
4. [📂 src/data/ - Data Mock](#4-srcdata---data-mockdummy)
5. [📂 src/hooks/ - Custom Hooks](#5-srchooks---custom-react-hooks)
6. [📂 src/lib/ - Utilities](#6-srclib---utility-functions--helpers)
7. [📂 src/navigation/ - Navigasi](#7-srcnavigation---struktur-menu-navigasi)
8. [📂 src/scripts/ - Build Scripts](#8-srcscripts---build-scripts--utilities)
9. [📂 src/server/ - Server Actions](#9-srcserver---server-actions-backend-logic)
10. [📂 src/stores/ - State Management](#10-srcstores---state-management-zustand)
11. [📂 src/styles/ - Custom Styles](#11-srcstylespreset---theme-preset-css)
12. [📂 src/types/ - TypeScript Types](#12-srctypes---typescript-type-definitions)

### **Sistem & Fitur**
- [🎯 Sistem & Alur Kerja](#-sistem--alur-kerja)
  - [Theme System](#1-theme-system-sistem-tema)
  - [Layout System](#2-layout-system-sistem-layout)
  - [Navigation System](#3-navigation-system-sistem-navigasi)
  - [Data Table System](#4-data-table-system)
  - [Form System](#5-form-system)

### **Panduan Penggunaan**
- [📦 Teknologi & Dependencies](#-teknologi--dependencies)
- [🚀 Commands & Scripts](#-commands--scripts)
- [📖 Best Practices](#-best-practices)
- [🎨 Customization Guide](#-customization-guide)
- [🐛 Troubleshooting](#-troubleshooting)
- [📚 Resources](#-resources)
- [📝 Notes](#-notes)
- [🤝 Contributing](#-contributing)

---

## 🏗️ **ARSITEKTUR PROYEK**

Ini adalah **template dashboard admin** yang dibangun dengan Next.js 16, TypeScript, dan shadcn/ui. Digunakan untuk membuat aplikasi admin panel, SaaS dashboard, atau internal tools.

---

## 📁 **STRUKTUR FOLDER UTAMA**

```
next-shadcn-admin-dashboard/
├── src/
│   ├── app/              # Halaman & routing (App Router)
│   ├── components/       # Komponen UI reusable
│   ├── config/          # Konfigurasi aplikasi
│   ├── data/            # Data dummy/mock
│   ├── hooks/           # Custom React Hooks
│   ├── lib/             # Utility functions & helpers
│   ├── navigation/      # Konfigurasi menu navigasi
│   ├── scripts/         # Build scripts
│   ├── server/          # Server Actions (backend logic)
│   ├── stores/          # State management (Zustand)
│   ├── styles/          # CSS custom & theme presets
│   └── types/           # TypeScript type definitions
├── biome.json           # Konfigurasi linter & formatter
├── components.json      # Konfigurasi shadcn/ui
├── next.config.mjs      # Konfigurasi Next.js
├── package.json         # Dependencies & scripts
└── tsconfig.json        # Konfigurasi TypeScript
```

---

## 📂 **PENJELASAN DETAIL SETIAP FOLDER**

### **1. src/app/** - Struktur Halaman Aplikasi

Menggunakan **App Router** dari Next.js (routing berbasis folder).

#### **File Utama:**
- **`layout.tsx`** - Layout utama yang membungkus semua halaman
  - Mengatur font Inter
  - Setup theme system (dark/light mode)
  - Menyediakan PreferencesStoreProvider untuk state management
  - Menambahkan Toaster untuk notifikasi
  
- **`globals.css`** - CSS global untuk styling seluruh aplikasi
  - Tailwind CSS v4 directives
  - CSS variables untuk theming
  - Base styles

- **`not-found.tsx`** - Halaman error 404 (halaman tidak ditemukan)

#### **Route Groups:**

**Folder dengan tanda kurung ( )** adalah **route groups** (tidak mempengaruhi URL):

##### **(external)/** - Halaman Publik
- `page.tsx` - Landing page
- Halaman yang bisa diakses tanpa login

##### **(main)/** - Halaman Protected (Butuh Login)

**`auth/`** - Halaman Autentikasi
- `v1/` - Versi 1 tampilan auth (login, register, forgot password)
- `v2/` - Versi 2 tampilan auth (desain alternatif)
- `_components/` - Komponen shared untuk auth

**`dashboard/`** - Halaman Dashboard Utama
- `layout.tsx` - Layout dengan sidebar & navbar
- `page.tsx` - Dashboard default
- Sub-folder lain untuk halaman dashboard lainnya

**`unauthorized/`** - Halaman "Akses Ditolak"
- Ditampilkan kalau user tidak punya izin untuk akses halaman tertentu

---

### **2. src/components/** - Komponen UI Reusable

#### **ui/** - Komponen Dasar UI (50+ Komponen)

Folder ini berisi komponen UI siap pakai dari **shadcn/ui**:

##### **Input & Form:**
- `button.tsx` - Tombol dengan berbagai variant (default, outline, ghost, destructive)
- `input.tsx` - Input text dengan styling
- `textarea.tsx` - Text area untuk input panjang
- `select.tsx` - Dropdown select
- `checkbox.tsx` - Checkbox input
- `radio-group.tsx` - Radio button group
- `switch.tsx` - Toggle switch (on/off)
- `slider.tsx` - Slider untuk pilih angka/range
- `form.tsx` - Form wrapper dengan validasi (React Hook Form + Zod)
- `input-otp.tsx` - Input untuk OTP/kode verifikasi
- `calendar.tsx` - Calendar picker
- `date-picker.tsx` - Date picker component

##### **Layout & Container:**
- `card.tsx` - Kartu/box untuk konten dengan header, content, footer
- `dialog.tsx` - Modal popup/dialog
- `sheet.tsx` - Sidebar slide dari samping (drawer)
- `sidebar.tsx` - Sidebar navigasi
- `accordion.tsx` - Konten yang bisa expand/collapse
- `collapsible.tsx` - Konten yang bisa disembunyikan
- `separator.tsx` - Garis pemisah horizontal/vertical
- `scroll-area.tsx` - Area dengan custom scrollbar
- `resizable.tsx` - Panel yang bisa di-resize

##### **Navigasi:**
- `tabs.tsx` - Tab navigasi
- `breadcrumb.tsx` - Breadcrumb trail (Home > Dashboard > Users)
- `pagination.tsx` - Pagination untuk tabel/list
- `navigation-menu.tsx` - Dropdown navigation menu
- `menubar.tsx` - Menu bar horizontal

##### **Overlay & Popup:**
- `popover.tsx` - Popup kecil untuk info tambahan
- `tooltip.tsx` - Tooltip on hover
- `hover-card.tsx` - Card yang muncul saat hover
- `context-menu.tsx` - Context menu (klik kanan)
- `dropdown-menu.tsx` - Dropdown menu
- `command.tsx` - Command palette (CMD+K)
- `drawer.tsx` - Mobile drawer (Vaul)

##### **Feedback & Notifikasi:**
- `alert.tsx` - Alert box untuk pesan penting
- `alert-dialog.tsx` - Alert dialog dengan konfirmasi
- `sonner.tsx` - Toast notification (popup notifikasi)
- `spinner.tsx` - Loading spinner
- `progress.tsx` - Progress bar
- `skeleton.tsx` - Skeleton loading placeholder

##### **Data Display:**
- `table.tsx` - Tabel data HTML basic
- `badge.tsx` - Badge/label kecil untuk status
- `avatar.tsx` - Avatar user dengan fallback
- `chart.tsx` - Wrapper untuk recharts
- `carousel.tsx` - Carousel/slider untuk gambar
- `aspect-ratio.tsx` - Maintain aspect ratio untuk media

##### **Utility:**
- `label.tsx` - Label untuk form input
- `kbd.tsx` - Keyboard key display (Ctrl, Cmd)
- `empty.tsx` - Empty state component
- `item.tsx` - List item component
- `field.tsx` - Form field wrapper

#### **data-table/** - Komponen Tabel Advanced

Tabel dengan fitur lengkap menggunakan **TanStack Table**:

- **`data-table.tsx`** - Komponen tabel utama
  - Sorting (klik header untuk sort)
  - Filtering (search & filter)
  - Pagination (halaman next/prev)
  - Column visibility toggle
  - Row selection (checkbox)
  
- **`data-table-column-header.tsx`** - Header kolom yang bisa di-sort
  - Icon arah sort (↑↓)
  - Menu untuk hide column
  
- **`data-table-pagination.tsx`** - Kontrol pagination
  - Page size selector (10, 20, 50, 100)
  - Next/Previous buttons
  - Page info (showing X of Y)
  
- **`data-table-view-options.tsx`** - Toggle visibility kolom
  - Checkbox untuk show/hide kolom
  
- **`draggable-row.tsx`** - Baris yang bisa di-drag & drop
  - Menggunakan @dnd-kit untuk drag & drop
  - Untuk reorder baris tabel
  
- **`drag-column.tsx`** - Kolom dengan handle untuk drag
  
- **`table-utils.ts`** - Helper functions untuk tabel
  - Fuzzy search/filter
  - Custom sorting functions

#### **`simple-icon.tsx`** - Komponen Icon

Component untuk render icon dari **simple-icons** package (brand icons seperti GitHub, Twitter, etc).

---

### **3. src/config/** - Konfigurasi Aplikasi

#### **`app-config.ts`** - Konfigurasi Global

```typescript
export const APP_CONFIG = {
  name: "Studio Admin",           // Nama aplikasi
  version: "2.2.0",               // Versi dari package.json
  copyright: "© 2026, Studio Admin.",
  meta: {
    title: "Studio Admin - Dashboard Template",
    description: "Dashboard template untuk SaaS, admin panel, dll"
  }
}
```

File ini berisi:
- Nama aplikasi
- Versi aplikasi (auto dari package.json)
- Copyright notice
- SEO metadata (title & description untuk Google)

**Cara pakai:**
```typescript
import { APP_CONFIG } from '@/config/app-config'

// Di metadata Next.js
export const metadata = {
  title: APP_CONFIG.meta.title,
  description: APP_CONFIG.meta.description
}
```

---

### **4. src/data/** - Data Mock/Dummy

#### **`users.ts`** - Data Dummy Users

Berisi array data user dummy untuk testing dan development:

```typescript
export const users = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "admin" },
  // ... data lainnya
]
```

**Kegunaan:**
- Testing tabel dan form
- Development tanpa perlu backend
- Nanti bisa diganti dengan fetch dari API/database

---

### **5. src/hooks/** - Custom React Hooks

React Hooks adalah fungsi khusus untuk logic yang dipakai berulang.

#### **`use-mobile.ts`** - Detect Mobile Device

Hook untuk mendeteksi apakah user buka di mobile atau desktop:

```typescript
const isMobile = useMobile() // true jika mobile, false jika desktop
```

**Cara kerja:**
- Menggunakan `window.matchMedia` untuk cek screen width
- Threshold: < 768px = mobile
- Auto update saat window resize

**Contoh penggunaan:**
```typescript
function MyComponent() {
  const isMobile = useMobile()
  
  return (
    <div>
      {isMobile ? <MobileMenu /> : <DesktopMenu />}
    </div>
  )
}
```

#### **`use-data-table-instance.ts`** - Manage Table Instance

Hook untuk manage state TanStack Table:
- Sorting state
- Filtering state  
- Pagination state
- Column visibility

---

### **6. src/lib/** - Utility Functions & Helpers

#### **preferences/** - Sistem Theme & Layout

Sistem lengkap untuk manage preferensi user (tema, warna, layout).

##### **`preferences-config.ts`** - Default Values

```typescript
export const PREFERENCE_DEFAULTS = {
  theme_mode: 'system',           // light | dark | system
  theme_preset: 'default',        // default | tangerine | brutalist | soft-pop
  content_layout: 'wide',         // narrow | wide | full
  navbar_style: 'default',
  sidebar_variant: 'fixed',       // fixed | collapsible
  sidebar_collapsible: 'icon'     // icon | offcanvas | none
}
```

##### **`theme.ts`** - Theme Types & Constants

Type definitions untuk sistem tema:

```typescript
export type ThemeMode = 'light' | 'dark' | 'system'
export type ThemePreset = 'default' | 'tangerine' | 'brutalist' | 'soft-pop'

export const THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'system']
export const THEME_PRESETS: readonly ThemePreset[] = [...]
```

##### **`theme-utils.ts`** - Theme Helper Functions

Fungsi helper untuk operasi tema:
- Get system theme
- Apply theme to DOM
- Validate theme values

##### **`layout.ts`** - Layout Types & Constants

Type definitions untuk layout system:

```typescript
export type ContentLayout = 'narrow' | 'wide' | 'full'
export type NavbarStyle = 'default' | 'floating' | 'sticky'
export type SidebarVariant = 'fixed' | 'collapsible'
```

##### **`layout-utils.ts`** - Layout Helper Functions

Fungsi helper untuk layout operations:
- Apply layout to DOM
- Validate layout values

##### **`preferences-storage.ts`** - Storage Utilities

Fungsi untuk save/load preferences:

```typescript
// Save ke localStorage
savePreferencesToStorage(preferences)

// Load dari localStorage
loadPreferencesFromStorage()

// Save ke cookies (untuk server-side)
savePreferencesToCookie(preferences)

// Load dari cookies
loadPreferencesFromCookie()
```

#### **Storage Utilities:**

##### **`cookie.client.ts`** - Cookie Operations (Client-Side)

Fungsi untuk operasi cookies di browser:

```typescript
// Set cookie
setCookie(name, value, options)

// Get cookie
getCookie(name)

// Delete cookie
deleteCookie(name)
```

##### **`local-storage.client.ts`** - LocalStorage Wrapper

Wrapper untuk localStorage dengan type safety:

```typescript
// Save data
setItem<T>(key: string, value: T)

// Get data
getItem<T>(key: string): T | null

// Remove data
removeItem(key: string)

// Clear all
clear()
```

**Fitur:**
- Type-safe (TypeScript)
- Auto JSON parse/stringify
- Error handling

#### **`utils.ts`** - General Utilities

##### **`cn()` Function**

Fungsi untuk merge Tailwind CSS classes dengan aman:

```typescript
import { cn } from '@/lib/utils'

// Merge classes
cn('bg-red-500', 'text-white', 'hover:bg-red-600')

// Conditional classes
cn('base-class', condition && 'conditional-class')

// Handle conflicts (tailwind-merge)
cn('p-4', 'p-6') // Hasil: 'p-6' (p-4 dihapus)
```

Kombinasi dari `clsx` (conditional classes) + `tailwind-merge` (resolve conflicts).

---

### **7. src/navigation/** - Struktur Menu Navigasi

#### **sidebar/`sidebar-items.ts`** - Konfigurasi Menu Sidebar

File ini berisi konfigurasi lengkap menu sidebar:

```typescript
export interface NavMainItem {
  title: string          // Judul menu
  url: string           // Link URL
  icon?: LucideIcon     // Icon dari lucide-react
  subItems?: NavSubItem[] // Sub-menu
  comingSoon?: boolean  // Badge "Coming Soon"
  newTab?: boolean      // Buka di tab baru
  isNew?: boolean       // Badge "New"
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Dashboards",  // Group label
    items: [
      {
        title: "Default",
        url: "/dashboard",
        icon: LayoutDashboard
      },
      {
        title: "Users",
        url: "/dashboard/users",
        icon: Users,
        subItems: [
          { title: "List", url: "/dashboard/users/list" },
          { title: "Add User", url: "/dashboard/users/add" }
        ]
      }
      // ... menu lainnya
    ]
  },
  {
    id: 2,
    label: "Pages",
    items: [...]
  }
]
```

**Fitur:**
- Grouped menu (dengan label)
- Nested sub-menu (multi-level)
- Icon dari lucide-react
- Badge "New" dan "Coming Soon"
- External links (buka tab baru)

**Cara tambah menu baru:**
```typescript
{
  title: "Products",
  url: "/dashboard/products",
  icon: ShoppingBag,
  subItems: [
    { title: "All Products", url: "/dashboard/products" },
    { title: "Add Product", url: "/dashboard/products/add" }
  ]
}
```

---

### **8. src/scripts/** - Build Scripts & Utilities

#### **`theme-boot.tsx`** - Theme Boot Script

Script yang **jalan sebelum halaman load** untuk apply theme dari cookies/localStorage.

**Masalah yang diselesaikan:**
- **FOUC** (Flash of Unstyled Content) - Halaman kedip saat load
- Tema tidak langsung apply di server-side render

**Cara kerja:**
1. Script diinjek ke `<head>` sebagai inline script
2. Jalan sebelum React hydration
3. Baca preferences dari cookies/localStorage
4. Apply langsung ke `<html>` element (class & data attributes)
5. Tidak ada flicker/kedip

```typescript
// Di layout.tsx
<head>
  <ThemeBootScript />
</head>
```

Script ini set:
- `class="dark"` atau `class="light"`
- `data-theme-preset="tangerine"`
- `data-content-layout="wide"`
- dll

#### **`generate-theme-presets.ts`** - Generate Theme CSS

Script untuk generate file CSS untuk theme presets.

**Cara pakai:**
```bash
npm run generate:presets
```

Script ini:
1. Ambil color values dari config
2. Generate CSS variables untuk setiap preset
3. Save ke `src/styles/presets/*.css`

**Output:**
```css
/* tangerine.css */
[data-theme-preset="tangerine"] {
  --primary: 24 100% 50%;
  --secondary: 40 100% 50%;
  /* ... */
}
```

---

### **9. src/server/** - Server Actions (Backend Logic)

#### **`server-actions.ts`** - Next.js Server Actions

File ini berisi fungsi yang **jalan di server** (bukan di browser).

**Ditandai dengan:**
```typescript
"use server"  // Directive khusus Next.js
```

##### **Functions:**

**1. `getValueFromCookie(key: string)`**
```typescript
// Baca cookie di server-side
const themeMode = await getValueFromCookie('theme-mode')
```

**2. `setValueToCookie(key: string, value: string, options?)`**
```typescript
// Tulis cookie di server-side
await setValueToCookie('theme-mode', 'dark', {
  path: '/',
  maxAge: 60 * 60 * 24 * 7  // 7 hari
})
```

**3. `getPreference<T>(key: string, allowed: T[], fallback: T)`**
```typescript
// Ambil & validasi preference dari cookie
const themeMode = await getPreference(
  'theme-mode',
  ['light', 'dark', 'system'],
  'system'  // fallback jika tidak valid
)
```

**Mengapa perlu Server Actions?**
- Cookies harus dikirim dari server untuk SSR (Server-Side Rendering)
- Preferences perlu di-load sebelum halaman render
- Avoid flicker/kedip saat halaman load

**Cara pakai:**
```typescript
// Di server component
import { getPreference } from '@/server/server-actions'

export default async function DashboardLayout() {
  const themeMode = await getPreference('theme-mode', THEME_MODES, 'system')
  
  return <div className={themeMode}>...</div>
}
```

---

### **10. src/stores/** - State Management (Zustand)

State management adalah cara menyimpan data yang dipakai di **banyak komponen**.

**Mengapa pakai Zustand?**
- Lebih simple dari Redux
- Tidak perlu provider (optional)
- TypeScript support bagus
- Bundle size kecil

#### **preferences/**

##### **`preferences-store.ts`** - Zustand Store

Store utama untuk preferences:

```typescript
export type PreferencesState = {
  // State
  themeMode: ThemeMode
  themePreset: ThemePreset
  contentLayout: ContentLayout
  navbarStyle: NavbarStyle
  sidebarVariant: SidebarVariant
  sidebarCollapsible: SidebarCollapsible
  
  // Actions (functions untuk update state)
  setThemeMode: (mode: ThemeMode) => void
  setThemePreset: (preset: ThemePreset) => void
  setContentLayout: (layout: ContentLayout) => void
  setNavbarStyle: (style: NavbarStyle) => void
  setSidebarVariant: (variant: SidebarVariant) => void
  setSidebarCollapsible: (mode: SidebarCollapsible) => void
  
  // Sync status
  isSynced: boolean
  setIsSynced: (val: boolean) => void
}
```

**Cara kerja:**
```typescript
// Create store dengan initial values
export const createPreferencesStore = (init?: Partial<PreferencesState>) =>
  createStore<PreferencesState>()((set) => ({
    themeMode: init?.themeMode ?? 'system',
    // ... state lainnya
    
    // Action untuk update theme mode
    setThemeMode: (mode) => set({ themeMode: mode }),
    // ... actions lainnya
  }))
```

##### **`preferences-provider.tsx`** - Context Provider

Provider untuk share store ke seluruh aplikasi:

```typescript
export function PreferencesStoreProvider({ 
  children,
  themeMode,
  themePreset,
  // ... props lainnya
}) {
  // Create store instance
  const storeRef = useRef<PreferencesStore>()
  
  if (!storeRef.current) {
    storeRef.current = createPreferencesStore({
      themeMode,
      themePreset,
      // ... initial values dari server
    })
  }
  
  return (
    <PreferencesStoreContext.Provider value={storeRef.current}>
      {children}
    </PreferencesStoreContext.Provider>
  )
}

// Hook untuk pakai store
export const usePreferencesStore = <T,>(
  selector: (state: PreferencesState) => T
): T => {
  const store = useContext(PreferencesStoreContext)
  return useStore(store, selector)
}
```

**Cara pakai di component:**

```typescript
import { usePreferencesStore } from '@/stores/preferences/preferences-provider'

function ThemeToggle() {
  // Subscribe ke themeMode saja (re-render hanya kalau themeMode berubah)
  const themeMode = usePreferencesStore((state) => state.themeMode)
  const setThemeMode = usePreferencesStore((state) => state.setThemeMode)
  
  return (
    <button onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}>
      Toggle Theme: {themeMode}
    </button>
  )
}
```

**Flow lengkap:**
1. Server load preferences dari cookies
2. Pass ke PreferencesStoreProvider sebagai initial values
3. Provider create store dengan values tersebut
4. Component subscribe ke store dengan usePreferencesStore
5. User ubah preferences → call action (setThemeMode, dll)
6. Store update → component re-render
7. Preferences di-sync ke localStorage & cookies

---

### **11. src/styles/presets/** - Theme Preset CSS

Custom theme presets dengan color palette berbeda.

#### **`brutalist.css`** - Neo Brutalism Theme

Tema dengan high contrast, bold colors, strong borders:

```css
[data-theme-preset="brutalist"] {
  --background: 0 0% 100%;
  --foreground: 0 0% 0%;
  --primary: 0 0% 0%;
  --border: 0 0% 0%;
  /* Bold, black borders */
}
```

**Style:** Minimalis, monokrom, tegas

#### **`tangerine.css`** - Tangerine Theme

Tema dengan orange/coral vibes, warm colors:

```css
[data-theme-preset="tangerine"] {
  --primary: 24 100% 50%;    /* Orange */
  --secondary: 40 100% 50%;  /* Amber */
  /* Warm, energetic colors */
}
```

**Style:** Hangat, energik, modern

#### **`soft-pop.css`** - Soft Pop Theme

Tema dengan pastel colors, soft & playful:

```css
[data-theme-preset="soft-pop"] {
  --primary: 280 60% 60%;     /* Purple pastel */
  --secondary: 200 60% 60%;   /* Blue pastel */
  /* Soft, friendly colors */
}
```

**Style:** Lembut, playful, friendly

**Cara apply preset:**
```typescript
// Set di store
setThemePreset('tangerine')

// Atau langsung di HTML
<html data-theme-preset="tangerine">
```

**Cara buat preset baru:**
1. Copy salah satu file preset
2. Rename file (misal: `sunset.css`)
3. Ubah selector: `[data-theme-preset="sunset"]`
4. Adjust color values (HSL format)
5. Import di `globals.css`
6. Tambah ke `THEME_PRESETS` di `theme.ts`

---

### **12. src/types/** - TypeScript Type Definitions

#### **`window.d.ts`** - Window Object Types

Type augmentation untuk objek `window` global:

```typescript
// Contoh: Tambah property custom ke window
declare global {
  interface Window {
    myCustomProperty?: string
    myCustomFunction?: () => void
  }
}
```

**Kegunaan:**
- Tambah custom properties ke `window`
- Type safety untuk global variables
- Integrasi dengan third-party scripts

---

## 🎯 **SISTEM & ALUR KERJA**

### **1. Theme System (Sistem Tema)**

**Fitur:**
- ✅ Multiple theme modes: Light, Dark, System (ikut OS)
- ✅ Multiple color presets: Default, Tangerine, Brutalist, Soft Pop
- ✅ Zero-flicker loading (tidak kedip saat load)
- ✅ Persistent preferences (save ke localStorage & cookies)
- ✅ SSR compatible (server-side rendering)

**Alur Kerja:**

```
1. Server Side (Initial Load)
   ↓
   Load preferences dari cookies → Pass ke layout.tsx
   ↓
2. HTML Render
   ↓
   Theme boot script inject ke <head> → Apply theme sebelum hydration
   ↓
3. Client Side (React Hydration)
   ↓
   PreferencesProvider init dengan server values
   ↓
4. User Interaction
   ↓
   User ubah theme → Update Zustand store
   ↓
5. Persistence
   ↓
   Save ke localStorage (client) & cookies (server)
   ↓
6. Apply Changes
   ↓
   Update <html> attributes → CSS variables berubah → UI update
```

**Components Terlibat:**
- `layout.tsx` - Root layout, load preferences dari server
- `theme-boot.tsx` - Apply theme sebelum hydration
- `preferences-store.ts` - Store state tema
- `preferences-provider.tsx` - Provider untuk share store
- `server-actions.ts` - Save/load cookies di server
- `*.css` preset files - CSS variables untuk setiap preset

---

### **2. Layout System (Sistem Layout)**

**Fitur:**
- ✅ Sidebar variants: Fixed, Collapsible
- ✅ Sidebar collapsible modes: Icon, Offcanvas, None
- ✅ Content layout: Narrow, Wide, Full
- ✅ Navbar styles: Default, Floating, Sticky
- ✅ Responsive (mobile & desktop)

**Alur Kerja:**

```
User change layout settings
   ↓
Update Zustand store (setSidebarVariant, setContentLayout, dll)
   ↓
Store trigger re-render
   ↓
Component baca state baru
   ↓
Apply data-* attributes ke <html>
   ↓
CSS selectors match attributes
   ↓
Layout berubah
```

**CSS Example:**
```css
/* Content width based on layout */
[data-content-layout="narrow"] .main-content {
  max-width: 1280px;
}

[data-content-layout="wide"] .main-content {
  max-width: 1536px;
}

[data-content-layout="full"] .main-content {
  max-width: 100%;
}
```

---

### **3. Navigation System (Sistem Navigasi)**

**Struktur:**
```
Sidebar (Collapsible/Fixed)
  ↓
Navigation Groups (Dashboards, Pages, Components)
  ↓
Main Nav Items (dengan icon)
  ↓
Sub Nav Items (dropdown)
```

**Konfigurasi:**
- File: `sidebar-items.ts`
- Type-safe dengan TypeScript interfaces
- Support nested menus (unlimited levels)
- Badge support (New, Coming Soon)
- External links (open in new tab)

**Render:**
```typescript
// Sidebar component loop groups
{sidebarItems.map((group) => (
  <div key={group.id}>
    {group.label && <h3>{group.label}</h3>}
    
    {/* Loop items */}
    {group.items.map((item) => (
      <NavItem key={item.url} {...item}>
        {/* Sub items jika ada */}
        {item.subItems?.map((subItem) => (
          <NavSubItem key={subItem.url} {...subItem} />
        ))}
      </NavItem>
    ))}
  </div>
))}
```

---

### **4. Data Table System**

**Fitur:**
- ✅ Sorting (ascending/descending)
- ✅ Filtering (search & custom filters)
- ✅ Pagination (configurable page size)
- ✅ Column visibility toggle
- ✅ Row selection (single/multiple)
- ✅ Drag & drop reorder
- ✅ Responsive (mobile view)

**Tech Stack:**
- **TanStack Table v8** - Headless table library
- **@dnd-kit** - Drag & drop functionality
- **Zustand** (optional) - State management untuk complex tables

**Alur Setup:**

```typescript
// 1. Define columns
const columns: ColumnDef<User>[] = [
  {
    id: 'select',
    header: ({ table }) => <Checkbox />,
    cell: ({ row }) => <Checkbox />
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => <div>{row.getValue('name')}</div>
  }
  // ... columns lainnya
]

// 2. Create table instance
const table = useReactTable({
  data: users,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
})

// 3. Render
<DataTable table={table} />
```

---

### **5. Form System**

**Tech Stack:**
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **@hookform/resolvers** - Connect Zod dengan React Hook Form

**Alur:**

```typescript
// 1. Define schema dengan Zod
const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter')
})

type LoginFormValues = z.infer<typeof loginSchema>

// 2. Setup form
const form = useForm<LoginFormValues>({
  resolver: zodResolver(loginSchema),
  defaultValues: {
    email: '',
    password: ''
  }
})

// 3. Submit handler
const onSubmit = async (data: LoginFormValues) => {
  // Data sudah tervalidasi
  await loginUser(data)
}

// 4. Render form
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input {...field} type="email" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit">Login</Button>
  </form>
</Form>
```

**Fitur:**
- ✅ Auto validation (on change, on blur, on submit)
- ✅ Error messages dari Zod schema
- ✅ Type-safe (TypeScript)
- ✅ Dirty/touched state tracking
- ✅ Reset form functionality
- ✅ Nested objects & arrays support

---

## 📦 **TEKNOLOGI & DEPENDENCIES**

### **Core:**
- **Next.js 16** - React framework dengan App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Utility-first CSS

### **UI Components:**
- **shadcn/ui** - Headless UI components
- **Radix UI** - Primitive components (base untuk shadcn)
- **Lucide React** - Icon library
- **Simple Icons** - Brand icons

### **State & Data:**
- **Zustand** - State management
- **TanStack Table** - Table/datagrid
- **TanStack Query** - Data fetching & caching
- **React Hook Form** - Form management
- **Zod** - Schema validation

### **Styling:**
- **Tailwind Merge** - Merge Tailwind classes
- **Class Variance Authority** - Variant system untuk components
- **clsx** - Conditional classes

### **Utilities:**
- **date-fns** - Date manipulation
- **axios** - HTTP client
- **next-themes** - Theme management

### **Drag & Drop:**
- **@dnd-kit** - Drag & drop toolkit
  - `@dnd-kit/core`
  - `@dnd-kit/sortable`
  - `@dnd-kit/utilities`

### **Dev Tools:**
- **Biome** - Linter & formatter (pengganti ESLint + Prettier)
- **Husky** - Git hooks
- **lint-staged** - Run linter on staged files

---

## 🚀 **COMMANDS & SCRIPTS**

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)

# Build
npm run build           # Build untuk production
npm run start           # Start production server

# Code Quality
npm run lint            # Run Biome linter
npm run format          # Format code dengan Biome
npm run check           # Check lint + format
npm run check:fix       # Fix lint + format issues

# Utilities
npm run generate:presets  # Generate theme preset CSS files
```

---

## 📖 **BEST PRACTICES**

### **1. File Organization**
- ✅ Group by feature, bukan by type
- ✅ Co-locate related files
- ✅ Use barrel exports (index.ts) untuk modules

### **2. Component Structure**
```typescript
// ✅ Good
function MyComponent({ prop1, prop2 }: MyComponentProps) {
  // Hooks di atas
  const [state, setState] = useState()
  
  // Handler functions
  const handleClick = () => {}
  
  // Render
  return <div>...</div>
}

// Export props type
export type MyComponentProps = {
  prop1: string
  prop2: number
}
```

### **3. State Management**
- ✅ Use Zustand untuk global state
- ✅ Use React state untuk local component state
- ✅ Use TanStack Query untuk server state

### **4. Styling**
- ✅ Use Tailwind utility classes
- ✅ Create components untuk repeated patterns
- ✅ Use CSS variables untuk theming
- ✅ Use `cn()` untuk merge classes

### **5. TypeScript**
- ✅ Always type props & state
- ✅ Use `type` untuk objects, `interface` untuk extendable contracts
- ✅ Avoid `any`, use `unknown` jika perlu
- ✅ Use const assertions untuk readonly values

---

## 🎨 **CUSTOMIZATION GUIDE**

### **Tambah Theme Preset Baru**

1. **Buat file CSS baru:**
```bash
touch src/styles/presets/my-theme.css
```

2. **Define CSS variables:**
```css
[data-theme-preset="my-theme"] {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 220 90% 56%;
  /* ... variables lainnya */
}
```

3. **Import di globals.css:**
```css
@import './presets/my-theme.css';
```

4. **Tambah ke config:**
```typescript
// src/lib/preferences/theme.ts
export const THEME_PRESETS = [
  'default',
  'tangerine',
  'brutalist',
  'soft-pop',
  'my-theme'  // ← Tambah ini
] as const
```

### **Tambah Menu Sidebar Baru**

Edit `src/navigation/sidebar/sidebar-items.ts`:

```typescript
{
  id: 3,  // ID baru
  label: "My Section",
  items: [
    {
      title: "My Page",
      url: "/dashboard/my-page",
      icon: Star,  // Import dari lucide-react
      subItems: [
        { title: "Subpage 1", url: "/dashboard/my-page/sub1" },
        { title: "Subpage 2", url: "/dashboard/my-page/sub2" }
      ]
    }
  ]
}
```

### **Tambah Komponen UI Baru dari shadcn**

```bash
# Install component
npx shadcn@latest add [component-name]

# Contoh:
npx shadcn@latest add date-picker
```

Component akan otomatis ditambah ke `src/components/ui/`.

---

## 🐛 **TROUBLESHOOTING**

### **Theme tidak apply / kedip saat load**
- ✅ Pastikan `ThemeBootScript` ada di `<head>`
- ✅ Check cookies di browser (DevTools > Application > Cookies)
- ✅ Clear cache & reload

### **Sidebar tidak collapsible**
- ✅ Check `sidebarCollapsible` value di store
- ✅ Pastikan layout component import dengan benar
- ✅ Check CSS untuk `[data-sidebar-collapsible]` selectors

### **Table sorting tidak jalan**
- ✅ Pastikan `getSortedRowModel()` sudah dipakai
- ✅ Check column definition ada `enableSorting: true`
- ✅ Verify data type (string vs number sorting berbeda)

### **Form validation tidak jalan**
- ✅ Pastikan Zod schema benar
- ✅ Check `zodResolver` sudah di-pass ke `useForm`
- ✅ Verify field names match dengan schema keys

---

## 📚 **RESOURCES**

### **Official Docs:**
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TanStack Table](https://tanstack.com/table)
- [Zustand Docs](https://zustand-demo.pmnd.rs)

### **Related Projects:**
- [Radix UI](https://www.radix-ui.com) - Primitives untuk shadcn/ui
- [Lucide Icons](https://lucide.dev) - Icon library
- [React Hook Form](https://react-hook-form.com)
- [Zod](https://zod.dev) - Schema validation

---

## 📝 **NOTES**

- Proyek ini menggunakan **App Router** (bukan Pages Router)
- Tailwind CSS v4 masih beta, some features might change
- React 19 sudah stable, production-ready
- Biome menggantikan ESLint + Prettier untuk performance
- Theme system fully SSR compatible, no client-only rendering

---

## 🤝 **CONTRIBUTING**

Untuk berkontribusi ke proyek ini:

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

**Code Style:**
- Follow existing patterns
- Run `npm run check:fix` sebelum commit
- Add proper TypeScript types
- Write meaningful commit messages

---

## 📄 **LICENSE**

Lihat file `LICENSE` untuk detail lisensi proyek.

---

**Last Updated:** January 2, 2026  
**Version:** 2.2.0  
**Author:** Studio Admin Team

---

💡 **Tips:** Bookmark file ini untuk referensi cepat saat development!
