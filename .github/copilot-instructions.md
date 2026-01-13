# GitHub Copilot Instructions - Studio Admin Dashboard

## Project Overview

This is **Studio Admin**, a Next.js 16 admin dashboard template with TypeScript, Tailwind CSS v4, and Shadcn UI. It's designed for production tracking (TV/Film), featuring Role-Based Access Control (RBAC), multi-dashboard layouts, and theming capabilities.

**Core Tech**: Next.js 16 (App Router), TypeScript, Tailwind v4, Shadcn UI, Supabase (auth + database), Zustand (state), TanStack Table, React Hook Form + Zod, Biome (lint/format)

## Architecture: Colocation-First

**Critical**: Use **colocation-based architecture** - each feature owns its pages, components, and logic inside its route folder.

```
src/app/(main)/dashboard/finance/
├── page.tsx                    # Route page
├── layout.tsx                  # Feature-specific layout
└── _components/                # Feature-scoped components (underscore prefix)
    ├── card-overview.tsx
    └── kpis/
        └── net-worth.tsx
```

**Rules**:
- Components used by ONE feature → `_components/` in that route (e.g., `src/app/(main)/dashboard/crm/_components/`)
- Components used by MULTIPLE features → `src/components/` (e.g., `src/components/projects/create-project-dialog.tsx`)
- Route groups `()` don't affect URLs: `(main)` = protected routes, `(auth)` = login/register, `(external)` = public pages

## Authentication & Authorization

### Supabase Integration

**Server-side** (Server Components, Server Actions):
```typescript
import { createSupabaseServerClient } from '@/lib/supabase/server';

const supabase = await createSupabaseServerClient();
const { data: { user } } = await supabase.auth.getUser();
```

**Admin operations** (bypass RLS):
```typescript
import { createSupabaseAdmin } from '@/lib/supabase/admin';

const supabaseAdmin = createSupabaseAdmin();
// Use for operations requiring service role (e.g., project creation)
```

### Role System

Three roles: `production` (Tim Produksi - full access), `broadcaster` (Client - read-only), `investor` (Stakeholder - summary only)

**Role check pattern** (see [src/server/project-actions.ts](src/server/project-actions.ts:38-48)):
```typescript
const { data: userData } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single();

if (!['admin', 'production'].includes(userData.role)) {
  return { success: false, error: 'Unauthorized' };
}
```

**Documentation**: `DOKUMENTASI_ROLE_BASED_ACCESS_CONTROL.md` (2,947 lines) contains complete RBAC specs, permissions matrix, RLS policies, notification triggers, and automated reports. Reference this for all authorization logic.

## Theming System

### Dynamic Theme Presets

**Generation**: Run `npm run generate:presets` to extract theme metadata from CSS files in `src/styles/presets/` and inject into `src/lib/preferences/theme.ts`.

**CSS preset structure**:
```css
/* label: Tangerine */
/* value: tangerine */
[data-color-scheme="tangerine"][data-theme="light"] {
  --primary: 20 100% 50%;
  /* ... */
}
```

**Theme application** ([src/app/layout.tsx](src/app/layout.tsx)): Uses `PreferencesStoreProvider` (Zustand) + `theme-boot.tsx` to apply preferences before hydration (prevents flash).

**User preferences**: Stored in cookies (server-side) and Zustand (client-side). See [src/lib/preferences/](src/lib/preferences/) for available options:
- `sidebar_variant`: "inset" | "sidebar" | "floating"
- `sidebar_collapsible`: "icon" | "offcanvas" | "none"
- `content_layout`: "wide" | "centered"
- `navbar_style`: "sticky" | "static"

## Data Tables

Use TanStack Table v8. Pattern in [src/components/data-table/data-table.tsx](src/components/data-table/data-table.tsx):
- Column definitions with sorting/filtering ([data-table-column-header.tsx](src/components/data-table/data-table-column-header.tsx))
- Pagination ([data-table-pagination.tsx](src/components/data-table/data-table-pagination.tsx))
- Column visibility toggle ([data-table-view-options.tsx](src/components/data-table/data-table-view-options.tsx))
- Drag-and-drop row reordering ([draggable-row.tsx](src/components/data-table/draggable-row.tsx)) using `@dnd-kit`

**Instance management**: Use `use-data-table-instance.ts` hook for accessing table instance across components.

