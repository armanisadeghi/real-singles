# Tailwind CSS 4.1+ Expert

Expert guidance for Tailwind CSS 4.1+ with deep knowledge of CSS-first configuration, light/dark theming, modern CSS features, and React/Next.js integration.

## When to Use This Skill

Use this skill when:
- Writing or reviewing Tailwind CSS code
- Implementing light/dark mode themes
- Working with colors and ensuring theme consistency
- Using modern CSS features (container queries, animations, etc.)
- Setting up Tailwind in React/Next.js/Vite projects
- Migrating from Tailwind v3 to v4

---

## Core Responsibilities

When this skill is active:
1. Ensure all color usage follows light/dark mode best practices
2. Leverage Tailwind CSS 4's CSS-first configuration
3. Use modern CSS features built into v4 (container queries, @starting-style, etc.)
4. Recommend performant, accessible patterns
5. Flag deprecated v3 patterns that should be updated

---

## Tailwind CSS 4.1+ Key Concepts

### CSS-First Configuration

Tailwind v4 replaces `tailwind.config.js` with CSS-first configuration using the `@theme` directive:

```css
@import "tailwindcss";

@theme {
  /* Colors - automatically generates bg-*, text-*, border-*, etc. utilities */
  --color-primary-50: oklch(0.97 0.01 250);
  --color-primary-500: oklch(0.55 0.2 250);
  --color-primary-900: oklch(0.25 0.1 250);
  
  /* Typography */
  --font-display: "Inter", system-ui, sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
  
  /* Spacing */
  --spacing-18: 4.5rem;
  
  /* Border radius */
  --radius-xl: 1rem;
  
  /* Shadows */
  --shadow-soft: 0 2px 8px oklch(0 0 0 / 0.08);
  
  /* Animations */
  --animate-fade-in: fade-in 0.3s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**Key benefit:** Theme variables are exposed as CSS custom properties at runtime, enabling dynamic theming without rebuilds.

**Documentation:** https://tailwindcss.com/docs/theme

---

## Light/Dark Mode Best Practices (CRITICAL)

### Default Behavior

Tailwind v4 uses `prefers-color-scheme` by default. The `dark:` variant applies automatically based on system preference:

```html
<div class="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
  Respects system preference
</div>
```

### Manual Theme Toggling (Recommended Pattern)

For user-controlled themes, override the dark variant in CSS:

```css
@import "tailwindcss";

/* Class-based toggling */
@custom-variant dark (&:where(.dark, .dark *));

/* OR data attribute-based (often cleaner) */
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

### Three-Way Theme Toggle (System + Light + Dark)

```typescript
// Theme toggle implementation
type Theme = 'light' | 'dark' | 'system';

function setTheme(theme: Theme) {
  const root = document.documentElement;
  
  if (theme === 'system') {
    root.removeAttribute('data-theme');
    // Let prefers-color-scheme handle it
  } else {
    root.setAttribute('data-theme', theme);
  }
  
  localStorage.setItem('theme', theme);
}

// On page load (run in <head> to prevent FOUC)
const theme = localStorage.getItem('theme') as Theme | null;
if (theme && theme !== 'system') {
  document.documentElement.setAttribute('data-theme', theme);
}
```

### Semantic Color Tokens (Best Practice)

Define semantic colors that automatically adapt:

