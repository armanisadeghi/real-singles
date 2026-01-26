# Web Components Quick Reference

**Quick lookups for modern 2026 web development.** All packages pre-installed.

---

## NEW 2025-2026 CSS Features

### @starting-style (Entrance Animations)
```css
.element {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 300ms, transform 300ms;
  
  @starting-style {
    opacity: 0;
    transform: translateY(16px);
  }
}
```

### color-mix() (Dynamic Colors)
```css
:root {
  --hover: color-mix(in oklch, var(--brand-primary) 85%, black);
  --muted: color-mix(in oklch, var(--brand-primary) 40%, transparent);
}
```

### Native Popover
```html
<button popovertarget="menu">Open</button>
<div id="menu" popover>Content</div>
```

### Native Dialog
```tsx
<dialog ref={ref} className="backdrop:bg-black/50">
dialogRef.current?.showModal();
```

### Anchor Positioning
```css
.trigger { anchor-name: --anchor; }
.tooltip { 
  position-anchor: --anchor;
  top: anchor(bottom);
}
```

---

## Lucide Icons (1,500+ icons)

| Purpose | Icon | Filled Alternative |
|---------|------|-------------------|
| Home | `Home` | - |
| Search | `Search` | - |
| Heart/Like | `Heart` | Use `fill="currentColor"` |
| Chat | `MessageCircle` | `MessageSquare` |
| Profile | `User` | `UserCircle` |
| Settings | `Settings` | `Settings2` |
| Camera | `Camera` | - |
| Photo | `Image` | `ImagePlus` |
| Location | `MapPin` | - |
| Star | `Star` | Use `fill="currentColor"` |
| Bell | `Bell` | `BellRing` |
| Calendar | `Calendar` | `CalendarDays` |
| Clock | `Clock` | - |
| Share | `Share2` | `Share` |
| More | `MoreVertical` | `MoreHorizontal` |
| Close | `X` | `XCircle` |
| Back/Forward | `ChevronLeft` / `ChevronRight` | `ArrowLeft` / `ArrowRight` |
| Check | `Check` | `CheckCircle` / `CheckCircle2` |
| Add | `Plus` | `PlusCircle` |
| Edit | `Pencil` | `PenSquare` |
| Delete | `Trash2` | `Trash` |
| Filter | `Filter` | `SlidersHorizontal` |
| Video | `Video` | `VideoOff` |
| Phone | `Phone` | `PhoneCall` |
| Block | `Ban` | `ShieldOff` |
| Report | `Flag` | `AlertTriangle` |
| AI/Sparkle | `Sparkles` | `Wand2` |
| Premium | `Crown` | `Gem` |

**Usage:**
```tsx
import { Heart, Star, User } from "lucide-react";

<Heart className="w-6 h-6 text-pink-500" />
<Star className="w-6 h-6" fill="currentColor" /> {/* Filled */}
```

**Browse:** https://lucide.dev/icons

---

## Design Tokens (CSS Variables)

| Token | Light | Dark |
|-------|-------|------|
| `--background` | `#ffffff` | `#0a0a0a` |
| `--foreground` | `#333333` | `#ededed` |
| `--muted` | `#F5F5F5` | `#1a1a1a` |
| `--muted-foreground` | `#666666` | `#a0a0a0` |
| `--border` | `#E5E5E5` | `#2a2a2a` |
| `--brand-primary` | `#8F5924` | same |
| `--brand-primary-light` | `#A86B2D` | same |
| `--brand-primary-dark` | `#6B421B` | same |
| `--brand-secondary` | `#19C6B7` | same |

**Tailwind usage:**
```tsx
<div className="bg-background text-foreground border-border">
<button className="bg-brand-primary text-white">
```

---

## Tailwind v4 Container Queries

```tsx
// Container context
<div className="@container">
  
  // Respond to container width
  <div className="flex flex-col @sm:flex-row @md:gap-4 @lg:grid @lg:grid-cols-3">
  
  // Named container
  <div className="@container/card">
    <div className="@md/card:flex-row">
```

