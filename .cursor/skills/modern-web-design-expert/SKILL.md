---
name: modern-web-design-expert
description: Ensures web implementations use cutting-edge 2026 CSS/JS patterns, responsive design best practices, and modern browser APIs. Use when implementing web UI features, reviewing web code for modern patterns, or when the user mentions responsive design, CSS features, web performance, animations, or modern web patterns. NEVER modifies mobile code or React Native implementations.
---

# Modern Web Design Expert

**Your job:** Make web implementations cutting-edge using 2026 CSS capabilities, modern browser APIs, and responsive design patterns that will remain modern for years to come.

---

## 2026 Design Philosophy

Modern web design in 2026 has evolved beyond rigid grids and sterile interfaces:

| Trend | Implementation |
|-------|----------------|
| **Humanized aesthetics** | Organic shapes, flowing gradients, intentional asymmetry over algorithmic sameness |
| **Intrinsic web design** | Layouts that adapt naturally using CSS capabilities, not just breakpoints |
| **Motion with intent** | Purposeful micro-interactions, scroll-driven animations—never gratuitous |
| **Native browser APIs first** | Popover, Dialog, Anchor Positioning before JS libraries |
| **Performance is UX** | INP < 200ms, LCP < 2.5s—fast interactions feel premium |

**Goal:** Build interfaces that look modern in 2029 because they use cutting-edge 2026 patterns.

---

## Rules You Must Follow

### Scope: Web-ONLY

| Action | Allowed |
|--------|---------|
| Modify `/web` code | ✅ Yes |
| Add modern CSS/JS patterns | ✅ Yes |
| Improve responsive layouts | ✅ Yes |
| Modify `/mobile` in any way | ❌ NEVER |
| Change shared API logic | ❌ NEVER |
| Remove mobile implementations | ❌ NEVER |

### When Unsure: Research First

Search for latest patterns: `"CSS [feature] 2026 browser support"` or `"Next.js 16 [pattern]"`

---

## Already Established (Quick Mentions)

The project already uses these patterns correctly—maintain them:

| Pattern | Status |
|---------|--------|
| Tailwind CSS v4.1 | ✅ Using latest with `@theme inline` |
| Next.js 16 + React 19 | ✅ Latest versions |
| lucide-react icons | ✅ Consistent icon library |
| CSS custom properties | ✅ Design tokens in `globals.css` |
| Dark mode via `prefers-color-scheme` | ✅ Implemented |
| Safe area insets (`env()`) | ✅ For iOS web |
| `h-dvh` / `min-h-dvh` | ✅ Dynamic viewport units |
| `backdrop-blur` effects | ✅ Glass morphism |
| 16px minimum input font | ✅ Prevents iOS zoom |
| `clsx` + `tailwind-merge` | ✅ Utility composition |

---

## NEW in 2025-2026: Priority Features

### 1. `@starting-style` for Entrance Animations (Baseline Aug 2024)

**Use for CSS-only entrance animations without JavaScript timing hacks.**

```css
/* Elements fade in when added to DOM or when display changes from none */
.card {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 300ms ease, transform 300ms ease;
  
  @starting-style {
    opacity: 0;
    transform: translateY(20px);
  }
}

/* For popovers and dialogs */
dialog[open] {
  opacity: 1;
  transform: scale(1);
  transition: opacity 200ms, transform 200ms;
  
  @starting-style {
    opacity: 0;
    transform: scale(0.95);
  }
}
```

**Benefits:** No `requestAnimationFrame` hacks, no class toggling, browser-optimized performance.

### 2. `@scope` for CSS Encapsulation (Baseline late 2024)

**True CSS encapsulation without BEM naming conventions.**

```css
/* Styles only apply between .card and .card-footer */
@scope (.card) to (.card-footer) {
  p { margin-bottom: 1rem; }
  a { color: var(--brand-primary); }
}

/* Inline scoped styles */
<style>
  @scope {
    p { /* Only affects siblings in this scope */ }
  }
</style>
```

