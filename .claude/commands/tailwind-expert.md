Tailwind CSS 4.1+ expert for CSS-first configuration, light/dark theming, glass components, and modern CSS features.

Task: $ARGUMENTS

## CSS-First Configuration

Tailwind v4 uses `@theme` directive instead of `tailwind.config.js`:

```css
@import "tailwindcss";
@theme {
  --color-primary-500: oklch(0.55 0.2 250);
  --font-display: "Inter", system-ui, sans-serif;
  --animate-fade-in: fade-in 0.3s ease-out;
}
```

## Dark Mode

This project uses `prefers-color-scheme` for automatic dark mode.

### Color Mapping (MANDATORY)

| Light | Dark | Usage |
|-------|------|-------|
| `bg-white` | `dark:bg-neutral-950` | Page backgrounds |
| `bg-gray-50` | `dark:bg-neutral-900` | Secondary backgrounds |
| `bg-gray-100` | `dark:bg-neutral-800` | Inputs, tertiary |
| `text-gray-900` | `dark:text-gray-100` | Primary text |
| `text-gray-700` | `dark:text-gray-300` | Secondary text |
| `text-gray-500` | `dark:text-gray-400` | Muted text |
| `border-gray-200` | `dark:border-neutral-700` | Borders |
| `hover:bg-gray-50` | `dark:hover:bg-neutral-800` | Hover states |

### Brand Colors

| Light | Dark | Usage |
|-------|------|-------|
| `text-amber-700` | `dark:text-amber-400` | Brand gold |
| `text-red-600` | `dark:text-red-400` | Error |
| `text-pink-600` | `dark:text-pink-400` | Like/heart |
| `text-blue-500` | `dark:text-blue-400` | Links |

### Glass/Glassmorphism

```tsx
// Glass backgrounds
className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl"
// Glass borders
className="border-white/30 dark:border-white/10"
```

## Modern CSS Features

### Container Queries (Built-in)
```html
<div class="@container">
  <div class="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3">
```

### @starting-style (Entrance Animations Without JS)
```html
<div class="[@starting-style]:opacity-0 [@starting-style]:translate-y-4 transition-all">
```

### v4.1 Features
- Text shadows: `text-shadow-md text-shadow-black/20`
- Masks: `mask-linear-to-b`
- Touch detection: `pointer-coarse:p-4`
- Reduced motion: `motion-reduce:animate-none`

## Glass Components

```tsx
import { GlassContainer, GlassTabs, GlassCard, GlassSearch, GlassDropdown } from "@/components/glass";

<GlassTabs tabs={tabs} activeTab={active} onChange={setActive} />
<GlassCard withBorder>Content</GlassCard>
```

### GlassContainer Variants

| Variant | Use Case | Radius |
|---------|----------|--------|
| `nav` | Bottom navigation | 24px |
| `tabs` | Tab navigation | pill |
| `card` | Cards, CTAs | 20px |
| `menu` | Dropdowns | 16px |
| `search` | Search inputs | pill |

### When to Use Glass vs CSS Glassmorphism

**GlassContainer (LiquidGlass):** Non-fixed elements (dropdowns, tabs, cards, modals)
**CSS Glassmorphism:** Fixed elements (bottom nav, headers, floating bars) — SVG filters break `position: fixed`

## Accessibility

- Motion: `motion-reduce:animate-none`
- Contrast: WCAG AA 4.5:1 for text, 3:1 for large text
- Test both light AND dark modes

## Dark Mode Checklist

- [ ] Every `bg-*` has `dark:` variant
- [ ] Every `text-*` has `dark:` variant
- [ ] Every `border-*` has `dark:` variant
- [ ] Hover states have `dark:hover:` variant
- [ ] Gradients have dark variants on both ends
- [ ] Brand colors use lighter variants in dark mode