## Forms & Validation

**Pattern** (React Hook Form + Zod + Shadcn Form):
```typescript
const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: { /* ... */ },
});

return (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormField
        control={form.control}
        name="fieldName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Label</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </form>
  </Form>
);
```

Server actions return `{ success: boolean, error?: string, data?: T }` format.

## Development Workflow

### Commands
- `npm run dev` - Start dev server (port 3000)
- `npm run build` - Production build
- `npm run check:fix` - Format + lint with Biome (auto-fix)
- `npm run generate:presets` - Update theme presets metadata

### Code Quality
- **Biome** (not ESLint/Prettier): Config in [biome.json](biome.json)
- Import organization: React → Next.js → packages → aliases → relative paths (configured in Biome)
- Husky pre-commit: Runs `biome check --write` on staged files
- Line width: 120 characters
- **No Biome on** `src/components/ui/*` (Shadcn-managed components)

### Conventions
- Use `"use server"` directive for Server Actions (top of file)
- Server Components by default; add `"use client"` only when needed (hooks, events, browser APIs)
- Async components: `export default async function Page() { /* ... */ }`
- Environment variables: `NEXT_PUBLIC_*` for client-side, plain for server-only

## Project-Specific Files

### Configuration
- **Config**: [src/config/app-config.ts](src/config/app-config.ts) - App name, version, meta tags

### Root Documentation (Bahasa Indonesia)
Comprehensive technical documentation (1,300+ lines each) covering complete system architecture:

- **DOKUMENTASI_STRUKTUR_KODE.md** (1,373 lines)
  - Complete folder structure breakdown (`src/app/`, `src/components/`, `src/lib/`, etc.)
  - File-by-file explanation with code examples
  - Routing patterns (route groups, layouts, pages)
  - Component library reference (50+ Shadcn UI components)
  - Best practices & troubleshooting guide

- **DOKUMENTASI_DESAIN_PATTERN.md** (1,373 lines)
  - Architecture patterns: Feature-based, Layered, Modular Monolith
  - State management: Zustand + Vanilla Store, Observer Pattern, Provider Pattern
  - Server-Client separation: Server Actions (BFF + Command Pattern)
  - Theming: Strategy Pattern, SSR-safe hydration, Theme Boot Script
  - Component patterns: Compound Components, Render Props, HOC
  - Performance: Code splitting, memoization, lazy loading

- **DOKUMENTASI_COLOR_PALETTE_UI_SISTEM.md** (1,300+ lines)
  - OKLCH color space system (not RGB/HSL)
  - Semantic color tokens (`--primary`, `--foreground`, etc.)
  - 4 theme presets: Default (Neutral), Tangerine (Orange/Purple), Brutalist (High-contrast), Soft Pop (Pastel)
  - Shadow system, border radius, dark mode strategy
  - Tailwind CSS v4 integration with CSS variables
  - Component color mapping & theme generation workflow

- **DOKUMENTASI_ROLE_BASED_ACCESS_CONTROL.md** (2,947 lines)
  - Complete RBAC implementation for Dreamlight World Media Production Tracking System
  - 3 roles with detailed permissions: Tim Produksi (full access), Broadcaster (read-only own projects), Investor (high-level summary)
  - Permission matrix: Project CRUD, Episode Management, Financial Management, User Management, Notifications, Reports, Delivery
  - Advanced features: Auto notifications, scheduled reports, budget allocation (5 categories), payment scheduling, audit logs
  - Database RLS policies (Row Level Security) for data isolation
  - Security best practices & testing validation
  - **CRITICAL**: All role names, permissions, and data visibility rules documented here

### docs/ Folder
Implementation guides and database schemas:

- **CHECKLIST_IMPLEMENTASI_SISTEM.md** (662 lines)
  - Bahasa Indonesia implementation tracking
  - Role-based feature checklist (45 items total: 15 per role)
  - Progress tracking: Tim Produksi 40%, Broadcaster 20%, Investor 0%
  - Phase breakdown: Foundation (100%), Core Features (40%), Advanced Features (0%)
  - Visual insight per role with completed vs pending features

- **CREATE_PROJECT_FEATURE.md**
  - Step-by-step guide for project creation flow
  - Form validation, server actions, RBAC checks

- **RBAC_IMPLEMENTATION_SUMMARY.md**
  - Quick reference for RBAC implementation status
  - Role permissions at-a-glance

