# Figma Implementation Rules

This document outlines the rules and best practices for implementing designs from Figma into the codebase.

## Core Principles

### 1. No Spacer Divs
**Never use empty spacer divs or HTML elements for spacing.**

❌ **Don't do this:**
```tsx
<div className="h-16" />
<div className="h-8" />
<div className="h-2" />
```

✅ **Do this instead:**
```tsx
// Use padding, margins, or gaps
<div className="py-16">
<div className="mb-8">
<div className="flex flex-col gap-4">
```

**Use proper spacing utilities:**
- `gap-*` for flexbox/grid spacing
- `p-*`, `px-*`, `py-*`, `pt-*`, `pb-*`, `pl-*`, `pr-*` for padding
- `m-*`, `mx-*`, `my-*`, `mt-*`, `mb-*`, `ml-*`, `mr-*` for margins
- `space-y-*`, `space-x-*` for spacing between children

### 2. Use Theme Variables from globals.css
**All styling must use the theme variables defined in `globals.css`.**

The theme is 1:1 taken from the Figma design. Always use semantic color tokens instead of hardcoded colors.

❌ **Don't do this:**
```tsx
<div className="bg-[#0a3530] text-[#ffffff]">
```

✅ **Do this instead:**
```tsx
<div className="bg-background text-foreground">
```

**Available theme tokens:**
- `bg-background` / `text-foreground`
- `bg-primary` / `text-primary-foreground`
- `bg-secondary` / `text-secondary-foreground`
- `bg-card` / `text-card-foreground`
- `bg-muted` / `text-muted-foreground`
- `bg-accent` / `text-accent-foreground`
- `bg-destructive` / `text-destructive-foreground`
- `border-border`
- `ring-ring`

### 3. Use Tailwind Utility Classes
**Avoid hardcoded values. Use Tailwind's utility classes for consistency.**

❌ **Don't do this:**
```tsx
<div className="max-w-[300px] w-[162px] h-[162px] text-[17px]">
```

✅ **Do this instead:**
```tsx
<div className="max-w-sm w-40 h-40 text-base">
// Or use responsive variants
<div className="w-full md:max-w-sm">
```

**Common Tailwind classes to use:**
- **Width/Height:** `w-full`, `w-1/2`, `w-40`, `h-screen`, `h-16`, etc.
- **Max-width:** `max-w-xs`, `max-w-sm`, `max-w-md`, `max-w-lg`, `max-w-xl`, `max-w-2xl`, `max-w-4xl`, `max-w-6xl`, `max-w-7xl`
- **Spacing:** `p-4`, `px-6`, `py-8`, `m-4`, `gap-4`, `space-y-6`
- **Typography:** `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`, `text-5xl`
- **Font weights:** `font-normal`, `font-medium`, `font-semibold`, `font-bold`

### 4. Responsive Design
**Make layouts responsive. Remove max-width constraints on mobile, apply them only on larger screens.**

❌ **Don't do this:**
```tsx
<div className="max-w-7xl mx-auto px-4">
```

✅ **Do this instead:**
```tsx
<div className="w-full md:max-w-7xl md:mx-auto px-4">
```

**Responsive breakpoints:**
- Mobile first (default): no prefix
- Tablet and up: `md:*`
- Desktop and up: `lg:*`
- Large desktop: `xl:*`

**Example:**
```tsx
<div className="w-full md:max-w-4xl lg:max-w-6xl md:mx-auto px-4 md:px-8">
```

### 5. Consistent Spacing Scale
**Use Tailwind's spacing scale for consistency.**

Tailwind spacing scale (based on 4px increments):
- `0` = 0px
- `1` = 4px
- `2` = 8px
- `3` = 12px
- `4` = 16px
- `5` = 20px
- `6` = 24px
- `8` = 32px
- `10` = 40px
- `12` = 48px
- `16` = 64px
- `20` = 80px
- `24` = 96px

**Use these values instead of arbitrary values:**
- ❌ `py-[64px]` → ✅ `py-16`
- ❌ `gap-[12px]` → ✅ `gap-3`
- ❌ `mb-[28px]` → ✅ `mb-7` (or closest: `mb-6` or `mb-8`)

### 6. Typography Consistency
**Use Tailwind typography classes and theme font variables.**

The theme uses Inter font family. Use semantic text sizes:

```tsx
// Headings
<h1 className="text-4xl md:text-7xl"> // Large heading
<h2 className="text-2xl md:text-5xl"> // Section heading
<h3 className="text-xl md:text-3xl"> // Subsection heading

// Body text
<p className="text-base md:text-lg"> // Body text
<p className="text-sm"> // Small text
<p className="text-xs"> // Extra small text
```