**Use for:** Component-specific styles, preventing CSS leakage in shared components.

### 3. OKLCH Color Space + `color-mix()` (Baseline 2023)

**Modern color manipulation—more perceptually uniform than RGB/HSL.**

```css
:root {
  /* Define brand colors in OKLCH for better manipulation */
  --brand-primary-oklch: oklch(55% 0.15 60);
  
  /* Generate variations automatically */
  --brand-primary-light: color-mix(in oklch, var(--brand-primary) 70%, white);
  --brand-primary-dark: color-mix(in oklch, var(--brand-primary) 70%, black);
  --brand-primary-muted: color-mix(in oklch, var(--brand-primary) 50%, transparent);
}

/* Hover states without hardcoding colors */
.button:hover {
  background: color-mix(in oklch, var(--brand-primary) 85%, black);
}
```

**Why OKLCH:** Colors mix naturally, accessible contrast is predictable, P3 wide-gamut support.

### 4. CSS Anchor Positioning (Safari 26, Chrome 125+)

**Position tooltips, popovers, and dropdowns without JavaScript.**

```css
.anchor-trigger {
  anchor-name: --my-anchor;
}

.tooltip {
  position: absolute;
  position-anchor: --my-anchor;
  top: anchor(bottom);
  left: anchor(center);
  translate: -50% 8px;
  
  /* Fallback positioning */
  position-try-fallbacks: flip-block, flip-inline;
}
```

**Note:** Use `@supports (anchor-name: --x)` with Floating UI fallback for now (~76% support).

### 5. `text-box-trim` & `text-box-edge` (Chrome Q1 2025)

**Eliminate unwanted vertical spacing in text elements.**

```css
.heading {
  text-box-trim: both;
  text-box-edge: cap alphabetic;
}

/* Precise optical alignment */
.icon-text {
  display: flex;
  align-items: center;
  
  span {
    text-box-trim: both;
    text-box-edge: cap alphabetic; /* Trim to cap height */
  }
}
```

**Use for:** Aligning icons with text, tight card layouts, precise vertical rhythm.

### 6. `light-dismiss` for `<dialog>` (Chrome 2025)

**Native click-outside-to-close behavior.**

```tsx
<dialog ref={dialogRef} closedby="any">
  {/* Clicking backdrop auto-closes */}
</dialog>
```

**Note:** Combine with `@starting-style` for entrance/exit animations.

---

## Core Modern CSS Features

### Container Queries (~92% support)

**Always use for component-level responsiveness.** Media queries are for page layout; container queries are for components.

```tsx
<div className="@container">
  <div className="flex flex-col @md:flex-row @md:gap-4">
    {/* Responds to container, not viewport */}
  </div>
</div>
```

| Use Container Queries | Use Media Queries |
|----------------------|-------------------|
| Cards, profile components | Page layouts |
| Reusable UI components | Navigation visibility |
| Widgets that appear in different contexts | Full-page responsive breakpoints |

### The `:has()` Selector (~95% support)

**Use for parent-based styling without JavaScript.**

```css
/* Style parent based on child state */
.form-group:has(input:focus) {
  border-color: var(--brand-primary);
}

/* Card with image gets different layout */
.card:has(img) {
  grid-template-rows: auto 1fr;
}

/* Conditional empty states */
.list:not(:has(li)) { display: none; }
```

### Subgrid (~90% support, up from 85%)

**Use for aligned nested grids—critical for bento layouts and profile cards.**

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.bento-card {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span 3; /* Align across 3 rows */
}
```

### Cascade Layers (~90% support)

**Tailwind v4 uses layers internally. Understand them for debugging.**

```css
@layer base, components, utilities;

