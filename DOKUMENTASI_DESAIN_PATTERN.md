# 🎯 Dokumentasi Desain Pattern - Studio Admin Dashboard

> Dokumentasi lengkap tentang desain pattern dan arsitektur yang digunakan dalam proyek Next.js Admin Dashboard Template

**Tanggal Dokumentasi**: 2 Januari 2026  
**Versi Proyek**: 2.2.0  
**Tech Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS v4, Shadcn UI

---

## 📑 **DAFTAR ISI**

1. [Arsitektur Proyek](#1-arsitektur-proyek)
2. [State Management Patterns](#2-state-management-patterns)
3. [Server-Client Separation](#3-server-client-separation)
4. [Theming & Preferences System](#4-theming--preferences-system)
5. [Component Design Patterns](#5-component-design-patterns)
6. [Routing & Layout Patterns](#6-routing--layout-patterns)
7. [Configuration Patterns](#7-configuration-patterns)
8. [Utility & Helper Patterns](#8-utility--helper-patterns)
9. [Data Management Patterns](#9-data-management-patterns)
10. [Design Principles](#10-design-principles)
11. [Performance Patterns](#11-performance-patterns)
12. [Ringkasan Pattern](#12-ringkasan-pattern)

---

## 1. 🏛️ **ARSITEKTUR PROYEK**

### **A. Feature-Based Architecture**

**Konsep**: Organisasi kode berdasarkan fitur, bukan berdasarkan technical layer.

**Struktur**:
```
app/
├── (external)/          # Fitur: Halaman publik
│   └── page.tsx
├── (main)/             # Fitur: Halaman aplikasi utama
│   ├── auth/           # Fitur: Autentikasi
│   ├── dashboard/      # Fitur: Dashboard
│   └── unauthorized/   # Fitur: Error unauthorized
```

**Keuntungan**:
- ✅ Code lebih modular dan mudah dipahami
- ✅ Setiap fitur bisa dikembangkan secara independen
- ✅ Mudah untuk scaling dan maintenance
- ✅ Tim bisa bekerja parallel tanpa konflik

**Pattern yang digunakan**: **Modular Monolith Pattern**

---

### **B. Layered Architecture**

**Konsep**: Pemisahan tanggung jawab berdasarkan layer.

**Layer Structure**:
```
┌─────────────────────────────────────┐
│   Presentation Layer                │
│   (app/, components/)               │
│   - UI Components                   │
│   - Pages & Layouts                 │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│   Business Logic Layer              │
│   (hooks/, lib/)                    │
│   - Custom Hooks                    │
│   - Utility Functions               │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│   Data Access Layer                 │
│   (server/, stores/)                │
│   - Server Actions                  │
│   - State Management                │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│   Configuration Layer               │
│   (config/)                         │
│   - App Configuration               │
└─────────────────────────────────────┘
```

**Aturan**:
- Setiap layer hanya boleh berkomunikasi dengan layer di bawahnya
- Tidak ada circular dependency antar layer
- Data flow selalu one-way (top to bottom)

**Pattern yang digunakan**: **Clean Architecture Principles**

---

## 2. 🔄 **STATE MANAGEMENT PATTERNS**

### **A. Zustand + Vanilla Store Pattern**

**File**: `src/stores/preferences/preferences-store.ts`

**Pattern**: **Factory Pattern + Singleton Pattern**

```typescript
// Factory Pattern untuk create store instance
export const createPreferencesStore = (init?: Partial<PreferencesState>) =>
  createStore<PreferencesState>()((set) => ({
    // State initialization dengan default values
    themeMode: init?.themeMode ?? PREFERENCE_DEFAULTS.theme_mode,
    themePreset: init?.themePreset ?? PREFERENCE_DEFAULTS.theme_preset,
    
    // Actions untuk update state
    setThemeMode: (mode) => set({ themeMode: mode }),
    setThemePreset: (preset) => set({ themePreset: preset }),
  }));
```

**Penjelasan**:
1. **Factory Pattern**: `createPreferencesStore()` adalah factory function yang membuat store instance
2. **Singleton Pattern**: Store instance hanya dibuat sekali di Provider
3. **Immutable State**: State update menggunakan `set()` yang menghasilkan state baru

**Keuntungan**:
- ✅ Lightweight (lebih kecil dari Redux)
- ✅ No boilerplate code
- ✅ TypeScript-first dengan full type safety
- ✅ Vanilla store bisa digunakan di luar React

---

### **B. Provider Pattern**

**File**: `src/stores/preferences/preferences-provider.tsx`

**Pattern**: **Context Provider Pattern + Dependency Injection**

```typescript
const PreferencesStoreContext = createContext<StoreApi<PreferencesState> | null>(null);

export const PreferencesStoreProvider = ({ children, ...initialProps }) => {
  // Lazy initialization dengan useState
  const [store] = useState<StoreApi<PreferencesState>>(() =>
    createPreferencesStore({ ...initialProps })
  );

  // Sync dengan DOM state saat hydration
  useEffect(() => {
    const domState = readDomState();
    store.setState((prev) => ({ ...prev, ...domState, isSynced: true }));
  }, [store]);

  return (
    <PreferencesStoreContext.Provider value={store}>
      {children}
    </PreferencesStoreContext.Provider>
  );
};

// Custom hook untuk akses store
export const usePreferencesStore = <T,>(selector: (state: PreferencesState) => T): T => {
  const store = useContext(PreferencesStoreContext);
  if (!store) throw new Error("Missing PreferencesStoreProvider");
  return useStore(store, selector);
};
```

**Penjelasan**:
1. **Provider Pattern**: Menyediakan store ke seluruh component tree
2. **Lazy Initialization**: Store dibuat hanya sekali dengan `useState(() => ...)`
3. **Hydration Sync**: Sync state dengan DOM untuk menghindari hydration mismatch
4. **Type-Safe Selector**: Generic type `<T>` untuk selector pattern

**Keuntungan**:
- ✅ Dependency injection tanpa prop drilling
- ✅ SSR-safe dengan hydration sync
- ✅ Selector pattern untuk optimized re-renders
- ✅ Error handling dengan clear error message

---

### **C. Observer Pattern**

**Konsep**: Zustand menggunakan Observer pattern untuk reactive state updates.

```typescript
// Component subscribe ke specific state slice
const themeMode = usePreferencesStore((state) => state.themeMode);

// Component hanya re-render saat themeMode berubah
// State lain yang berubah tidak trigger re-render
```

**Pattern yang digunakan**: **Observer Pattern + Selector Pattern**

---

## 3. 🖥️ **SERVER-CLIENT SEPARATION**

### **A. Server Actions Pattern**

**File**: `src/server/server-actions.ts`

**Pattern**: **Backend For Frontend (BFF) + Command Pattern**

```typescript
"use server"; // Directive untuk server-only code

// Command: Get value from cookie
export async function getValueFromCookie(key: string): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(key)?.value;
}

// Command: Set value to cookie
export async function setValueToCookie(
  key: string,
  value: string,
  options: { path?: string; maxAge?: number } = {},
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(key, value, {
    path: options.path ?? "/",
    maxAge: options.maxAge ?? 60 * 60 * 24 * 7,
  });
}

// Command: Get preference with validation
export async function getPreference<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T
): Promise<T> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(key);
  const value = cookie ? cookie.value.trim() : undefined;
  return allowed.includes(value as T) ? (value as T) : fallback;
}
```

**Penjelasan**:
1. **Server Actions**: Function yang berjalan di server, bisa dipanggil dari client
2. **Command Pattern**: Setiap function adalah command yang melakukan satu tugas spesifik
3. **Type-Safe Validation**: Generic type `<T>` dengan runtime validation
4. **Default Options**: Options parameter dengan default values

**Keuntungan**:
- ✅ No API routes needed
- ✅ Type-safe dari client ke server
- ✅ Automatic error handling
- ✅ Optimized bundle size (server code tidak di-bundle ke client)

---

### **B. Separation of Concerns**

**Konsep**: Pemisahan jelas antara client-side dan server-side logic.

```
Client-Side (src/lib/):
├── cookie.client.ts        # Client cookie operations
├── local-storage.client.ts # Client localStorage operations
└── preferences-storage.ts  # Bridge antara client & server

Server-Side (src/server/):
└── server-actions.ts       # Server-only operations
```

**Pattern yang digunakan**: **Bridge Pattern + Facade Pattern**

---

## 4. 🎨 **THEMING & PREFERENCES SYSTEM**

### **A. Strategy Pattern untuk Persistence**

**File**: `src/lib/preferences/preferences-storage.ts`

**Pattern**: **Strategy Pattern + Adapter Pattern**

```typescript
// Strategy configuration
const PREFERENCE_PERSISTENCE = {
  theme_mode: "client-cookie",
  theme_preset: "server-cookie",
  content_layout: "localStorage",
  sidebar_state: "none",
} as const;

// Strategy selector
export async function persistPreference(key: PreferenceKey, value: string) {
  const mode = PREFERENCE_PERSISTENCE[key];
  
  // Strategy selection
  switch (mode) {
    case "none":
      return; // No persistence
      
    case "client-cookie":
      setClientCookie(key, value);
      return;
      
    case "server-cookie":
      await setValueToCookie(key, value);
      return;
      
    case "localStorage":
      setLocalStorageValue(key, value);
      return;
  }
}
```

**Penjelasan**:
1. **Strategy Pattern**: Different persistence strategy untuk different preferences
2. **Configuration-driven**: Strategy ditentukan oleh config object
3. **Extensible**: Mudah menambah strategy baru
4. **Type-safe**: Using TypeScript const assertions

**Keuntungan**:
- ✅ Flexible persistence strategy
- ✅ Easy to test (mock strategies)
- ✅ SSR-compatible
- ✅ Performance optimized (client vs server trade-offs)

---

### **B. SSR-Safe Hydration Pattern**

**Konsep**: Menghindari hydration mismatch antara server dan client.

```typescript
function readDomState(): Partial<PreferencesState> {
  const root = document.documentElement;
  
  // Read dari actual DOM state
  const mode = root.classList.contains("dark") ? "dark" : "light";
  
  return {
    themeMode: mode,
    themePreset: getSafeValue(root.getAttribute("data-theme-preset"), THEME_PRESET_VALUES),
    contentLayout: getSafeValue(root.getAttribute("data-content-layout"), CONTENT_LAYOUT_VALUES),
    // ... other preferences
  };
}

useEffect(() => {
  // Sync store dengan DOM state setelah hydration
  const domState = readDomState();
  store.setState((prev) => ({ ...prev, ...domState, isSynced: true }));
}, [store]);
```

**Flow**:
1. Server render HTML dengan default preferences
2. Client hydrate React app
3. Read actual DOM state (bisa berbeda dari server)
4. Sync Zustand store dengan DOM state
5. Set `isSynced: true` flag

**Pattern yang digunakan**: **Hydration Reconciliation Pattern**

---

### **C. Theme Boot Script**

**File**: `src/scripts/theme-boot.tsx`

**Pattern**: **Inline Script Pattern untuk Flash Prevention**

**Konsep**: Execute JavaScript sebelum React hydration untuk menghindari flash of unstyled content.

```typescript
<head>
  <ThemeBootScript />
</head>
```

**Cara kerja**:
1. Inline `<script>` di HTML `<head>`
2. Execute sebelum body render
3. Read preferences dari cookie/localStorage
4. Apply ke DOM (`<html>` attributes)
5. No flash karena CSS sudah applied sebelum paint

**Pattern yang digunakan**: **Progressive Enhancement + Critical CSS Pattern**

---

## 5. 🧩 **COMPONENT DESIGN PATTERNS**

### **A. Composition Pattern**

**Konsep**: Build complex UI dari small, reusable components.

**Contoh - Dialog Component**:
```typescript
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button>Submit</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Pattern yang digunakan**: **Compound Component Pattern**

**Keuntungan**:
- ✅ Flexible composition
- ✅ Semantic HTML structure
- ✅ Easy to customize
- ✅ Accessible by default (Radix UI)

---

### **B. Render Props Pattern**

**Contoh - Data Table**:
```typescript
<DataTable
  columns={columns}
  data={data}
  renderCustomCell={(cell) => {
    // Custom rendering logic
    return <CustomCell value={cell.getValue()} />;
  }}
/>
```

**Pattern yang digunakan**: **Render Props + Slot Pattern**

---

### **C. Custom Hooks Pattern**

**File**: `src/hooks/use-data-table-instance.ts`

**Pattern**: **Custom Hook + Encapsulation Pattern**

```typescript
export function useDataTableInstance<TData, TValue>(options: Options) {
  // Encapsulate complex table logic
  const table = useReactTable({
    data: options.data,
    columns: options.columns,
    // ... table configuration
  });
  
  return table;
}
```

**Keuntungan**:
- ✅ Reusable logic
- ✅ Clean component code
- ✅ Easy to test
- ✅ Composable hooks

---

### **D. Controlled Component Pattern**

**Konsep**: Form inputs dikontrol oleh React state.

```typescript
const [value, setValue] = useState("");

<Input
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

**Pattern yang digunakan**: **Controlled Component + Unidirectional Data Flow**

---

## 6. 🗺️ **ROUTING & LAYOUT PATTERNS**

### **A. Route Groups Pattern**

**Konsep**: Logical grouping tanpa mempengaruhi URL structure.

```
app/
├── (external)/           # Group: Public routes
│   └── page.tsx         # URL: /
│
├── (main)/              # Group: App routes
│   ├── layout.tsx       # Shared layout for all (main) routes
│   ├── auth/
│   │   └── page.tsx     # URL: /auth
│   └── dashboard/
│       └── page.tsx     # URL: /dashboard
```

**Keuntungan**:
- ✅ Logical organization
- ✅ Shared layouts
- ✅ Clean URL structure
- ✅ No route prefix needed

**Pattern yang digunakan**: **Route Group Pattern (Next.js App Router)**

---

### **B. Layout Nesting Pattern**

**Konsep**: Nested layouts untuk shared UI components.

```typescript
// Root Layout (src/app/layout.tsx)
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PreferencesStoreProvider>
          {children} {/* Main layout will be rendered here */}
        </PreferencesStoreProvider>
      </body>
    </html>
  );
}

// Main Layout (src/app/(main)/layout.tsx)
export default function MainLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <main>{children}</main> {/* Page content here */}
    </div>
  );
}
```

**Flow**:
```
RootLayout
  └── PreferencesStoreProvider
      └── MainLayout
          └── Sidebar + Content Area
              └── Page
```

**Pattern yang digunakan**: **Nested Layout Pattern + Template Method Pattern**

---

### **C. Parallel Routes Pattern**

**Konsep**: Render multiple pages dalam satu route.

```
app/
└── (main)/
    └── dashboard/
        ├── @header/
        ├── @sidebar/
        └── page.tsx
```

**Pattern yang digunakan**: **Parallel Routes + Slot Pattern**

---

## 7. ⚙️ **CONFIGURATION PATTERNS**

### **A. Centralized Configuration Pattern**

**File**: `src/config/app-config.ts`

**Pattern**: **Configuration Object Pattern + Single Source of Truth**

```typescript
import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

// Centralized app configuration
export const APP_CONFIG = {
  name: "Studio Admin",
  version: packageJson.version,
  copyright: `© ${currentYear}, Studio Admin.`,
  meta: {
    title: "Studio Admin - Modern Next.js Dashboard Starter Template",
    description: "...",
  },
} as const; // Immutable with const assertion
```

**Keuntungan**:
- ✅ Single source of truth
- ✅ Easy to maintain
- ✅ Type-safe access
- ✅ Immutable configuration

---

### **B. Type-Safe Configuration Pattern**

**File**: `src/lib/preferences/preferences-config.ts`

**Pattern**: **Type-Driven Configuration + Const Assertion**

```typescript
// Define allowed values
export const THEME_MODE_VALUES = ["light", "dark", "system"] as const;
export const THEME_PRESET_VALUES = ["default", "tangerine", "brutalist", "soft-pop"] as const;

// Extract type from values
export type ThemeMode = typeof THEME_MODE_VALUES[number];
export type ThemePreset = typeof THEME_PRESET_VALUES[number];

// Configuration with persistence strategy
export const PREFERENCE_PERSISTENCE = {
  theme_mode: "client-cookie",
  theme_preset: "server-cookie",
  content_layout: "localStorage",
  navbar_style: "none",
} as const;

// Default preferences
export const PREFERENCE_DEFAULTS: PreferenceDefaults = {
  theme_mode: "system",
  theme_preset: "default",
  content_layout: "default",
  navbar_style: "default",
};
```

**Keuntungan**:
- ✅ Runtime validation
- ✅ TypeScript autocompletion
- ✅ Type-safe access
- ✅ No magic strings

---

## 8. 🛠️ **UTILITY & HELPER PATTERNS**

### **A. Pure Function Pattern**

**Konsep**: Functions tanpa side effects.

```typescript
// Pure function - same input always produces same output
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Pure function - no mutation
export function getSafeValue<T extends string>(
  raw: string | null,
  allowed: readonly T[]
): T | undefined {
  if (!raw) return undefined;
  return allowed.includes(raw as T) ? (raw as T) : undefined;
}
```

**Keuntungan**:
- ✅ Predictable behavior
- ✅ Easy to test
- ✅ No side effects
- ✅ Composable

**Pattern yang digunakan**: **Pure Function + Functional Programming**

---

### **B. Type Guard Pattern**

**Konsep**: Runtime type checking dengan TypeScript.

```typescript
function isValidThemeMode(value: unknown): value is ThemeMode {
  return typeof value === "string" && 
         THEME_MODE_VALUES.includes(value as ThemeMode);
}

// Usage
if (isValidThemeMode(userInput)) {
  // TypeScript knows userInput is ThemeMode here
  setThemeMode(userInput);
}
```

**Pattern yang digunakan**: **Type Guard Pattern + Type Narrowing**

---

### **C. Utility Class Pattern**

**Konsep**: Static utility functions.

```typescript
// src/lib/utils.ts
export class Utils {
  static cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
  }
  
  static formatDate(date: Date) {
    return format(date, "PPP");
  }
}
```

**Pattern yang digunakan**: **Utility Class Pattern (optional, project ini prefer named exports)**

---

## 9. 📊 **DATA MANAGEMENT PATTERNS**

### **A. Mock Repository Pattern**

**File**: `src/data/users.ts`

**Pattern**: **Repository Pattern (Mock Implementation)**

```typescript
export const users: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "admin",
  },
  // ... more mock data
];

// Easy to replace dengan real API later
export async function getUsers(): Promise<User[]> {
  // Mock: return static data
  return users;
  
  // Real: fetch from API
  // return fetch('/api/users').then(r => r.json());
}
```

**Keuntungan**:
- ✅ Data isolation
- ✅ Easy to replace
- ✅ Type-safe mock data
- ✅ No backend needed for development

---

### **B. Data Table Pattern**

**File**: `src/components/data-table/data-table.tsx`

**Pattern**: **Table Abstraction Pattern + Headless UI**

```typescript
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  // ... other props
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    // ... table configuration
  });
  
  return (
    <Table>
      {/* Render table */}
    </Table>
  );
}
```

**Pattern yang digunakan**: **Generic Component + Headless UI Pattern (TanStack Table)**

---

## 10. 🎯 **DESIGN PRINCIPLES**

### **A. SOLID Principles**

#### **1. Single Responsibility Principle (SRP)**
```typescript
// ✅ Good: Each file has one responsibility
// src/server/server-actions.ts - Server actions only
// src/stores/preferences/preferences-store.ts - State management only
// src/lib/preferences/preferences-storage.ts - Persistence logic only
```

#### **2. Open/Closed Principle (OCP)**
```typescript
// ✅ Good: Open for extension, closed for modification
// Adding new theme preset:
// 1. Add CSS file in src/styles/presets/
// 2. Add preset name to THEME_PRESET_VALUES
// No need to modify existing code
```

#### **3. Liskov Substitution Principle (LSP)**
```typescript
// ✅ Good: Subclass dapat menggantikan parent class
interface PersistenceStrategy {
  save(key: string, value: string): void;
}

class CookieStrategy implements PersistenceStrategy {
  save(key: string, value: string) { /* ... */ }
}

class LocalStorageStrategy implements PersistenceStrategy {
  save(key: string, value: string) { /* ... */ }
}
```

#### **4. Interface Segregation Principle (ISP)**
```typescript
// ✅ Good: Small, specific interfaces
interface ThemePreference {
  themeMode: ThemeMode;
  themePreset: ThemePreset;
}

interface LayoutPreference {
  contentLayout: ContentLayout;
  navbarStyle: NavbarStyle;
}
```

#### **5. Dependency Inversion Principle (DIP)**
```typescript
// ✅ Good: Depend on abstractions, not concretions
// Components depend on PreferencesStore interface, not implementation
const themeMode = usePreferencesStore((state) => state.themeMode);
```

---

### **B. React Best Practices**

#### **1. Composition Over Inheritance**
```typescript
// ✅ Good: Composition
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// ❌ Bad: Inheritance (avoid extending components)
class MyCard extends Card { /* ... */ }
```

#### **2. Unidirectional Data Flow**
```typescript
// ✅ Good: Props down, events up
<Child 
  value={parentState}           // Data flows down
  onChange={handleChange}       // Events flow up
/>
```

#### **3. Lift State Up**
```typescript
// ✅ Good: Shared state in common ancestor
function Parent() {
  const [state, setState] = useState();
  return (
    <>
      <ChildA value={state} onChange={setState} />
      <ChildB value={state} />
    </>
  );
}
```

---

### **C. Next.js Best Practices**

#### **1. React Server Components (RSC)**
```typescript
// ✅ Server Component (default)
export default async function Page() {
  const data = await fetchData(); // Runs on server
  return <div>{data}</div>;
}

// ✅ Client Component (when needed)
"use client";
export default function InteractiveComponent() {
  const [state, setState] = useState();
  return <button onClick={() => setState(x => x + 1)}>{state}</button>;
}
```

#### **2. Server Actions**
```typescript
// ✅ Good: Use Server Actions for mutations
"use server";
export async function updateUser(data: FormData) {
  // Server-side logic
}

// In component:
<form action={updateUser}>
  <input name="username" />
  <button type="submit">Update</button>
</form>
```

#### **3. Dynamic Imports**
```typescript
// ✅ Good: Lazy load heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
  ssr: false,
});
```

---

## 11. 🚀 **PERFORMANCE PATTERNS**

### **A. Code Splitting**

```typescript
// ✅ Route-based code splitting (automatic)
// Each route in app/ is automatically code split

// ✅ Component-based code splitting (manual)
const DynamicComponent = dynamic(() => import('./Component'));
```

---

### **B. Memoization Pattern**

```typescript
// ✅ useMemo untuk expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

// ✅ useCallback untuk stable function references
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);

// ✅ React.memo untuk prevent unnecessary re-renders
export const MemoizedComponent = React.memo(Component);
```

---

### **C. Selector Pattern untuk Optimized Re-renders**

```typescript
// ✅ Good: Only re-render when themeMode changes
const themeMode = usePreferencesStore((state) => state.themeMode);

// ❌ Bad: Re-render on any state change
const store = usePreferencesStore((state) => state);
const themeMode = store.themeMode;
```

---

### **D. Font Optimization**

```typescript
// ✅ Next.js font optimization
import { Inter } from "next/font/google";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap", // FOUT instead of FOIT
});

export default function RootLayout({ children }) {
  return <body className={inter.className}>{children}</body>;
}
```

---

### **E. Image Optimization**

```typescript
// ✅ Next.js Image component
import Image from "next/image";

<Image
  src="/image.jpg"
  alt="Description"
  width={500}
  height={300}
  priority // LCP image
  placeholder="blur"
/>
```

---

## 12. 📊 **RINGKASAN PATTERN**

### **Pattern yang Digunakan dalam Project**

| Kategori | Pattern | File/Lokasi | Kegunaan |
|----------|---------|-------------|----------|
| **Architectural** | Feature-Based Architecture | `app/` struktur | Organisasi kode per fitur |
| | Layered Architecture | Seluruh `src/` | Separation of concerns |
| | BFF (Backend For Frontend) | `server/` | Server-side logic |
| **Creational** | Factory Pattern | `createPreferencesStore()` | Create store instance |
| | Singleton Pattern | Store di Provider | Single store instance |
| | Lazy Initialization | `useState(() => ...)` | Optimize initialization |
| **Structural** | Bridge Pattern | `preferences-storage.ts` | Abstract persistence |
| | Adapter Pattern | Strategy implementations | Adapt different storages |
| | Composite Pattern | Component composition | Build complex UI |
| | Facade Pattern | `persistPreference()` | Simplified interface |
| **Behavioral** | Strategy Pattern | Persistence strategies | Runtime strategy selection |
| | Observer Pattern | Zustand subscriptions | Reactive state updates |
| | Command Pattern | Server Actions | Encapsulate requests |
| | Template Method Pattern | Layout nesting | Define skeleton |
| **React-Specific** | Hooks Pattern | `use-*.ts` files | Reusable logic |
| | Context Pattern | Providers | Global state |
| | Compound Component | Shadcn components | Flexible composition |
| | Render Props | Table cells | Custom rendering |
| | Controlled Component | Form inputs | Form state management |
| **Next.js-Specific** | RSC (React Server Components) | Default components | Server rendering |
| | Server Actions | `"use server"` | Server mutations |
| | Route Groups | `(external)`, `(main)` | Logical grouping |
| | Parallel Routes | `@slot` notation | Multiple views |
| **State Management** | Provider Pattern | Context + Store | State distribution |
| | Selector Pattern | `useStore(selector)` | Optimized subscriptions |
| | Immutable State | Zustand `set()` | Predictable updates |
| **Performance** | Code Splitting | Dynamic imports | Smaller bundles |
| | Memoization | useMemo, useCallback | Prevent recalculation |
| | Lazy Loading | `dynamic()` | Load on demand |
| **Data** | Repository Pattern | `data/users.ts` | Data abstraction |
| | Mock Pattern | Static data arrays | Development data |

---

### **Filosofi Design Project**

#### **1. Clean Code**
- Kode mudah dibaca dan dipahami
- Naming yang jelas dan konsisten
- Function kecil dengan single responsibility
- No magic numbers/strings

#### **2. Modular**
- Setiap module independent
- Loose coupling
- High cohesion
- Easy to test

#### **3. Type-Safe**
- Full TypeScript coverage
- No `any` types
- Runtime validation dengan Zod
- Type inference maksimal

#### **4. Performance-Oriented**
- Code splitting optimal
- Lazy loading heavy components
- Memoization untuk expensive operations
- SSR untuk fast initial load

#### **5. Developer Experience**
- Auto-completion dengan TypeScript
- Clear error messages
- Hot reload dengan Fast Refresh
- Comprehensive documentation

#### **6. Maintainable**
- Consistent code style (Biome)
- Clear folder structure
- Separation of concerns
- Documented patterns

#### **7. Scalable**
- Feature-based architecture
- Easy to add new features
- Configuration-driven
- Extensible systems

---

## 🎓 **KESIMPULAN**

Project **Studio Admin Dashboard** mengimplementasikan **modern web development best practices** dengan kombinasi pattern yang solid:

### **Kekuatan Utama**:
1. ✅ **Architecture**: Clean, layered, feature-based
2. ✅ **State Management**: Lightweight, type-safe, reactive
3. ✅ **Performance**: Optimized bundle, fast loading, efficient rendering
4. ✅ **DX**: Great developer experience dengan TypeScript + tooling
5. ✅ **Maintainability**: Clear structure, documented, testable
6. ✅ **Scalability**: Easy to extend, add features, grow team

### **Pattern Philosophy**:
- **Simple over complex**: Prefer simple solutions
- **Explicit over implicit**: Clear intentions
- **Type-safe over runtime checks**: Catch errors early
- **Composition over inheritance**: Flexible components
- **Configuration over code**: Data-driven systems

---

## 📚 **REFERENSI PATTERN**

### **Architectural Patterns**:
- Clean Architecture (Robert C. Martin)
- Layered Architecture
- Feature-Sliced Design
- Backend For Frontend (BFF)

### **Design Patterns (Gang of Four)**:
- Factory Pattern
- Singleton Pattern
- Strategy Pattern
- Observer Pattern
- Command Pattern
- Bridge Pattern
- Adapter Pattern
- Facade Pattern
- Composite Pattern
- Template Method Pattern

### **React Patterns**:
- Compound Component Pattern
- Render Props Pattern
- Higher-Order Component (HOC)
- Custom Hooks Pattern
- Provider Pattern
- Controlled Component Pattern

### **Next.js Patterns**:
- React Server Components (RSC)
- Server Actions
- Route Groups
- Parallel Routes
- Streaming SSR

### **State Management Patterns**:
- Flux Architecture
- Unidirectional Data Flow
- Selector Pattern
- Immutable State Pattern

---

## 📝 **CATATAN TAMBAHAN**

### **Kapan Menggunakan Pattern Tertentu**:

#### **Factory Pattern**:
- ✅ Saat perlu create multiple instances dengan config berbeda
- ✅ Saat initialization logic complex
- ❌ Untuk simple object creation

#### **Singleton Pattern**:
- ✅ Untuk global state (store)
- ✅ Untuk shared resources
- ❌ Untuk stateless utilities

#### **Strategy Pattern**:
- ✅ Saat ada multiple algorithms/approaches
- ✅ Saat strategy bisa berubah runtime
- ❌ Untuk simple conditional logic

#### **Observer Pattern**:
- ✅ Untuk reactive state updates
- ✅ Saat multiple components depend on same state
- ❌ Untuk one-time events

### **Anti-Patterns yang Dihindari**:

#### **❌ Prop Drilling**:
```typescript
// Bad: Pass props through many levels
<A><B><C><D value={value} /></D></C></B></A>

// Good: Use Context or store
const value = usePreferencesStore(s => s.value);
```

#### **❌ Large Components**:
```typescript
// Bad: Component dengan 500+ lines
function LargeComponent() { /* ... */ }

// Good: Break into smaller components
function Parent() {
  return (
    <>
      <Header />
      <Content />
      <Footer />
    </>
  );
}
```

#### **❌ Direct State Mutation**:
```typescript
// Bad: Mutate state directly
state.value = newValue;

// Good: Immutable update
setState({ ...state, value: newValue });
```

#### **❌ Missing Error Handling**:
```typescript
// Bad: No error handling
const data = await fetch('/api').then(r => r.json());

// Good: Proper error handling
try {
  const data = await fetch('/api').then(r => r.json());
} catch (error) {
  handleError(error);
}
```

---

## 🔄 **UPDATE LOG**

- **2 Januari 2026**: Initial documentation - Comprehensive design pattern documentation

---

## 👨‍💻 **KONTRIBUTOR**

Dokumentasi ini dibuat untuk membantu developer memahami design patterns yang digunakan dalam project Studio Admin Dashboard.

---

**Happy Coding! 🚀**