**Line heights:**
- `leading-tight` - 1.25
- `leading-snug` - 1.375
- `leading-normal` - 1.5
- `leading-relaxed` - 1.625
- `leading-loose` - 2

### 7. Layout Patterns

**Container pattern:**
```tsx
<section className="w-full bg-background">
  <div className="w-full md:max-w-7xl md:mx-auto px-4 py-16">
    {/* Content */}
  </div>
</section>
```

**Flexbox spacing:**
```tsx
<div className="flex flex-col gap-4 md:gap-8">
  {/* Children automatically spaced */}
</div>
```

**Grid spacing:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
  {/* Grid items automatically spaced */}
</div>
```

**Vertical spacing between sections:**
```tsx
<section className="py-16 md:py-24">
  {/* Section content */}
</section>
```

### 8. Component Structure

**Keep components clean and semantic:**
```tsx
<section className="w-full bg-background">
  <div className="w-full md:max-w-7xl md:mx-auto px-4 py-16">
    <h2 className="text-2xl md:text-5xl mb-8">Title</h2>
    <div className="flex flex-col md:flex-row gap-8">
      {/* Content */}
    </div>
  </div>
</section>
```

### 9. Color Usage

**Always use theme colors:**
- Backgrounds: `bg-background`, `bg-card`, `bg-muted`
- Text: `text-foreground`, `text-muted-foreground`
- Primary actions: `bg-primary`, `text-primary-foreground`
- Secondary actions: `bg-secondary`, `text-secondary-foreground`
- Borders: `border-border`

**Opacity variants:**
- `bg-background/80` - 80% opacity
- `text-foreground/60` - 60% opacity

### 10. Border Radius

**Use theme radius or Tailwind defaults:**
- `rounded-sm` - 2px
- `rounded` - 4px (default)
- `rounded-md` - 6px
- `rounded-lg` - 8px
- `rounded-xl` - 12px
- `rounded-2xl` - 16px
- `rounded-full` - 9999px

The theme defines `--radius: 0.5rem` which maps to `rounded-lg`.

### 11. Shadows

**Use theme shadow variables (currently disabled, but available):**
- `shadow-sm`
- `shadow`
- `shadow-md`
- `shadow-lg`
- `shadow-xl`
- `shadow-2xl`

## Checklist Before Committing

- [ ] No spacer divs (`<div className="h-*" />`)
- [ ] All colors use theme tokens (no hardcoded hex values)
- [ ] All spacing uses Tailwind utilities (no arbitrary values like `w-[300px]`)
- [ ] Layout is responsive (mobile-first, max-width only on md+)
- [ ] Typography uses Tailwind text size classes
- [ ] Consistent spacing scale (4px increments)
- [ ] Proper semantic HTML structure
- [ ] All sections have proper padding/margins instead of spacers

## Examples

### Good Implementation
```tsx
<section className="w-full bg-background">
  <div className="w-full md:max-w-7xl md:mx-auto px-4 py-16">
    <h2 className="text-2xl md:text-5xl text-foreground mb-8 text-center">
      Section Title
    </h2>
    <div className="flex flex-col md:grid md:grid-cols-2 gap-8 md:gap-12">
      <div className="space-y-6">
        <p className="text-base md:text-lg text-muted-foreground">
          Content here
        </p>
      </div>
    </div>
  </div>
</section>
```

### Bad Implementation
```tsx
<section className="w-full bg-[#0a3530]">
  <div className="max-w-7xl mx-auto px-4">
    <div className="h-16" />
    <h2 className="text-[32px] md:text-[48px] text-[#ffffff] mb-[32px] text-center">
      Section Title
    </h2>
    <div className="h-8" />
    <div className="flex flex-col md:grid md:grid-cols-2 gap-[24px] md:gap-[48px]">
      <div className="max-w-[300px]">
        <p className="text-[16px] md:text-[18px] text-[#cccccc]">
          Content here
        </p>
      </div>
    </div>
    <div className="h-16" />
  </div>
</section>
```

## Quick Reference

| What | Use This | Not This |
|------|----------|----------|
| Spacing | `gap-4`, `py-16`, `mb-8` | `<div className="h-16" />` |
| Colors | `bg-background`, `text-foreground` | `bg-[#0a3530]`, `text-[#ffffff]` |
| Width | `w-full`, `max-w-7xl` | `w-[300px]`, `max-w-[1200px]` |
| Typography | `text-2xl`, `text-base` | `text-[32px]`, `text-[16px]` |
| Responsive | `w-full md:max-w-7xl` | `max-w-7xl` (always) |