@layer components {
  .card { /* Can be overridden by utilities */ }
}
```

---

## Intrinsic Web Design & Fluid Typography

### Intrinsic Responsiveness

**Reduce reliance on media queries.** Let CSS do the work.

```css
/* Fluid sizing with min/max/clamp */
.container {
  width: min(100% - 2rem, 1200px); /* Max 1200px, always has padding */
  margin-inline: auto;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
  gap: clamp(1rem, 3vw, 2rem);
}
```

### Fluid Typography

**Always use `clamp()` for responsive text.** Never use fixed font sizes with breakpoint overrides.

```css
/* Modern standards: 16-18px minimum body, larger heading scale */
html {
  font-size: clamp(16px, 1.2vw + 1rem, 20px);
}

h1 { font-size: clamp(2rem, 2.4rem + 1vw, 3.5rem); }
h2 { font-size: clamp(1.5rem, 1.25rem + 1.5vw, 2.5rem); }
h3 { font-size: clamp(1.25rem, 1rem + 1vw, 1.75rem); }

body {
  line-height: clamp(1.5, 1.45 + 0.15vw, 1.7);
}
```

**Tailwind approach:**
```tsx
<h1 className="text-[clamp(2rem,2.4rem+1vw,3.5rem)]">
  Fluid Heading
</h1>
```

### Variable Fonts

**Use variable fonts for performance and design flexibility.**

```tsx
// next/font with variable font
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  axes: ['opsz'], // Optical size axis
});
```

```css
/* Responsive weight based on screen size */
.heading {
  font-variation-settings: 'wght' clamp(500, 400 + 10vw, 700);
}
```

---

## Modern Animations

### `@starting-style` Entrance Animations (Priority!)

**Replace JavaScript animation triggers with pure CSS.**

```css
/* Cards animate in when added to DOM */
.profile-card {
  opacity: 1;
  transform: translateY(0) scale(1);
  transition: opacity 300ms ease-out, transform 300ms ease-out;
  
  @starting-style {
    opacity: 0;
    transform: translateY(16px) scale(0.98);
  }
}

/* Staggered animations with :nth-child */
.card:nth-child(1) { transition-delay: 0ms; }
.card:nth-child(2) { transition-delay: 50ms; }
.card:nth-child(3) { transition-delay: 100ms; }
```

### View Transitions API (Baseline late 2025)

**Use for smooth page transitions and element morphing.**

```tsx
function handleNavigation(url: string) {
  if (!document.startViewTransition) {
    router.push(url);
    return;
  }
  
  document.startViewTransition(() => {
    router.push(url);
  });
}
```

```css
/* Named transitions for specific elements */
.profile-card {
  view-transition-name: profile-card;
}

::view-transition-old(profile-card) {
  animation: fade-out 200ms ease-out;
}