| Breakpoint | Width |
|------------|-------|
| `@xs` | 320px |
| `@sm` | 384px |
| `@md` | 448px |
| `@lg` | 512px |
| `@xl` | 576px |
| `@2xl` | 672px |

---

## Fluid Typography Presets

```css
/* Headings */
--text-h1: clamp(2rem, 1.5rem + 2vw, 3.5rem);
--text-h2: clamp(1.5rem, 1.25rem + 1.5vw, 2.5rem);
--text-h3: clamp(1.25rem, 1rem + 1vw, 1.75rem);
--text-h4: clamp(1.125rem, 1rem + 0.5vw, 1.5rem);

/* Body */
--text-body: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
--text-small: clamp(0.875rem, 0.85rem + 0.15vw, 1rem);
--text-xs: clamp(0.75rem, 0.7rem + 0.1vw, 0.875rem);

/* Line heights */
--leading-tight: clamp(1.2, 1.15 + 0.1vw, 1.3);
--leading-normal: clamp(1.5, 1.45 + 0.15vw, 1.7);
--leading-relaxed: clamp(1.6, 1.55 + 0.2vw, 1.8);
```

**Tailwind arbitrary values:**
```tsx
<h1 className="text-[clamp(2rem,1.5rem+2vw,3.5rem)]">
```

---

## Responsive Breakpoints

| Breakpoint | Tailwind | Width | Use For |
|------------|----------|-------|---------|
| Default | - | < 640px | Mobile phones |
| `sm` | `sm:` | ≥ 640px | Large phones, landscape |
| `md` | `md:` | ≥ 768px | Tablets |
| `lg` | `lg:` | ≥ 1024px | Laptops |
| `xl` | `xl:` | ≥ 1280px | Desktops |
| `2xl` | `2xl:` | ≥ 1536px | Large screens |

---

## Sizing Standards

| Element | Size |
|---------|------|
| Touch target minimum | 44×44px |
| Button height | 44-56px |
| Button padding | `px-4` to `px-6` |
| Button border radius | `rounded-xl` (12px) or `rounded-full` |
| Card border radius | `rounded-2xl` (16px) |
| Input height | 44-48px |
| Icon (inline) | 16-20px |
| Icon (button) | 20-24px |
| Icon (nav) | 24px |
| Avatar small | 32×32px |
| Avatar medium | 40×40px |
| Avatar large | 64×64px |
| Bottom nav height | 56px + safe area |
| Header height | 72px (var `--header-height`) |

---

## Animation Presets

| Animation | CSS | Tailwind |
|-----------|-----|----------|
| Fade in | `opacity 200ms ease-out` | `animate-in fade-in` |
| Slide up | `transform 300ms ease-out` | `animate-in slide-in-from-bottom` |
| Scale | `transform 200ms ease-out` | `transition-transform hover:scale-105` |
| Button press | `transform 100ms ease-out` | `active:scale-[0.98]` |

**Spring easing (natural feel):**
```css
transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

**Respect motion preferences:**
```tsx
<div className="transition-transform motion-reduce:transition-none">
```

---

## Common Patterns

### Glass Morphism
```tsx
<div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg">
```

### Card Hover
```tsx
<div className="group transition-all duration-300 hover:shadow-lg">
  <img className="group-hover:scale-105 transition-transform duration-300" />