```css
@theme {
  /* Light mode defaults */
  --color-surface: oklch(1 0 0);
  --color-surface-elevated: oklch(0.98 0 0);
  --color-text-primary: oklch(0.15 0 0);
  --color-text-secondary: oklch(0.4 0 0);
  --color-text-muted: oklch(0.6 0 0);
  --color-border: oklch(0.9 0 0);
  --color-border-strong: oklch(0.8 0 0);
}

/* Dark mode overrides */
@media (prefers-color-scheme: dark) {
  :root {
    --color-surface: oklch(0.15 0 0);
    --color-surface-elevated: oklch(0.2 0 0);
    --color-text-primary: oklch(0.95 0 0);
    --color-text-secondary: oklch(0.7 0 0);
    --color-text-muted: oklch(0.5 0 0);
    --color-border: oklch(0.25 0 0);
    --color-border-strong: oklch(0.35 0 0);
  }
}

/* For manual dark mode class/attribute */
.dark, [data-theme="dark"] {
  --color-surface: oklch(0.15 0 0);
  --color-surface-elevated: oklch(0.2 0 0);
  --color-text-primary: oklch(0.95 0 0);
  --color-text-secondary: oklch(0.7 0 0);
  --color-text-muted: oklch(0.5 0 0);
  --color-border: oklch(0.25 0 0);
  --color-border-strong: oklch(0.35 0 0);
}
```

Usage:
```html
<div class="bg-surface text-text-primary border-border">
  <!-- Automatically adapts to theme - NO dark: prefix needed! -->
</div>
```

### Color Consistency Checklist

When reviewing/writing Tailwind code, verify:

1. **Every color has a dark mode counterpart** — Either via `dark:` variant or semantic tokens
2. **Avoid hardcoded colors** — Use theme tokens, not arbitrary values like `bg-[#fff]`
3. **Check contrast ratios** — WCAG AA requires 4.5:1 for text, 3:1 for large text
4. **Test both modes** — Visually verify light AND dark mode
5. **Handle images/media** — Consider `dark:invert` or themed image variants

---

## Modern CSS Features in Tailwind v4

### Container Queries (Built-in, No Plugin!)

Components respond to their container's width instead of viewport:

```html
<div class="@container">
  <div class="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3 gap-4">
    <!-- Responds to container width, not viewport -->
  </div>
</div>

<!-- Named containers for nested scenarios -->
<div class="@container/card">
  <h2 class="text-sm @sm/card:text-base @lg/card:text-xl">Title</h2>
</div>

<!-- Max-width queries -->
<div class="block @max-md:hidden">Only shows in containers < md</div>

<!-- Arbitrary values -->
<div class="@[400px]:flex">Flexbox when container >= 400px</div>
```

### @starting-style (Enter/Exit Animations Without JS)

```css
/* In your CSS */
.dialog {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.3s, transform 0.3s, display 0.3s allow-discrete;
  
  @starting-style {
    opacity: 0;
    transform: translateY(1rem);
  }
}

.dialog[hidden] {
  opacity: 0;
  transform: translateY(1rem);
}
```

### 3D Transforms

```html
<div class="perspective-500">
  <div class="rotate-x-12 rotate-y-6 transform-3d">
    3D transformed element
  </div>
</div>
```

### Wide-Gamut P3 Colors

Tailwind v4's default palette uses OKLCH with P3 gamut support:

```css
@theme {
  /* Define P3 colors for vibrant displays */
  --color-accent: oklch(0.7 0.25 150); /* More vibrant than sRGB allows */
}
```

### `not-*` Variant

```html
<li class="not-last:border-b">Border on all except last item</li>
<input class="not-placeholder-shown:border-green-500" />
```

---

## Tailwind v4.1 Features (April 2025)

### Text Shadows

```html
<h1 class="text-shadow-sm">Subtle shadow</h1>
<h1 class="text-shadow-md text-shadow-black/20">Medium with color</h1>
<h1 class="text-shadow-lg text-shadow-primary-500/30">Large themed</h1>
```

Available sizes: `text-shadow-2xs`, `text-shadow-xs`, `text-shadow-sm`, `text-shadow-md`, `text-shadow-lg`

### Mask Utilities

```html
<!-- Fade to transparent at bottom -->
<div class="mask-linear-to-b">
  <img src="..." />
</div>

<!-- Radial mask from center -->
<div class="mask-radial">
  Content fades at edges
</div>
```

### Pointer/Input Method Detection

