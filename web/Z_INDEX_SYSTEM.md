# Z-Index System

> **Official guide:** `~/.arman/rules/nextjs-best-practices/nextjs-guide.md` — Section 11 covers the semantic z-index architecture pattern. This document covers project-specific z-index assignments and safe area utilities.

This document defines the z-index hierarchy used across the application to ensure proper layering and prevent positioning bugs.

## The Problem We Solved

On Android devices with `interactiveWidget: "resizes-content"` viewport setting, fixed-position elements need proper z-index management to avoid:
- Notifications hiding behind headers
- Modals appearing under navigation
- Overlays not properly covering content

## Z-Index Scale

Defined in `web/src/app/globals.css`:

```css
:root {
  --z-base: 0;           /* Default page content */
  --z-dropdown: 10;      /* Dropdowns, tooltips (inline) */
  --z-sticky: 20;        /* Sticky headers, navigation */
  --z-fixed: 30;         /* Fixed bottom nav, floating inputs */
  --z-modal-backdrop: 40; /* Modal backdrop overlays */
  --z-modal: 50;         /* Modal dialogs */
  --z-popover: 60;       /* Popovers, context menus */
  --z-toast: 70;         /* Toast notifications */
  --z-tooltip: 80;       /* Tooltips (floating) */
  --z-notification: 90;  /* System notifications (update banner) */
  --z-skip-link: 100;    /* Accessibility skip links */
}
```

## Usage

### In Components

Use inline styles to reference CSS variables:

```tsx
<div style={{ zIndex: 'var(--z-modal)' }}>
  Modal content
</div>
```

### Why Not Tailwind Classes?

Tailwind's `z-50`, `z-40` etc. use hardcoded values. CSS variables allow:
- Centralized management
- Easy global adjustments
- Semantic naming
- Better maintainability

## Component Mapping

| Component | Z-Index Variable | Value | Location |
|-----------|-----------------|-------|----------|
| Page content | `--z-base` | 0 | Default |
| Dropdown menus | `--z-dropdown` | 10 | Inline menus |
| Header (public) | `--z-sticky` | 20 | `Header.tsx` |
| AppHeader | `--z-sticky` | 20 | `AppHeader.tsx` |
| Bottom Navigation | `--z-fixed` | 30 | `GlassBottomNav.tsx` |
| Message Input | `--z-fixed` | 30 | `MessageInput.tsx` |
| Modal Backdrop | `--z-modal-backdrop` | 40 | `ConfirmModal.tsx`, etc. |
| Modal Content | `--z-modal` | 50 | All modal components |
| Update Banner | `--z-notification` | 90 | `UpdateBanner.tsx` |
| Skip Links | `--z-skip-link` | 100 | `AppHeader.tsx` |

## Migration Guide

When creating new components:

1. **Identify the layer type** - Is it a modal, fixed element, notification, etc.?
2. **Use the appropriate variable** - Reference the scale above
3. **Apply via inline style** - `style={{ zIndex: 'var(--z-modal)' }}`
4. **Remove Tailwind z-classes** - Don't use `z-50`, `z-40` etc.

### Example Migration

**Before:**
```tsx
<div className="fixed inset-0 z-50 bg-black/50">
  Modal backdrop
</div>
```

**After:**
```tsx
<div 
  className="fixed inset-0 bg-black/50"
  style={{ zIndex: 'var(--z-modal-backdrop)' }}
>
  Modal backdrop
</div>
```

## Safe Area Handling

Added utility classes for safe area insets:

```css
.pt-safe { padding-top: env(safe-area-inset-top); }
.pb-safe { padding-bottom: env(safe-area-inset-bottom); }
```

Use these on fixed-position elements at screen edges:

```tsx
<div className="fixed top-0 left-0 right-0 pt-safe">
  Top banner
</div>
```

## Testing

After changes, verify:

1. **Update banner appears above header** - Check on Android
2. **Modals cover all content** - Including fixed navigation
3. **Skip links work** - Tab to focus, should be topmost
4. **No z-fighting** - Elements at same level don't flicker

## Related Files

- `web/src/app/globals.css` - Z-index variable definitions
- `web/src/components/UpdateBanner.tsx` - System notification example
- `web/src/components/layout/AppHeader.tsx` - Sticky header example
- `web/src/components/chat/MessageInput.tsx` - Fixed input example