</div>
```

### Focus Ring
```tsx
className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
```

### Gradient Text
```tsx
<span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
```

### Truncate with Ellipsis
```tsx
<p className="truncate">        {/* Single line */}
<p className="line-clamp-2">   {/* Multi-line */}
```

### Safe Area Bottom
```tsx
<div className="pb-[env(safe-area-inset-bottom)]">              {/* Basic */}
<div className="pb-[calc(env(safe-area-inset-bottom)+12px)]">   {/* With spacing */}
```

---

## Form Inputs

| Type | Attributes |
|------|------------|
| Email | `type="email" autoComplete="email"` |
| Password | `type="password" autoComplete="current-password"` |
| New Password | `type="password" autoComplete="new-password"` |
| Phone | `type="tel" autoComplete="tel"` |
| Name | `autoComplete="name" autoCapitalize="words"` |
| OTP | `type="text" inputMode="numeric" autoComplete="one-time-code"` |

**Always include:**
```tsx
<input 
  className="min-h-[44px] text-[16px]" // iOS zoom prevention
/>
```

---

## Modern CSS Features

### Container Query
```css
.wrapper { container-type: inline-size; }
@container (min-width: 400px) { .child { display: grid; } }
```

### :has() Selector
```css
.card:has(img) { grid-template-rows: auto 1fr; }
.form-group:has(:focus) { border-color: blue; }
```

### Subgrid
```css
.grid { display: grid; grid-template-columns: repeat(3, 1fr); }
.item { display: grid; grid-template-rows: subgrid; grid-row: span 2; }
```

### View Transition
```tsx
document.startViewTransition(() => router.push(url));
```

### Popover API
```html
<button popovertarget="menu">Open</button>
<div id="menu" popover>Content</div>
```

### Dialog Element
```tsx
<dialog ref={ref} className="backdrop:bg-black/50">
dialogRef.current?.showModal();
```

---

## Browser Support Check (Updated 2026)

| Feature | Support | Check |
|---------|---------|-------|
| Container Queries | ~95% | `@supports (container-type: inline-size)` |
| :has() | ~97% | `@supports selector(:has(*))` |
| Subgrid | ~90% | `@supports (grid-template-rows: subgrid)` |
| @starting-style | ~90% | `@supports (selector(@starting-style))` |
| @scope | ~85% | `@supports (selector(@scope))` |
| View Transitions | ~80% | `document.startViewTransition` |
| Popover API | ~90% | `HTMLElement.prototype.hasOwnProperty('popover')` |
| Scroll Animations | ~75% | `@supports (animation-timeline: scroll())` |
| Anchor Positioning | ~76% | `@supports (anchor-name: --x)` |
| color-mix() | ~95% | `@supports (color: color-mix(in oklch, red, blue))` |
| OKLCH | ~95% | `@supports (color: oklch(50% 0.1 180))` |

---

## Spring Easing Functions

```css
/* Overshoot (buttons, cards) */
cubic-bezier(0.34, 1.56, 0.64, 1)

/* Smooth (modals, sheets) */
cubic-bezier(0.32, 0.72, 0, 1)

/* Quick (micro-interactions) */
cubic-bezier(0.175, 0.885, 0.32, 1.275)

/* iOS-like */
cubic-bezier(0.25, 0.46, 0.45, 0.94)
```

---

## Intrinsic Layout Patterns

```css
/* Fluid container */
.container {
  width: min(100% - 2rem, 1200px);
  margin-inline: auto;
}

/* Responsive grid without media queries */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
  gap: clamp(1rem, 3vw, 2rem);
}

/* Fluid spacing */
padding: clamp(1rem, 3vw, 2rem);
```

---

## Imports

```tsx
// Icons
import { Heart, Star, User, X, Check } from "lucide-react";

// Utilities
import { cn } from "@/lib/utils";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Next.js
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

// React 19
import { useState, useEffect, useRef, useCallback, useTransition } from "react";
```

---

## Links

- Tailwind v4 Docs: https://tailwindcss.com/docs
- Lucide Icons: https://lucide.dev/icons
- Can I Use: https://caniuse.com
- MDN Web Docs: https://developer.mozilla.org
- Web.dev Baseline: https://web.dev/baseline
- Chrome DevTools: https://developer.chrome.com/docs/devtools
- CSS-Tricks Almanac: https://css-tricks.com/almanac
