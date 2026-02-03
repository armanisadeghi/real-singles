# Glass Components Reference

iOS 26 "Liquid Glass" effect components for the RealSingles web application.

## Available Components

All glass components are exported from `@/components/glass`:

```tsx
import {
  GlassContainer,
  GlassBottomNav,
  GlassTabs,
  GlassDropdown,
  GlassDropdownItem,
  GlassDropdownDivider,
  GlassSearch,
  GlassCard,
  GlassCardHeader,
  GlassBadge,
} from "@/components/glass";
```

---

## Component Reference

### GlassContainer

Base wrapper for liquid glass effects. Use for custom glass elements.

```tsx
<GlassContainer variant="card" className="p-4">
  <p>Content with glass effect</p>
</GlassContainer>
```

**Variants:**
| Variant | Use Case | Corner Radius |
|---------|----------|---------------|
| `nav` | Bottom navigation dock | 24px |
| `tabs` | Tab navigation | 999px (pill) |
| `card` | Cards, CTAs, featured sections | 20px |
| `menu` | Dropdown menus | 16px |
| `search` | Search inputs | 999px (pill) |
| `chatInput` | Message input bar | 24px |

**Props:**
- `variant`: Glass preset (default: `"card"`)
- `mode`: LiquidGlass mode - `"standard"` | `"polar"` | `"prominent"` | `"shader"` (default: `"prominent"`)
- `className`: Additional CSS classes
- `style`: Inline styles

---

### GlassBottomNav

Floating pill-shaped bottom navigation dock. **Already integrated in app layout.**

**Note:** Uses CSS glassmorphism instead of LiquidGlass because SVG filters break `position: fixed`.

```tsx
// In layout.tsx - already implemented
<GlassBottomNav />
```

**Features:**
- Floating position (detached from screen edges)
- 5 tabs: Discover, Explore, Likes, Messages, Profile
- Auto-hides on full-screen views (Discover, Chat)
- Safe area padding for notched devices

---

### GlassTabs

Pill-style tab navigation with glass background.

```tsx
import { GlassTabs, type Tab } from "@/components/glass";

const tabs: Tab[] = [
  { id: "likes", label: "Likes You", badge: 3 },
  { id: "sent", label: "Likes Sent" },
  { id: "matches", label: "Matches" },
];

<GlassTabs
  tabs={tabs}
  activeTab={activeTab}
  onChange={(id) => setActiveTab(id)}
/>
```

**Props:**
- `tabs`: Array of `{ id: string; label: string; badge?: number }`
- `activeTab`: Currently selected tab ID
- `onChange`: Callback when tab changes
- `className`: Additional CSS classes

---

### GlassDropdown

Glass-effect dropdown menu container.

```tsx
import {
  GlassDropdown,
  GlassDropdownItem,
  GlassDropdownDivider,
} from "@/components/glass";

<GlassDropdown isOpen={isOpen}>
  <GlassDropdownItem onClick={handleProfile} icon={User}>
    Profile
  </GlassDropdownItem>
  <GlassDropdownItem onClick={handleSettings} icon={Settings}>
    Settings
  </GlassDropdownItem>
  <GlassDropdownDivider />
  <GlassDropdownItem onClick={handleLogout} icon={LogOut} destructive>
    Log out
  </GlassDropdownItem>
</GlassDropdown>
```

**GlassDropdown Props:**
- `isOpen`: Controls visibility
- `className`: Additional CSS classes

**GlassDropdownItem Props:**
- `onClick`: Click handler
- `icon`: Lucide icon component (optional)
- `destructive`: Red styling for destructive actions
- `disabled`: Disabled state

---

### GlassSearch

Spotlight-style search input with glass effect.

```tsx
import { GlassSearch } from "@/components/glass";

<GlassSearch
  value={query}
  onChange={setQuery}
  placeholder="Search messages..."
  showShortcut // Shows ⌘K hint
/>
```

**Props:**
- `value`: Search query
- `onChange`: Query change handler
- `onSubmit`: Form submit handler (optional)
- `placeholder`: Placeholder text
- `showShortcut`: Show keyboard shortcut hint
- `autoFocus`: Auto-focus on mount
- `className`: Additional CSS classes

---

### GlassCard

Glass-effect card for CTAs, featured content, and info sections.

```tsx
import { GlassCard, GlassCardHeader, GlassBadge } from "@/components/glass";

<GlassCard>
  <GlassCardHeader>
    <h3>Boost Your Profile</h3>
    <GlassBadge>Premium</GlassBadge>
  </GlassCardHeader>
  <p>Get seen by more people...</p>
</GlassCard>

// As a link
<GlassCard href="/premium" withBorder>
  <p>Upgrade now</p>
</GlassCard>

// As a button
<GlassCard onClick={handleClick}>
  <p>Click me</p>
</GlassCard>
```

**GlassCard Props:**
- `withBorder`: Add subtle border
- `withPadding`: Add default padding (default: true)
- `href`: Make card a link
- `onClick`: Make card a button
- `className`: Additional CSS classes

---

## When to Use Glass vs CSS Glassmorphism

### Use GlassContainer (LiquidGlass)

