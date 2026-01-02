# 🎨 Dokumentasi Color Palette & UI Design System

> Dokumentasi lengkap tentang sistem desain warna, theming, dan UI components pada Studio Admin Dashboard

**Tanggal Dokumentasi**: 2 Januari 2026  
**Versi Proyek**: 2.2.0  
**Tech Stack**: Tailwind CSS v4, CSS Variables, OKLCH Color Space

---

## 📑 **DAFTAR ISI**

1. [Arsitektur Color System](#1-arsitektur-color-system)
2. [Color Palette Structure](#2-color-palette-structure)
3. [Theme Presets](#3-theme-presets)
4. [Design Tokens](#4-design-tokens)
5. [Color Naming Convention](#5-color-naming-convention)
6. [Shadow System](#6-shadow-system)
7. [Border Radius System](#7-border-radius-system)
8. [Dark Mode Strategy](#8-dark-mode-strategy)
9. [Component Color Mapping](#9-component-color-mapping)
10. [Cara Menambah Theme Baru](#10-cara-menambah-theme-baru)

---

## 1. 🏗️ **ARSITEKTUR COLOR SYSTEM**

### **A. Hierarki Color System**

```
┌─────────────────────────────────────────┐
│   Tailwind CSS v4 Color Engine          │
│   (Compile-time color processing)       │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│   CSS Variables (Design Tokens)         │
│   (Runtime theming support)             │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│   Theme Presets (CSS Files)             │
│   (User-selectable themes)              │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│   Component Classes (Tailwind)          │
│   (Applied in React components)         │
└─────────────────────────────────────────┘
```

---

### **B. File Structure**

```
src/
├── app/
│   └── globals.css                 # Base theme + CSS variable definitions
├── styles/
│   └── presets/
│       ├── tangerine.css          # Tangerine theme preset
│       ├── brutalist.css          # Brutalist theme preset
│       └── soft-pop.css           # Soft Pop theme preset
├── lib/
│   └── preferences/
│       └── theme.ts               # TypeScript theme configuration
└── scripts/
    └── generate-theme-presets.ts  # Auto-generate theme metadata
```

---

## 2. 🎨 **COLOR PALETTE STRUCTURE**

### **A. Semantic Color Tokens**

Project ini menggunakan **semantic naming** untuk color tokens, bukan warna literal:

| Token | Kegunaan | Contoh Penggunaan |
|-------|----------|-------------------|
| `--background` | Background utama aplikasi | Body, main container |
| `--foreground` | Text color utama | Paragraf, heading |
| `--card` | Background untuk card components | Card, dialog, sheet |
| `--card-foreground` | Text color untuk card | Content di dalam card |
| `--popover` | Background untuk floating elements | Dropdown, tooltip, popover |
| `--popover-foreground` | Text color untuk popover | Content di dalam popover |
| `--primary` | Warna brand utama | CTA buttons, active states |
| `--primary-foreground` | Text di atas primary color | Button text |
| `--secondary` | Warna aksen sekunder | Secondary buttons |
| `--secondary-foreground` | Text di atas secondary | Secondary button text |
| `--muted` | Background untuk muted elements | Disabled states, subtle backgrounds |
| `--muted-foreground` | Text color untuk muted | Helper text, captions |
| `--accent` | Accent color untuk highlights | Hover states, badges |
| `--accent-foreground` | Text di atas accent | Content pada accent background |
| `--destructive` | Warna untuk actions destructive | Delete buttons, error states |
| `--border` | Border color default | Dividers, outlines |
| `--input` | Border color untuk input fields | Text inputs, selects |
| `--ring` | Focus ring color | Focus states, keyboard navigation |

---

### **B. Sidebar-Specific Tokens**

Sidebar memiliki color tokens terpisah untuk flexibility:

| Token | Kegunaan |
|-------|----------|
| `--sidebar` | Background sidebar |
| `--sidebar-foreground` | Text color di sidebar |
| `--sidebar-primary` | Active/selected menu item |
| `--sidebar-primary-foreground` | Text pada active menu |
| `--sidebar-accent` | Hover state di sidebar |
| `--sidebar-accent-foreground` | Text pada hover state |
| `--sidebar-border` | Border di sidebar |
| `--sidebar-ring` | Focus ring di sidebar |

---

### **C. Chart Colors**

Untuk data visualization:

| Token | Kegunaan |
|-------|----------|
| `--chart-1` | Warna chart series 1 |
| `--chart-2` | Warna chart series 2 |
| `--chart-3` | Warna chart series 3 |
| `--chart-4` | Warna chart series 4 |
| `--chart-5` | Warna chart series 5 |

---

## 3. 🌈 **THEME PRESETS**

Project ini menyediakan **4 theme presets** yang bisa dipilih user:

### **A. Default Theme (Neutral)**

**File**: `src/app/globals.css` (`:root` selector)

**Karakteristik**:
- ✅ Clean, minimal, professional
- ✅ Grayscale dengan subtle contrast
- ✅ Base color: Neutral (tanpa hue)
- ✅ Cocok untuk corporate/business apps

**Color Values (Light Mode)**:
```css
--primary: oklch(0.205 0 0);           /* Dark gray */
--background: oklch(1 0 0);            /* Pure white */
--foreground: oklch(0.145 0 0);        /* Almost black */
--accent: oklch(0.97 0 0);             /* Very light gray */
```

**Color Values (Dark Mode)**:
```css
--primary: oklch(0.922 0 0);           /* Light gray */
--background: oklch(0.145 0 0);        /* Dark charcoal */
--foreground: oklch(0.985 0 0);        /* Off-white */
--accent: oklch(0.269 0 0);            /* Medium gray */
```

**Visual Identity**:
- 🎯 Monochrome palette
- 📊 High contrast untuk readability
- 💼 Professional appearance

---

### **B. Tangerine Theme**

**File**: `src/styles/presets/tangerine.css`

**Karakteristik**:
- ✅ Warm, energetic, modern
- ✅ Orange primary dengan purple accents
- ✅ Base color: Lavender background
- ✅ Cocok untuk creative/marketing apps

**Color Values (Light Mode)**:
```css
--primary: oklch(0.64 0.17 36.44);     /* Orange */
--background: oklch(0.94 0 236.5);     /* Light lavender */
--accent: oklch(0.91 0.02 243.82);     /* Purple tint */
--sidebar: oklch(0.9 0 258.33);        /* Lavender sidebar */
```

**Color Values (Dark Mode)**:
```css
--primary: oklch(0.64 0.17 36.44);     /* Orange (same) */
--background: oklch(0.26 0.03 262.67); /* Dark purple */
--accent: oklch(0.34 0.06 267.59);     /* Deep purple */
--sidebar: oklch(0.31 0.03 267.74);    /* Dark purple sidebar */
```

**Visual Identity**:
- 🍊 Tangerine orange as hero color
- 💜 Purple as complementary
- 🌅 Warm, inviting atmosphere
- ✨ Soft shadows

---

### **C. Brutalist Theme**

**File**: `src/styles/presets/brutalist.css`

**Karakteristik**:
- ✅ Bold, high-contrast, statement-making
- ✅ Pure black & white dengan vibrant accents
- ✅ Zero border radius (sharp corners)
- ✅ Cocok untuk portfolio/design-forward apps

**Color Values (Light Mode)**:
```css
--radius: 0px;                          /* NO rounded corners */
--primary: oklch(0.6489 0.237 26.9728); /* Vibrant red */
--background: oklch(1 0 0);             /* Pure white */
--foreground: oklch(0 0 0);             /* Pure black */
--border: oklch(0 0 0);                 /* Black borders */
--accent: oklch(0.5635 0.2408 260.8178);/* Vibrant purple */
--secondary: oklch(0.968 0.211 109.7692);/* Bright lime */
```

**Color Values (Dark Mode)**:
```css
--primary: oklch(0.7044 0.1872 23.1858); /* Lighter red */
--background: oklch(0 0 0);              /* Pure black */
--foreground: oklch(1 0 0);              /* Pure white */
--border: oklch(1 0 0);                  /* White borders */
--accent: oklch(0.6755 0.1765 252.2592); /* Lighter purple */
--secondary: oklch(0.9691 0.2005 109.6228);/* Bright lime */
```

**Visual Identity**:
- 🖤 Stark black & white
- 🎨 Vibrant, saturated accent colors
- 📐 Zero rounded corners (--radius: 0px)
- 🔳 Hard shadows: `4px 4px 0px 0px black`
- 💪 Bold, unapologetic design

---

### **D. Soft Pop Theme**

**File**: `src/styles/presets/soft-pop.css`

**Karakteristik**:
- ✅ Playful, friendly, approachable
- ✅ Pastel colors dengan soft gradients
- ✅ Large border radius (1rem)
- ✅ Cocok untuk consumer apps/dashboards

**Color Values (Light Mode)**:
```css
--radius: 1rem;                         /* Very rounded */
--primary: oklch(0.5106 0.2301 276.9656);/* Purple */
--secondary: oklch(0.7038 0.123 182.5025);/* Teal */
--accent: oklch(0.7686 0.1647 70.0804); /* Yellow */
--background: oklch(0.9789 0.0082 121.6272);/* Mint tint */
--destructive: oklch(0.6368 0.2078 25.3313);/* Coral red */
```

**Color Values (Dark Mode)**:
```css
--primary: oklch(0.6801 0.1583 276.9349);/* Lighter purple */
--secondary: oklch(0.7845 0.1325 181.912);/* Lighter teal */
--accent: oklch(0.879 0.1534 91.6054);   /* Lighter yellow */
--background: oklch(0 0 0);              /* Pure black */
--border: oklch(0.4459 0 0);             /* Gray borders */
```

**Visual Identity**:
- 🔮 Purple as primary
- 🌊 Teal secondary
- ☀️ Yellow accents
- 🍬 Soft, candy-like palette
- 🌈 Playful, youthful vibe
- 🔘 Very rounded corners (1rem)

---

## 4. 🎯 **DESIGN TOKENS**

### **A. Color Space: OKLCH**

Project ini menggunakan **OKLCH color space** (bukan RGB atau HSL):

```css
/* Format OKLCH: oklch(Lightness Chroma Hue / Alpha) */
--primary: oklch(0.64 0.17 36.44);

/* Breakdown: */
/* L (Lightness): 0.64 = 64% lightness */
/* C (Chroma): 0.17 = 17% color intensity */
/* H (Hue): 36.44 = Orange hue (0-360 degrees) */
```

**Keuntungan OKLCH**:
- ✅ **Perceptually uniform**: Same lightness = same perceived brightness
- ✅ **Better color manipulation**: Easy to create variants
- ✅ **Wider gamut**: Access lebih banyak warna
- ✅ **Modern standard**: CSS Color Module Level 4

**Hue Reference**:
```
0° = Red
30° = Orange
60° = Yellow
120° = Green
180° = Cyan
240° = Blue
270° = Purple
300° = Magenta
360° = Red (full circle)
```

---

### **B. Tailwind Integration**

**File**: `src/app/globals.css`

```css
@theme inline {
  /* Map CSS variables to Tailwind classes */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  /* ... more mappings */
}
```

**Usage in Components**:
```tsx
// Direct Tailwind classes
<div className="bg-background text-foreground">
<Button className="bg-primary text-primary-foreground">
<Card className="bg-card border-border">
```

---

## 5. 📝 **COLOR NAMING CONVENTION**

### **A. Semantic Naming Rules**

✅ **DO**: Gunakan semantic names
```css
--primary         /* ✅ Good: describes purpose */
--destructive     /* ✅ Good: describes intent */
--muted-foreground /* ✅ Good: describes context */
```

❌ **DON'T**: Gunakan literal color names
```css
--orange          /* ❌ Bad: describes appearance */
--light-blue      /* ❌ Bad: not flexible */
--gray-500        /* ❌ Bad: tied to specific shade */
```

---

### **B. Naming Pattern**

```
[component]-[element]-[variant]

Examples:
- sidebar-primary              (component-variant)
- sidebar-primary-foreground   (component-variant-element)
- card-foreground              (component-element)
```

---

## 6. 🌑 **SHADOW SYSTEM**

Setiap theme preset memiliki **custom shadow values**:

### **A. Default Theme Shadows**

```css
/* Soft, subtle shadows (menggunakan default Tailwind) */
.shadow-sm  /* Small shadow untuk cards */
.shadow     /* Medium shadow untuk dropdowns */
.shadow-lg  /* Large shadow untuk modals */
```

---

### **B. Brutalist Theme Shadows**

```css
/* Hard, offset shadows (neo-brutalism style) */
--shadow: 4px 4px 0px 0px hsl(0 0% 0% / 1);

/* Efek: Hard black shadow dengan 4px offset */
```

**Visual**: 
```
┌─────────┐
│ Element │
└─────────┘▓▓▓▓▓▓▓  ← Hard shadow
    ▓▓▓▓▓▓▓
```

---

### **C. Tangerine Theme Shadows**

```css
/* Standard soft shadows dengan black tint */
--shadow: 0px 1px 3px 0px hsl(0 0% 0% / 0.1), 
          0px 1px 2px -1px hsl(0 0% 0% / 0.1);
```

---

### **D. Soft Pop Theme Shadows**

```css
/* Minimal shadows (almost no shadow) */
--shadow: 0px 0px 0px 0px hsl(0 0% 10.1961% / 0.05);

/* Efek: Very subtle, flat design */
```

---

## 7. ⭕ **BORDER RADIUS SYSTEM**

### **A. Dynamic Radius Tokens**

```css
--radius: 0.625rem;  /* Base radius (10px) */

/* Calculated radius variants: */
--radius-sm:   calc(var(--radius) - 4px);  /* 6px */
--radius-md:   calc(var(--radius) - 2px);  /* 8px */
--radius-lg:   var(--radius);              /* 10px */
--radius-xl:   calc(var(--radius) + 4px);  /* 14px */
--radius-2xl:  calc(var(--radius) + 8px);  /* 18px */
--radius-3xl:  calc(var(--radius) + 12px); /* 22px */
--radius-4xl:  calc(var(--radius) + 16px); /* 26px */
```

---

### **B. Theme-Specific Radius**

| Theme | Base Radius | Visual Style |
|-------|-------------|--------------|
| **Default** | `0.625rem (10px)` | Moderate rounding |
| **Tangerine** | `0.625rem (10px)` | Moderate rounding |
| **Brutalist** | `0px` | **Sharp corners** |
| **Soft Pop** | `1rem (16px)` | **Very rounded** |

---

### **C. Usage Pattern**

```tsx
// Small elements (badges, tags)
<Badge className="rounded-sm">

// Medium elements (buttons, inputs)
<Button className="rounded-md">

// Large elements (cards, modals)
<Card className="rounded-lg">

// Extra large (hero sections)
<div className="rounded-xl">
```

---

## 8. 🌓 **DARK MODE STRATEGY**

### **A. Dark Mode Implementation**

**Pattern**: Class-based dark mode dengan Tailwind

```html
<html class="dark">  <!-- Dark mode ON -->
<html class="light"> <!-- Light mode ON -->
```

**CSS Structure**:
```css
/* Light mode (default) */
:root {
  --background: oklch(1 0 0);      /* White */
  --foreground: oklch(0.145 0 0);  /* Black */
}

/* Dark mode override */
.dark {
  --background: oklch(0.145 0 0);  /* Black */
  --foreground: oklch(0.985 0 0);  /* White */
}
```

---

### **B. Dark Mode Color Adjustments**

**Principles**:
1. **Invert background/foreground**
2. **Reduce contrast** (dark mode lebih subtle)
3. **Lighten primary colors** (better visibility on dark bg)
4. **Adjust saturation** (colors look more vibrant in dark)

**Example - Primary Color Adjustment**:
```css
/* Light mode */
--primary: oklch(0.205 0 0);  /* Dark gray (20.5% lightness) */

/* Dark mode */
--primary: oklch(0.922 0 0);  /* Light gray (92.2% lightness) */

/* Note: Lightness inverted untuk visibility */
```

---

### **C. Dark Mode Toggle**

**File**: Theme toggle component menggunakan `next-themes`:

```tsx
import { useTheme } from "next-themes";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      Toggle Theme
    </button>
  );
}
```

---

## 9. 🎨 **COMPONENT COLOR MAPPING**

### **A. Button Component**

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| **Primary** | `bg-primary` | `text-primary-foreground` | - |
| **Secondary** | `bg-secondary` | `text-secondary-foreground` | - |
| **Destructive** | `bg-destructive` | `text-destructive-foreground` | - |
| **Outline** | `transparent` | `text-foreground` | `border-input` |
| **Ghost** | `hover:bg-accent` | `text-foreground` | - |

---

### **B. Card Component**

```tsx
<Card>           {/* bg-card, border-border */}
  <CardHeader>   {/* p-6 */}
    <CardTitle>  {/* text-card-foreground, font-semibold */}
  </CardHeader>
  <CardContent>  {/* text-card-foreground, p-6 pt-0 */}
</Card>
```

---

### **C. Input Component**

```tsx
<Input />
/* Classes:
   - bg-background
   - text-foreground
   - border-input
   - focus:ring-ring
   - placeholder:text-muted-foreground
*/
```

---

### **D. Badge Component**

| Variant | Background | Text |
|---------|-----------|------|
| **Default** | `bg-primary` | `text-primary-foreground` |
| **Secondary** | `bg-secondary` | `text-secondary-foreground` |
| **Destructive** | `bg-destructive` | `text-destructive-foreground` |
| **Outline** | `transparent` | `text-foreground` + `border` |

---

## 10. ➕ **CARA MENAMBAH THEME BARU**

### **Step-by-Step Tutorial**

#### **Step 1: Buat CSS File Baru**

**File**: `src/styles/presets/ocean.css`

```css
/* 
label: Ocean
value: ocean
*/

:root[data-theme-preset="ocean"] {
  --radius: 0.75rem;
  
  /* Define semua color tokens */
  --background: oklch(0.97 0.01 210);
  --foreground: oklch(0.2 0.02 220);
  --primary: oklch(0.55 0.15 220);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.65 0.12 180);
  --secondary-foreground: oklch(0.1 0 0);
  
  /* ... define all tokens (copy dari preset lain) */
  
  /* Custom shadows */
  --shadow: 0px 2px 4px 0px hsl(220 50% 50% / 0.1);
}

/* Dark mode variant */
.dark:root[data-theme-preset="ocean"] {
  --background: oklch(0.15 0.02 220);
  --foreground: oklch(0.95 0.01 210);
  --primary: oklch(0.65 0.18 220);
  /* ... dark mode overrides */
}
```

---

#### **Step 2: Import di globals.css**

**File**: `src/app/globals.css`

```css
@import "tailwindcss";
@import "tw-animate-css";

/* Import preset baru */
@import "../styles/presets/ocean.css";     /* ← ADD THIS */
@import "../styles/presets/brutalist.css";
@import "../styles/presets/soft-pop.css";
@import "../styles/presets/tangerine.css";
```

---

#### **Step 3: Generate Theme Metadata**

**Run command**:
```bash
npm run generate:presets
```

**Apa yang terjadi**:
1. Script `generate-theme-presets.ts` scan folder `styles/presets/`
2. Extract `label:` dan `value:` dari CSS comments
3. Extract `--primary` color untuk preview
4. Auto-generate TypeScript types di `lib/preferences/theme.ts`

**Result** - File `theme.ts` updated:
```typescript
export const THEME_PRESET_OPTIONS = [
  {
    label: "Default",
    value: "default",
    primary: { light: "...", dark: "..." }
  },
  {
    label: "Ocean",          // ← Auto-generated
    value: "ocean",          // ← Auto-generated
    primary: {               // ← Auto-extracted
      light: "oklch(0.55 0.15 220)",
      dark: "oklch(0.65 0.18 220)"
    }
  },
  // ... other themes
] as const;
```

---

#### **Step 4: Test Theme**

**Di UI**:
1. Buka Settings/Preferences
2. Pilih theme "Ocean" dari dropdown
3. Theme akan langsung applied

**Programmatically**:
```typescript
const { setThemePreset } = usePreferencesStore();
setThemePreset("ocean");
```

---

## 🎓 **BEST PRACTICES**

### **✅ DO's**

1. **Use semantic color tokens**
   ```tsx
   ✅ <div className="bg-background text-foreground">
   ❌ <div className="bg-white text-black">
   ```

2. **Use OKLCH for color definitions**
   ```css
   ✅ --primary: oklch(0.64 0.17 36.44);
   ❌ --primary: #ff6600;
   ```

3. **Define both light and dark variants**
   ```css
   ✅ :root { --primary: oklch(0.6 0.2 30); }
   ✅ .dark { --primary: oklch(0.7 0.18 35); }
   ```

4. **Use CSS variables untuk consistency**
   ```css
   ✅ --sidebar: var(--background);
   ❌ --sidebar: oklch(1 0 0);
   ```

5. **Test accessibility**
   - Contrast ratio minimal 4.5:1 untuk normal text
   - Contrast ratio minimal 3:1 untuk large text
   - Use tools: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

### **❌ DON'TS**

1. **Jangan hardcode colors**
   ```tsx
   ❌ <div style={{ backgroundColor: "#ff6600" }}>
   ✅ <div className="bg-primary">
   ```

2. **Jangan skip dark mode**
   ```css
   ❌ /* Only defining light mode */
   :root { --primary: oklch(...); }
   
   ✅ /* Both modes */
   :root { --primary: oklch(...); }
   .dark { --primary: oklch(...); }
   ```

3. **Jangan use deprecated color spaces**
   ```css
   ❌ --primary: rgb(255, 102, 0);
   ❌ --primary: hsl(24, 100%, 50%);
   ✅ --primary: oklch(0.64 0.17 36.44);
   ```

---

## 🛠️ **TOOLS & UTILITIES**

### **A. Color Conversion Tools**

1. **[OKLCH Color Picker](https://oklch.com/)**
   - Convert HEX/RGB → OKLCH
   - Visual color picker
   - Contrast checker

2. **[Huetone](https://huetone.ardov.me/)**
   - Generate color palettes
   - OKLCH-based
   - Accessibility testing

3. **[Radix Colors](https://www.radix-ui.com/colors)**
   - Pre-made accessible palettes
   - Already in OKLCH
   - Shadcn UI compatible

---

### **B. Chrome DevTools**

```
1. Inspect element
2. Go to "Computed" tab
3. Search for CSS variable (e.g., --primary)
4. See actual computed value
```

---

### **C. VS Code Extensions**

1. **Tailwind CSS IntelliSense**
   - Autocomplete Tailwind classes
   - Color preview inline

2. **Color Highlight**
   - Preview colors di CSS variables

---

## 📊 **COLOR PALETTE COMPARISON**

### **Visual Comparison Table**

| Theme | Primary Color | Vibe | Best For |
|-------|--------------|------|----------|
| **Default** | Gray | Professional | Corporate apps, SaaS |
| **Tangerine** | Orange | Energetic | Creative, Marketing |
| **Brutalist** | Red | Bold | Portfolio, Design |
| **Soft Pop** | Purple | Playful | Consumer, Dashboard |

---

### **Technical Comparison**

| Theme | Border Radius | Shadow Style | Color Saturation |
|-------|--------------|--------------|------------------|
| **Default** | 10px | Soft | Low (0-5%) |
| **Tangerine** | 10px | Soft | Medium (10-20%) |
| **Brutalist** | **0px** | **Hard** | **High (20-25%)** |
| **Soft Pop** | **16px** | Minimal | Medium (15-23%) |

---

## 🎨 **COLOR HARMONY PRINCIPLES**

### **A. 60-30-10 Rule**

```
60% - Background & neutral colors
30% - Secondary/accent colors  
10% - Primary/CTA colors
```

**Applied**:
- 60% = `--background`, `--card`, `--muted`
- 30% = `--secondary`, `--accent`
- 10% = `--primary`, `--destructive`

---

### **B. Contrast Ratios (WCAG)**

| Level | Normal Text | Large Text |
|-------|------------|------------|
| **AA** | 4.5:1 | 3:1 |
| **AAA** | 7:1 | 4.5:1 |

**Project ini target**: WCAG AA minimum

---

## 🔄 **THEME SWITCHING FLOW**

### **User Flow**:

```
1. User clicks theme selector
   ↓
2. Call setThemePreset("ocean")
   ↓
3. Zustand store updates themePreset state
   ↓
4. useEffect updates <html> attribute
   ↓
5. CSS cascade applies new preset
   ↓
6. Browser re-renders with new colors
   ↓
7. Persist to cookie (optional)
```

### **Technical Flow**:

```typescript
// 1. User action
<Select onValueChange={(val) => setThemePreset(val)}>

// 2. Store update
const setThemePreset = (preset: ThemePreset) => {
  set({ themePreset: preset });
};

// 3. Apply to DOM
useEffect(() => {
  document.documentElement.setAttribute('data-theme-preset', themePreset);
}, [themePreset]);

// 4. CSS applies automatically via attribute selector
:root[data-theme-preset="ocean"] { /* ... */ }
```

---

## 🧪 **TESTING COLOR SYSTEM**

### **A. Visual Regression Testing**

```bash
# Test all theme presets
npm run test:visual

# Test specific theme
npm run test:visual -- --theme=brutalist
```

---

### **B. Accessibility Testing**

```bash
# Run accessibility audit
npm run test:a11y

# Check contrast ratios
npm run test:contrast
```

---

### **C. Manual Testing Checklist**

- [ ] All themes load tanpa error
- [ ] Dark mode works di semua themes
- [ ] Color contrast ratio pass WCAG AA
- [ ] Focus states visible
- [ ] No color-only information (use icons/text too)
- [ ] Print styles appropriate
- [ ] Color blind mode friendly

---

## 📚 **REFERENSI**

### **Dokumentasi**

1. **[OKLCH Color Space](https://oklch.com/)** - Official spec
2. **[Tailwind CSS v4](https://tailwindcss.com/)** - Framework docs
3. **[Shadcn UI Theming](https://ui.shadcn.com/docs/theming)** - Component theming
4. **[CSS Color Module Level 4](https://www.w3.org/TR/css-color-4/)** - W3C spec

### **Tools**

1. **[Coolors](https://coolors.co/)** - Palette generator
2. **[Contrast Checker](https://webaim.org/resources/contrastchecker/)** - WCAG testing
3. **[Colorbox](https://colorbox.io/)** - OKLCH palette builder

### **Inspirasi**

1. **[Tweakcn](https://tweakcn.com)** - Theme preset inspiration
2. **[Radix Colors](https://www.radix-ui.com/colors)** - Accessible palettes
3. **[Vercel Design](https://vercel.com/design)** - Design system reference

---

## 🎯 **KESIMPULAN**

### **Key Takeaways**:

1. ✅ **OKLCH color space** untuk perceptual uniformity
2. ✅ **Semantic naming** untuk flexibility
3. ✅ **CSS variables** untuk runtime theming
4. ✅ **4 pre-built themes** dengan distinct personalities
5. ✅ **Dark mode support** built-in
6. ✅ **Type-safe** theme configuration
7. ✅ **Auto-generated** theme metadata
8. ✅ **Accessible** by default

### **System Strength**:

- 🎨 **Flexible**: Easy to add new themes
- 🔧 **Maintainable**: Centralized color tokens
- ⚡ **Performant**: CSS-only, no JS overhead
- ♿ **Accessible**: WCAG AA compliant
- 🎯 **Type-safe**: Full TypeScript support
- 📱 **Responsive**: Works on all devices

---

**Happy Theming! 🎨✨**