- **RBAC_IMPLEMENTATION_CHECKLIST.md**
  - Task-by-task checklist for RBAC features

- **RBAC_QUICK_REFERENCE.md**
  - Quick lookup for role permissions & middleware patterns

- **docs-fix/** - Database & Security
  - `0-schema-base.sql` - Base database schema
  - `1-migration-add-rls-requirements.sql` - RLS migration
  - `rls-policies-corrected.sql` (478 lines) - Corrected RLS policies for 3 roles
  - `v3-rls-FIXED.md`, `v3-skema-FIXED.md`, `v3-trigger-FIXED.md` - Fixed implementations
  - `auto-assign-project-creator.sql` - Trigger for auto role assignment
  - `seed-admin.sql` - Admin user seeding
  - `ROLE_NAMES_NOTE.md` - Role naming conventions (DB: `production` / UI: "Tim Produksi")

### Key Reference Rules

**When working with RBAC**:
1. Check `DOKUMENTASI_ROLE_BASED_ACCESS_CONTROL.md` (2,947 lines) for complete permissions - DO NOT re-explain, just reference line numbers
2. Role names: `production` (DB) = "Tim Produksi" (UI), `broadcaster` (DB) = "Broadcaster/Client" (UI), `investor` (DB) = "Investor" (UI)
3. RLS policies in `docs/docs-fix/rls-policies-corrected.sql` - already implemented, don't recreate
4. Financial features (5 budget categories, payment scheduling, expense tracking) documented in RBAC docs Section 3G Advanced Features

**When working with theming**:
1. Reference `DOKUMENTASI_COLOR_PALETTE_UI_SISTEM.md` for color tokens - use semantic names (`--primary`, not hardcoded colors)
2. Theme generation: `npm run generate:presets` after CSS changes in `src/styles/presets/`
3. OKLCH color space only (not RGB/HSL)

**When working with architecture**:
1. Colocation-first: Check `DOKUMENTASI_STRUKTUR_KODE.md` for folder placement rules (`_components/` pattern)
2. Design patterns: Reference `DOKUMENTASI_DESAIN_PATTERN.md` for state management, server actions, component patterns - DO NOT reinvent patterns already documented

## Common Patterns

### Protected Layout Pattern
See [src/app/(main)/dashboard/layout.tsx](src/app/(main)/dashboard/layout.tsx:26-48):
1. Check auth with `supabase.auth.getUser()`
2. Redirect to `/login` if no user
3. Fetch user profile from `users` table for accurate role
4. Pass user data to client components via props

### Server Action Error Handling
```typescript
export async function actionName(input: Input) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Unauthorized. Please login.' };
    }
    
    // Business logic...
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Operation failed. Please try again.' };
  }
}
```

### Component Placement Decision Tree
1. Used in ONE route only? → `_components/` in that route folder
2. Used in MULTIPLE routes of same feature? → `_components/` in feature parent folder
3. Used across DIFFERENT features? → `src/components/{domain}/`
4. Pure UI component (no domain logic)? → `src/components/ui/` (Shadcn only)

## Debugging Tips

- Check Supabase RLS policies if database queries return empty/unauthorized
- Use `createSupabaseAdmin()` for operations that need to bypass RLS
- Theme not applying? Verify `theme-boot.tsx` loads before hydration
- Role check failing? User profile might be cached; check `users` table directly
- Import errors? Biome auto-organizes on save; run `npm run check:fix` manually if needed

## What NOT to Do

- ❌ Don't put feature components in `src/components/` unless truly shared
- ❌ Don't use ESLint/Prettier configs (Biome handles all formatting)
- ❌ Don't manually edit `src/components/ui/*` (regenerate via `npx shadcn@latest add <component>`)
- ❌ Don't create CSS in `_components/` folders (use Tailwind classes)
- ❌ Don't commit without running Biome checks (Husky should catch this)
- ❌ Don't use `auth.uid()` in Server Components (always null); fetch user first

## Quick Reference Links

- [Next Colocation Template](https://github.com/arhamkhnz/next-colocation-template) - Detailed colocation examples
- [Biome Docs](https://biomejs.dev/) - Linter/formatter rules
- [Shadcn UI](https://ui.shadcn.com/) - Component documentation
- [Supabase Docs](https://supabase.com/docs) - Database & auth