```html
<!-- Touch-specific styles (not just screen size!) -->
<button class="p-2 pointer-coarse:p-4">
  Larger tap target on touch devices
</button>

<!-- Fine pointer (mouse) specific -->
<div class="hidden pointer-fine:block">
  Hover-dependent UI
</div>
```

### Safe Alignment

Prevents content from being cut off in flex/grid:

```html
<div class="flex justify-center safe">
  <!-- Content won't disappear if container is too small -->
</div>
```

### Baseline Alignment

```html
<div class="flex items-baseline-last">
  <!-- Aligns to last line of text, useful for mixed-size content -->
</div>
```

---

## Animation & Transition Best Practices

### Built-in Animations

```html
<div class="animate-spin">Loading spinner</div>
<div class="animate-ping">Notification pulse</div>
<div class="animate-pulse">Skeleton loader</div>
<div class="animate-bounce">Attention indicator</div>
```

### Transitions

```html
<!-- Recommended: Use transition for interactive elements -->
<button class="bg-primary-500 hover:bg-primary-600 transition-colors duration-150">
  Click me
</button>

<!-- Multiple properties -->
<div class="opacity-0 hover:opacity-100 scale-95 hover:scale-100 transition duration-200 ease-out">
  Fade and scale on hover
</div>
```

### Respect Motion Preferences (CRITICAL for Accessibility)

```html
<!-- Disable animations for users who prefer reduced motion -->
<div class="animate-bounce motion-reduce:animate-none">
  Bounces unless user prefers reduced motion
</div>

<!-- Safe animations only -->
<div class="transition motion-reduce:transition-none">
  No transition for sensitive users
</div>
```

### Custom Animations via @theme

```css
@theme {
  --animate-slide-up: slide-up 0.3s ease-out;
  --animate-fade-scale: fade-scale 0.2s ease-out;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(1rem);
  }
}

@keyframes fade-scale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
}
```

---

## React/Next.js Integration

### Vite + React Setup

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  /* Your theme customizations */
}
```

### Next.js Setup

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

```css
/* app/globals.css */
@import "tailwindcss";
```

### Install Commands

```bash
# Vite
npm install tailwindcss @tailwindcss/vite

# Next.js
npm install tailwindcss @tailwindcss/postcss
```

---

## Migration from v3 Checklist

When reviewing code that might have v3 patterns:

1. **Remove tailwind.config.js** — Move to CSS @theme
2. **Replace @tailwind directives** — Use `@import "tailwindcss"`
3. **Update dark mode config** — Use @custom-variant instead of config
4. **Check color references** — v4 uses OKLCH-based palette
5. **Remove postcss-import/autoprefixer** — Built into v4
6. **Use @tailwindcss/vite** for Vite projects
7. **Run upgrade tool**: `npx @tailwindcss/upgrade`

**Browser support:** v4 requires Safari 16.4+, Chrome 111+, Firefox 128+

---

## Quick Reference

| Feature | Tailwind v4 Syntax |
|---------|-------------------|
| Dark mode | `dark:bg-gray-900` or semantic tokens |
| Container query | `@container` + `@md:flex` |
| Text shadow | `text-shadow-md text-shadow-black/20` |
| Mask | `mask-linear-to-b` |
| Touch detection | `pointer-coarse:p-4` |
| Reduced motion | `motion-reduce:animate-none` |
| Theme variable | `@theme { --color-brand: ... }` |
| Custom dark variant | `@custom-variant dark (&:where(.dark, .dark *))` |

---

## Documentation Links

- **Theme Variables:** https://tailwindcss.com/docs/theme
- **Dark Mode:** https://tailwindcss.com/docs/dark-mode
- **Container Queries:** https://tailwindcss.com/docs/container-queries
- **Animations:** https://tailwindcss.com/docs/animation
- **Upgrade Guide:** https://tailwindcss.com/docs/upgrade-guide
- **v4.0 Release:** https://tailwindcss.com/blog/tailwindcss-v4
- **v4.1 Release:** https://tailwindcss.com/blog/tailwindcss-v4-1