For elements that are **NOT fixed-positioned**:
- Dropdowns and menus
- Tab navigation
- Cards and CTAs
- Search bars (when not fixed)
- Modal content

**Why:** Full liquid glass effect with edge refraction

### Use CSS Glassmorphism

For **fixed-positioned** elements:
- Bottom navigation dock
- Fixed headers
- Floating input bars
- Toast notifications

**Why:** SVG displacement filters break `position: fixed`

**CSS Pattern (with dark mode):**
```tsx
<div className={cn(
  "rounded-3xl overflow-hidden",
  "bg-white/80 dark:bg-neutral-900/80",
  "backdrop-blur-xl backdrop-saturate-150",
  "border border-white/30 dark:border-white/10",
  "shadow-lg shadow-black/10 dark:shadow-black/30"
)}>
  {children}
</div>
```

---

## Dark Mode Support

All glass components support dark mode automatically via `prefers-color-scheme`.

### Glass Color Mappings

| Light Mode | Dark Mode | Usage |
|------------|-----------|-------|
| `bg-white/80` | `dark:bg-neutral-900/80` | Glass background |
| `bg-white/95` | `dark:bg-neutral-900/95` | Solid glass background |
| `border-white/30` | `dark:border-white/10` | Glass border |
| `border-white/20` | `dark:border-white/10` | Subtle glass border |
| `shadow-black/10` | `dark:shadow-black/30` | Glass shadow |
| `hover:bg-white/40` | `dark:hover:bg-white/10` | Hover states |

### Component-Specific Dark Mode

**GlassBottomNav:**
```tsx
// Already implemented with dark mode
className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl"
className="border-white/30 dark:border-white/10"
className="shadow-black/10 dark:shadow-black/30"
// Active tab: bg-white/90 dark:bg-white/20
// Inactive tab: text-gray-600 dark:text-gray-400
```

**GlassDropdown Items:**
```tsx
// Text colors
className="text-gray-700 dark:text-gray-300"
// Hover states
className="hover:bg-white/40 dark:hover:bg-white/10"
// Destructive items
className="text-red-600 dark:text-red-400"
className="hover:bg-red-50/50 dark:hover:bg-red-900/30"
```

**GlassCard Content:**
```tsx
// Text inside glass cards
className="text-gray-900 dark:text-gray-100"     // Primary
className="text-gray-600 dark:text-gray-400"     // Secondary
className="text-gray-500 dark:text-gray-400"     // Muted
```

---

## Accessibility Considerations

### Reduced Motion

The glass utilities respect `prefers-reduced-motion`:

```tsx
// In glass-utils.ts - automatic handling
const reducedMotion = useReducedMotion();
// Falls back to simpler effects when motion is reduced
```

### Mobile Performance

Glass effects automatically reduce displacement on mobile:

```tsx
// Automatic mobile optimization
const isMobile = useIsMobile();
// Uses mobileGlassPresets with lower displacement values
```

### Contrast

Glass effects can reduce text contrast. Always ensure:
- Text has sufficient contrast against blurred backgrounds
- Light mode: Use `text-gray-900` or darker for readability
- Dark mode: Use `text-gray-100` or lighter for readability
- Consider adding `bg-white/50 dark:bg-black/30` backdrop to text containers

---

## Examples

### Featured CTA Card

```tsx
<GlassCard withBorder className="text-center p-6">
  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
    <Sparkles className="w-8 h-8 text-white" />
  </div>
  <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">
    Boost Your Profile
  </h3>
  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
    Get seen by 10x more people
  </p>
  <button className="w-full py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-medium">
    Boost Now
  </button>
</GlassCard>
```

### Filter Tabs

```tsx
const filterTabs: Tab[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread", badge: unreadCount },
  { id: "online", label: "Online" },
];

<GlassTabs
  tabs={filterTabs}
  activeTab={filter}
  onChange={setFilter}
  className="mb-4"
/>
```

### Dropdown Menu

```tsx
{isMenuOpen && (
  <GlassDropdown isOpen={isMenuOpen} className="absolute right-0 top-full mt-2 w-48">
    <GlassDropdownItem onClick={() => router.push("/profile")} icon={User}>
      View Profile
    </GlassDropdownItem>
    <GlassDropdownItem onClick={() => router.push("/settings")} icon={Settings}>
      Settings
    </GlassDropdownItem>
    <GlassDropdownDivider />
    <GlassDropdownItem onClick={handleSignOut} icon={LogOut} destructive>
      Sign Out
    </GlassDropdownItem>
  </GlassDropdown>
)}
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `web/src/components/glass/index.ts` | All exports |
| `web/src/components/glass/GlassContainer.tsx` | Base wrapper |
| `web/src/components/glass/GlassBottomNav.tsx` | Bottom dock |
| `web/src/components/glass/GlassTabs.tsx` | Tab navigation |
| `web/src/components/glass/GlassDropdown.tsx` | Menu dropdown |
| `web/src/components/glass/GlassSearch.tsx` | Search input |
| `web/src/components/glass/GlassCard.tsx` | Cards and CTAs |
| `web/src/components/glass/glass-utils.ts` | Presets and hooks |