::view-transition-new(profile-card) {
  animation: fade-in 200ms ease-in;
}
```

### Scroll-Driven Animations (~75% support)

**Use for scroll-linked effects without JavaScript.** GPU-accelerated, runs off main thread.

```css
@supports (animation-timeline: scroll()) {
  /* Progress bar grows as user scrolls */
  .scroll-progress {
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: var(--brand-primary);
    transform-origin: left;
    animation: grow-width linear;
    animation-timeline: scroll();
  }
  
  @keyframes grow-width {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }
  
  /* Fade in as element enters viewport */
  .fade-on-scroll {
    animation: fade-in linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 100%;
  }
}
```

**Best practice:** Use `linear` easing for scroll-driven (feels more responsive), use `@supports` for feature detection.

### Spring-Based Motion

**Match native iOS/Android feel with spring easing:**

```css
/* Overshoot spring - for buttons, cards */
.interactive {
  transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Smooth spring - for modals, sheets */
.modal {
  transition: transform 400ms cubic-bezier(0.32, 0.72, 0, 1);
}

/* Quick spring - for micro-interactions */
.toggle {
  transition: transform 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```

---

## Accessibility & User Preferences

### Motion Preferences (Critical!)

**Always respect `prefers-reduced-motion`:**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Tailwind:**
```tsx
<div className="transition-transform motion-reduce:transition-none motion-reduce:transform-none">
```

### Focus States

**Always use `focus-visible` over `focus`:**

```tsx
<button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2">
```

### Color Contrast & `contrast-color()` (Safari 26)

**Ensure WCAG AA compliance (4.5:1 for text, 3:1 for UI):**

```css
/* Browser auto-selects contrasting color */
.button {
  background: var(--brand-primary);
  color: contrast-color(var(--brand-primary)); /* Auto black or white */
}
```

**Fallback for now:**
```css
.button {
  color: oklch(from var(--brand-primary) calc(l < 0.6 ? 1 : 0) 0 0);
}
```

- Use browser DevTools contrast checker
- Test both light and dark modes
- Don't rely solely on color to convey meaning

### High Contrast Mode

```css
@media (prefers-contrast: more) {
  :root {
    --border: #000;
    --muted-foreground: #333;
  }
  
  .card {
    border-width: 2px;
  }
}
```

---

## Modern Browser APIs

### Popover API (Baseline 2024)

**Use native popovers instead of JavaScript libraries:**

```tsx
<button popovertarget="my-popover">Open Menu</button>

<div id="my-popover" popover>
  <ul>
    <li>Option 1</li>
    <li>Option 2</li>
  </ul>
</div>
```

**With `@starting-style` for animations:**
```css
[popover] {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 200ms, transform 200ms, display 200ms allow-discrete;
  
  @starting-style {
    opacity: 0;
    transform: translateY(-8px);
  }
}

[popover]:popover-open {
  /* Open state styles */
}
```

**Benefits:** Automatic top-layer, light-dismiss, focus management, accessibility.

### Dialog Element with Light Dismiss

**Always use `<dialog>` for modals:**

```tsx
const dialogRef = useRef<HTMLDialogElement>(null);

<dialog 
  ref={dialogRef} 
  className="backdrop:bg-black/50 rounded-xl"
  closedby="any" // NEW: light-dismiss in Chrome 2025
>
  <form method="dialog">
    <button>Close</button>
  </form>
</dialog>

// Show as modal
dialogRef.current?.showModal();
```

**With entrance animation:**
```css
dialog[open] {
  opacity: 1;
  transform: scale(1);
  transition: opacity 200ms, transform 200ms;
  
  @starting-style {
    opacity: 0;
    transform: scale(0.95);
  }
}

dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}
```

### `moveBefore()` for State-Preserving DOM Moves (Chrome 2025)

**Move elements without losing state (iframes, focus, animations):**

```tsx
// Move element while preserving its state
parentElement.moveBefore(elementToMove, referenceElement);

// Use case: Reordering items in a list without iframe reload
// Use case: Moving focus target without losing focus
```

---

## Responsive Design Patterns

### Breakpoint Strategy

| Breakpoint | Width | Target |
|------------|-------|--------|
| Default | < 640px | Mobile phones |
| `sm` | 640px+ | Large phones |
| `md` | 768px+ | Tablets, small laptops |
| `lg` | 1024px+ | Laptops |
| `xl` | 1280px+ | Desktops |
| `2xl` | 1536px+ | Large desktops |

**Mobile-first always:**
```tsx
// ✅ Correct: mobile default, larger screens override
<div className="flex flex-col md:flex-row lg:gap-8">

// ❌ Wrong: desktop-first
<div className="flex flex-row md:flex-col">
```

### Bento Grid Layouts (2026 Trend)

**Modern card layouts with varied sizes:**

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[minmax(150px,auto)]">
  <article className="col-span-2 row-span-2 rounded-2xl">
    {/* Large featured card */}
  </article>
  <article className="rounded-2xl">
    {/* Small card */}
  </article>
  <article className="rounded-2xl">
    {/* Small card */}
  </article>
  <article className="col-span-2 rounded-2xl">
    {/* Wide card */}
  </article>
</div>
```

**Bento styling:**
- Rich border-radius on outer edges (16-24px)
- Generous white space between cards
- Consistent gap sizing with `clamp()`
- Cards have subtle shadows, not heavy borders

### Touch Targets

**Minimum 44×44px for all interactive elements:**

```tsx
<button className="min-h-[44px] min-w-[44px] p-3">
  <Icon className="w-5 h-5" />
</button>
```

### Safe Area Insets

**Already implemented. Maintain this pattern:**

```tsx
// Bottom navigation
<nav className="pb-[env(safe-area-inset-bottom)]">

// Fixed bottom buttons
<div className="pb-[calc(env(safe-area-inset-bottom)+12px)]">
```

---

## Performance (Core Web Vitals 2026)

### Metrics (Now Baseline with Safari 26.2)

| Metric | Target | Measurement |
|--------|--------|-------------|
| LCP (Largest Contentful Paint) | < 2.5s | Time until largest element renders |
| INP (Interaction to Next Paint) | < 200ms | Responsiveness to user input |
| CLS (Cumulative Layout Shift) | < 0.1 | Visual stability |

**INP is critical:** Slow interactions feel broken. Use `useTransition` for non-urgent updates:

```tsx
const [isPending, startTransition] = useTransition();

function handleClick() {
  startTransition(() => {
    // Non-blocking update
    setItems(newItems);
  });
}
```

### Image Optimization

**Always use Next.js Image component:**

```tsx
import Image from 'next/image';

<Image
  src={url}
  alt=""
  width={400}
  height={300}
  sizes="(max-width: 768px) 100vw, 400px"
  loading="lazy" // Default for below-fold
  priority // Only for above-fold hero images
  placeholder="blur" // If you have blurDataURL
/>
```

**For galleries/grids, use `sizes` properly:**
```tsx
sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
```

### Font Loading

**Current setup is good.** Maintain `next/font` with `display: swap`:

```tsx
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});
```

### `content-visibility` for Long Lists (Baseline 2024)

**Skip rendering off-screen content:**

```css
.card {
  content-visibility: auto;
  contain-intrinsic-size: 0 300px; /* Estimated height */
}
```

**Use for:** Long scrolling lists, image galleries, comment sections.

---

## Component Patterns

### Cards with `@starting-style`

```tsx
<article className="@container group rounded-2xl bg-white shadow-sm hover:shadow-lg transition-shadow
  [&]:opacity-100 [&]:translate-y-0 
  [transition:opacity_300ms,transform_300ms,box-shadow_200ms]
  [@starting-style]:opacity-0 [@starting-style]:translate-y-4">
  <div className="relative aspect-[3/4] @md:aspect-[4/3] overflow-hidden rounded-t-2xl">
    <Image src={image} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
  </div>
  <div className="p-4 @md:p-6">
    <h3 className="text-[clamp(1rem,0.9rem+0.5vw,1.25rem)] font-semibold">
      {title}
    </h3>
  </div>
</article>
```

### Buttons

```tsx
<button className={cn(
  // Base
  "inline-flex items-center justify-center gap-2",
  "min-h-[44px] px-6 rounded-xl font-medium",
  // Transitions (spring easing)
  "transition-all duration-200",
  "[transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
  // Focus
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
  // Active (subtle press)
  "active:scale-[0.98]",
  // Disabled
  "disabled:opacity-50 disabled:cursor-not-allowed",
  // Motion preference
  "motion-reduce:transition-none",
  // Variant
  variant === "primary" && "bg-brand-primary text-white hover:bg-brand-primary-dark",
  variant === "secondary" && "bg-gray-100 text-gray-900 hover:bg-gray-200",
)}>
```

### Glass Effect (Frosted UI)

**Modern glassmorphism with proper layering:**

```tsx
<div className="
  bg-white/70 dark:bg-gray-900/70 
  backdrop-blur-xl backdrop-saturate-150 backdrop-brightness-105
  border border-white/20 dark:border-white/10
  rounded-2xl shadow-lg
">
```

**Tips:**
- Use `backdrop-saturate` and `backdrop-brightness` for richer effect
- Never use transparent backgrounds on stacked glass elements
- Layer with subtle shadows for depth

### Native Popover with Tooltip

```tsx
<div className="relative inline-block">
  <button 
    popovertarget="tooltip-1"
    popovertargetaction="toggle"
    className="p-2"
  >
    <InfoIcon className="w-5 h-5" />
  </button>
  
  <div 
    id="tooltip-1" 
    popover
    className="
      absolute bottom-full left-1/2 -translate-x-1/2 mb-2
      bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg
      [&]:opacity-100 [&]:translate-y-0
      [@starting-style]:opacity-0 [@starting-style]:translate-y-2
      [transition:opacity_150ms,transform_150ms,display_150ms_allow-discrete]
    "
  >
    Helpful information
  </div>
</div>
```

---

## Pre-Completion Checklist

### Modern Features
- [ ] `@starting-style` for entrance animations on dynamic content
- [ ] Container queries (`@container`) for reusable components
- [ ] Fluid typography with `clamp()` (no px with breakpoints)
- [ ] Native `<dialog>` for modals (not div-based)
- [ ] Native `popover` for dropdowns/tooltips where appropriate

### Responsive & Accessibility
- [ ] Tested at 320px, 768px, 1280px, 1920px widths
- [ ] Touch targets ≥ 44×44px
- [ ] `focus-visible` states on all interactive elements
- [ ] `prefers-reduced-motion` respected (`motion-reduce:` classes)
- [ ] Dark mode tested
- [ ] `prefers-contrast: more` considered for key UI

### Performance
- [ ] INP < 200ms (use `useTransition` for heavy state updates)
- [ ] LCP < 2.5s (above-fold images have `priority`)
- [ ] CLS < 0.1 (images have explicit dimensions)
- [ ] Images use Next.js `<Image>` with proper `sizes`
- [ ] Long lists use `content-visibility: auto`

### Project Rules
- [ ] Safe area insets for fixed elements
- [ ] Mobile code untouched
- [ ] Consistent design tokens used (not hardcoded colors)

---

## Browser Support Quick Reference

| Feature | Chrome | Safari | Firefox | Use Now? |
|---------|--------|--------|---------|----------|
| Container Queries | ✅ | ✅ | ✅ | ✅ Yes |
| `:has()` | ✅ | ✅ | ✅ | ✅ Yes |
| Subgrid | ✅ | ✅ | ✅ | ✅ Yes |
| `@layer` | ✅ | ✅ | ✅ | ✅ Yes |
| `@scope` | ✅ | ✅ | ✅ | ✅ Yes |
| `@starting-style` | ✅ | ✅ | ✅ | ✅ Yes |
| View Transitions | ✅ | ✅ | 🔜 | ✅ Progressive |
| Scroll Animations | ✅ | 🔜 | 🔜 | ⚠️ Progressive |
| Anchor Positioning | ✅ | ✅ | 🔜 | ⚠️ With fallback |
| Popover API | ✅ | ✅ | ✅ | ✅ Yes |
| `color-mix()` | ✅ | ✅ | ✅ | ✅ Yes |
| OKLCH | ✅ | ✅ | ✅ | ✅ Yes |
| `text-box-trim` | ✅ | 🔜 | 🔜 | ⚠️ Progressive |
| `contrast-color()` | 🔜 | ✅ | 🔜 | ⚠️ Not yet |

---

## Reference Files

| File | Purpose |
|------|---------|
| `web/src/app/globals.css` | Design tokens, theme variables |
| `web/src/components/navigation/BottomNavigation.tsx` | Mobile web navigation pattern |
| `web/src/components/ui/BottomSheet.tsx` | Responsive modal/sheet pattern |
| `web/src/components/discovery/ProfileCard.tsx` | Card component pattern |

---

## Quick Reference Links

- Tailwind v4: https://tailwindcss.com/docs
- Can I Use: https://caniuse.com
- MDN Web Docs: https://developer.mozilla.org
- Web.dev Baseline: https://web.dev/baseline
- Chrome DevTools: https://developer.chrome.com/docs/devtools
- CSS-Tricks Almanac: https://css-tricks.com/almanac
