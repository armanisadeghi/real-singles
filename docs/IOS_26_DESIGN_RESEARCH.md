# iOS 26 Liquid Glass Design System - Comprehensive Research

> **Research Date:** January 29, 2026
> **Sources:** WWDC 2025 coverage, Apple Developer Documentation, community developer analyses, CSS-Tricks, NN/g, MacStories, and various developer blogs
> **Purpose:** Deep reference for implementing iOS 26 Liquid Glass design patterns

---

## Table of Contents

1. [What is Liquid Glass?](#1-what-is-liquid-glass)
2. [Core Design Principles](#2-core-design-principles)
3. [Visual Properties & Optical Behavior](#3-visual-properties--optical-behavior)
4. [Components Using the Glass Effect](#4-components-using-the-glass-effect)
5. [Tab Bars - Floating Pill Design](#5-tab-bars---floating-pill-design)
6. [Navigation Bars](#6-navigation-bars)
7. [Context Menus, Action Sheets & Alerts](#7-context-menus-action-sheets--alerts)
8. [Sheets & Popovers](#8-sheets--popovers)
9. [Search Bar Patterns](#9-search-bar-patterns)
10. [Content Layout & Scroll Behavior](#10-content-layout--scroll-behavior)
11. [Corner Radius & Concentricity](#11-corner-radius--concentricity)
12. [Design Tokens & Spacing](#12-design-tokens--spacing)
13. [Light Mode vs Dark Mode](#13-light-mode-vs-dark-mode)
14. [Buttons & Controls](#14-buttons--controls)
15. [Keyboard Changes](#15-keyboard-changes)
16. [Typography Changes](#16-typography-changes)
17. [CSS Approximation Values](#17-css-approximation-values)
18. [Accessibility Adaptations](#18-accessibility-adaptations)
19. [Key Design Guidance Summary](#19-key-design-guidance-summary)

---

## 1. What is Liquid Glass?

Liquid Glass is Apple's new unified design language announced at WWDC 2025 on June 9, 2025. It is described as Apple's "broadest design update yet" and the most significant visual overhaul since iOS 7 in 2013.

**Definition:** A translucent material that reflects and refracts its surroundings, dynamically transforming to bring greater focus to content. It delivers vitality across controls, navigation, app icons, widgets, and more.

**Cross-platform rollout:** For the first time, the design extends uniformly across iOS 26, iPadOS 26, macOS Tahoe 26, watchOS 26, tvOS 26, and visionOS 26.

**Origin:** Apple's Craig Federighi said designers used the company's industrial design studios to fabricate physical glass of various opacities and lensing properties, so they could closely match the interface properties to those of real glass. The design draws from visionOS principles, bringing spatial glass metaphors to 2D screens.

**Key difference from Glassmorphism:** Liquid Glass is NOT standard glassmorphism. Standard glassmorphism uses frosted blur that scatters light. Liquid Glass uses **lensing** -- bending and concentrating light in real-time. Background content subtly bends through glass layers, simulating physical optics. It pays closer attention to how light bends, how edges fade softly, and how layers create depth.

---

## 2. Core Design Principles

### Three Guiding Principles

1. **Hierarchy:** Liquid Glass controls float above content as a distinct functional layer, creating depth while reducing visual complexity. Content sits at the bottom layer; glass controls float on top.

2. **Harmony:** The design balances hardware, content, and controls. Device shapes inform UI element design. Rounded forms follow natural touch patterns and are concentric with the curved corners of modern hardware.

3. **Consistency:** Universal design across all Apple platforms simplifies cross-platform development while maintaining coherence across different screen sizes.

### Material Philosophy

- Interfaces are composed of distinct layers that mimic physical materials like glass, with varying levels of translucency and blur
- Subtle shadows, overlays, and parallax effects create a sense of hierarchy and space without overwhelming the user
- Interactions are accompanied by smooth, physics-based animations that respond naturally to user input
- Interface elements adapt to their surroundings, changing appearance based on background content or system conditions
- Controls are crafted from Liquid Glass and act as a distinct functional layer that sits ABOVE apps
- They give way to content and dynamically morph as users need more options or move between parts of an app

### Where to Use Liquid Glass (Apple's Official Guidance)

**USE for:**
- Navigation bars and toolbars
- Tab bars and bottom accessories
- Floating action buttons
- Sheets, popovers, and menus
- Context-sensitive controls
- System-level alerts

**DO NOT USE for:**
- Content layers (lists, tables, media)
- Full-screen backgrounds
- Scrollable content areas
- Stacked glass layers (glass on glass is prohibited)

> "Liquid Glass is best reserved for the navigation layer that floats above the content of your app." -- Apple

---

## 3. Visual Properties & Optical Behavior

### Optical Characteristics

| Property | Description |
|----------|-------------|
| **Lensing** | Bends and concentrates light in real-time (vs. traditional blur that scatters light) |
| **Refraction** | Background content subtly bends through glass layers, simulating physical optics |
| **Specular Highlights** | Bright highlights that respond to device motion (gyroscope/accelerometer) |
| **Adaptive Shadows** | Shadows that create depth perception between foreground controls and background |
| **Translucency** | Soft transparency that reveals what is underneath a control |
| **Soft Gradients** | Subtle gradient treatments within glass surfaces |
| **Dynamic Lighting** | Realistic light diffusion and reflections that respond to context |

### Material Layers (Compositing)

Liquid Glass is composed of three internal layers:
1. **Highlight layer:** Light casting and movement (specular highlights that respond to device tilt)
2. **Shadow layer:** Depth separation between foreground and background
3. **Illumination layer:** Flexible material properties that adapt to background content

### Behavioral Properties

| Behavior | Description |
|----------|-------------|
| **Fluidity** | Gel-like flexibility with instant touch responsiveness |
| **Morphing** | Smooth transitions between control states (e.g., tab morphing into search field) |
| **Motion Responsiveness** | Highlights move with device motion on iOS/iPadOS, reinforcing realism |
| **Adaptivity** | Adjusts to content, color scheme (light/dark), and element size |
| **Expansion/Contraction** | Controls expand and shrink based on context (e.g., tab bars on scroll) |

### Three Glass Variants (API)

| Variant | Description | Use Case |
|---------|-------------|----------|
| `.regular` | Default medium transparency; balanced and legible | Most UI elements |
| `.clear` | High transparency; more visually rich | Media-rich backgrounds (requires dimming layer, bold foreground elements, non-compromised content) |
| `.identity` | No effect applied | Conditional disabling of glass |

---

## 4. Components Using the Glass Effect

All of the following system UI components now use Liquid Glass automatically when compiled with Xcode 26:

### Navigation Layer Components
- **Tab bars** -- Floating capsule/pill shape, collapsible on scroll
- **Navigation bars** -- Transparent background by default, glass material
- **Toolbars** -- Floating bars with rounded corners
- **Sidebars** -- Glass material on iPadOS/macOS

### Presentation Components
- **Sheets** -- Glass background, inset from edges at partial height
- **Action sheets** -- Glass floating panels instead of rigid gray boxes
- **Alerts/Dialogs** -- Glass material, morph out of presenting buttons
- **Popovers** -- Flow smoothly out of liquid glass controls
- **Menus/Context menus** -- Glass material, positioned for reachability
- **Activity views (Share sheets)** -- Repositioned lower on screen with glass treatment

### Control Components
- **Buttons** -- Capsule-shaped by default, circular for single actions
- **Segmented controls** -- More rounded, pill-shaped
- **Toggles/Switches** -- New reflections, brightness, and interactions
- **Sliders** -- Updated with glass material
- **Search bars** -- Moved to bottom of screen, glass container

### System Components
- **Dock** -- Multi-layer glass with specular highlights
- **App icons** -- Layered glass (foreground, mid-ground, background) with shimmer
- **Widgets** -- Crafted from multiple layers of Liquid Glass
- **Notifications** -- Transparent with liquid glass reflections
- **Keyboard** -- Semi-transparent with rounder buttons
- **Control Center** -- Glass treatment throughout

---

## 5. Tab Bars - Floating Pill Design

### Visual Changes from iOS 18

| Aspect | iOS 18 | iOS 26 |
|--------|--------|--------|
| **Shape** | Full-width bar spanning screen edge to edge | Floating capsule/pill, inset from edges |
| **Anchoring** | Fixed to bottom edge | Floats above content |
| **Background** | Opaque/semi-transparent bar | Liquid Glass translucent material |
| **Size** | Fixed width regardless of item count | Width adapts to number of items |
| **On Scroll** | Stays fixed | Shrinks/minimizes, expands on scroll-up |

### Collapse & Minimize Behavior

- **Default:** Tab bar is expanded showing all tab items with icons and labels
- **On scroll down:** Tab bar shrinks to a smaller minimized state showing only the active tab icon
- **On scroll up:** Tab bar fluidly expands back to full size
- **On tap of selected item:** Tab bar expands
- **On reaching top of page:** Tab bar auto-expands
- **Long press on minimized tab:** Allows swiping to instantly switch tabs
- **API:** `tabBarMinimizeBehavior` view modifier controls this behavior

### Search Tab (Separated)

- The search tab is visually separated from other tab items
- It has a **circular** shape (distinct from the capsule of other tabs)
- When tapped, it morphs via animation from the circle into a full search field at the bottom
- This placement improves reachability for one-handed use
- **Criticism:** The circular search tab looks more like an action button than a tab, breaking the predictability principle

### Accessory Views

- iOS 26 adds the ability to attach an **accessory view** above the tab bar
- When the tab bar minimizes, the accessory view moves next to the minimized tab button
- Intended for "global" UI that is not navigation (e.g., a media player bar)
- Available in both SwiftUI (`tabViewBottomAccessory`) and UIKit

### Space Efficiency

- Even in expanded state, iOS 26 tab bars take up less space than iOS 18
- A tab bar with only 2-3 items no longer looks empty -- it simply becomes a small capsule
- Content visually lives under the tab bar, making the safe area at the bottom more critical

---

## 6. Navigation Bars

### Visual Properties

- **Background:** Transparent by default in iOS 26 (was semi-opaque before)
- **Material:** Liquid Glass applied automatically
- **Position:** Floats above content instead of being anchored to the top edge
- **Button grouping:** System automatically separates toolbar/nav bar items into visual groups; each group shares a glass background
- **Image buttons:** By default, bar button items using images share the background with other image buttons

### Behavior

- Content scrolls behind the translucent navigation bar
- An automatic **edge effect** (soft blur/gradient) is applied where scroll views intersect with the safe area
- The edge effect ensures legibility of overlapping content in the bars
- Removes need for developers to set `UIBarAppearance` or `backgroundColor` -- these interfere with the glass appearance

### Developer Guidance

- Remove any background customization from navigation bars and toolbars
- The bar background is now transparent by default -- let the system handle it
- Do NOT use `UIBarAppearance` or `backgroundColor` as these fight the glass appearance
- Both `standardAppearance` and `scrollEdgeAppearance` must be configured if customizing at all

### Button Changes in Navigation Bars

- Top bar buttons are no longer integrated into the navbar itself
- They appear on a layer above with a Liquid Glass button effect
- "Done" buttons are replaced with circular checkmark buttons
- "Close" buttons are replaced with circular "X" buttons
- Text buttons are increasingly replaced by SF Symbol glyphs
- When text is used, it is always enclosed within a tappable shape

---

## 7. Context Menus, Action Sheets & Alerts

### Action Sheets

- **Previous (iOS 18):** Rigid, gray, opaque boxes at the bottom of the screen
- **iOS 26:** Appear like sheets of glass floating above content, lighter and more consistent
- Now appear where you are tapping (e.g., on the close icon) instead of always at the bottom
- Apple repositioned key menus so they appear lower on screen for Pro Max reachability
- Inset from screen edges with very rounded corner radii

### Alerts / Dialogs

- Now use Liquid Glass material
- Automatically morph out of their presenting buttons (smooth animation)
- Left-aligned text (moving away from center-aligned text for readability)
- System-imposed corner radii that cannot be freely overridden

### Context Menus / Popovers

- Flow smoothly out of liquid glass controls
- Drawing focus from the action to the presentation's content
- Glass material with translucent background
- Very rounded corner radii consistent with the system

### Notifications

- Completely transparent with liquid glass reflections
- Elongated pill-shape
- Lighter, more floating appearance

---

## 8. Sheets & Popovers

### Partial Height Sheets

- **Inset by default** with a Liquid Glass background
- At smaller heights, the bottom edges pull in, nesting concentrically with the curved edges of the display
- When transitioning to full height, the glass background gradually transitions from translucent to opaque and anchors to the screen edge
- Sheets can morph out of buttons that present them (smooth transition animation)
- Background dims more subtly than before

### Developer Notes

- Remove `presentationBackground` modifier and let the new glass material show through
- Use availability checks (`#available(iOS 26.0, *)`) to differentiate background configs across OS versions
- The system handles the glass material, corner radius, and inset behavior automatically

---

## 9. Search Bar Patterns

### Major Change: Bottom Placement

- In iOS 26, search bars are relocated to the **bottom** of the screen across most native apps
- This is the culmination of Apple's ergonomics research showing the bottom third of the display is easiest to reach on larger phones
- Apps affected: Settings, Notes, Messages, Mail, Apple Music, and more

### Two Search Patterns

#### 1. Toolbar Search (Bottom Bar)
- Search field presented in a Liquid Glass container at the bottom of the screen
- Appears alongside other bottom toolbar items
- Uses new SwiftUI `DefaultToolbarItem` with search kind and `ToolbarSpacer`

#### 2. Tab Bar Search (Circular Button)
- Search appears as a **separate circular button** in the tab bar
- Visually distinguished from other tab items
- When activated, morphs with animation from the circle into a full search field
- Search field remains at the bottom for reachability
- Can be minimized using `searchToolbarBehavior()` modifier if search is not the primary experience

### User Control

- In the Phone app: Can switch to "Classic" layout with search at top
- In Safari: Can move address/search bar to top via settings
- In Messages, Mail, Notes, Music: Search stays at bottom with no toggle

---

## 10. Content Layout & Scroll Behavior

### Full-Screen Feel

- Content extends edge-to-edge behind translucent bars
- Tab bars, navigation bars, and toolbars float above content
- This creates a more immersive, full-screen experience
- Content appears underneath the tab bar with a blurry overlay effect (default behavior)

### Scroll Edge Effect

iOS 26 introduces `scrollEdgeEffectStyle(_:for:)` for controlling how content fades at the edges where it meets translucent bars.

#### Two Edge Styles

| Style | Behavior | Use Case |
|-------|----------|----------|
| **`.soft`** (default) | Gradual blur/fade where content meets bars | General scrollable content |
| **`.hard`** | Sharp cutoff, no blur | Custom UI where you do not want underlap (e.g., a static label) |

- Different styles can be applied per edge (e.g., `.soft` at top, `.hard` at bottom)
- The effect becomes more pronounced when the tab bar minimizes during scrolling
- Applies in areas where the scroll view intersects with the safe area

### Tab Bar Minimization on Scroll

- When `tabBarMinimizeBehavior` is applied, the tab bar automatically minimizes when scrollable content is scrolled
- The blur/overlay effect from the tab bar's glass material is the default for scrollable containers
- Health app is cited as the reference example of this behavior

### Developer Best Practices

- Test for layout overlap between tab bar and scrollable content
- Use system colors and materials (not hard-coded values)
- Use `ToolbarItem(placement: .bottomBar)` to activate edge effects
- Use `.safeAreaInset(edge: .bottom)` to disable edge effects when needed
- Profile animations on older devices as translucent effects increase GPU load

---

## 11. Corner Radius & Concentricity

### The Rounded Corners Overhaul

iOS 26's biggest visual change is pervasive rounding of corners. Most components are significantly more rounded than iOS 18:

| Element | Shape |
|---------|-------|
| **Single buttons** | Circular (e.g., Control Center buttons) |
| **Navigation bars** | Pill-shaped / capsule |
| **Tab bars** | Capsule |
| **Toggles** | Elongated pill |
| **Notifications** | Elongated pill |
| **Cards** | More rounded corners |
| **Sheet edges** | Very rounded, concentric with display |
| **Table view cells** | Rounder corners |
| **Keyboard** | Round edges at top |
| **Menus/Alerts** | Very rounded, system-enforced radii |

### Corner Concentricity

Apple's major design concept for iOS 26 is **corner concentricity**: rounded corners where the curved portions of inner and outer shapes share the same center.

**How it works:**
- The corner radius of a child element is automatically calculated by subtracting the padding from the parent element's corner radius
- This ensures a visually consistent and nested appearance across all layers
- Examples: A button within a card, a bottom sheet adapting to the device screen corners

**API:**
```swift
// Concentric corners that adapt to container
RoundedRectangle(cornerRadius: .containerConcentric, style: .continuous)

// Or via glass effect
.glassEffect(.regular, in: .rect(cornerRadius: .containerConcentric))
```

**Available Shape Options for Glass:**
- `.capsule` (default for glass effects)
- `.circle`
- `.ellipse`
- `RoundedRectangle(cornerRadius: N)`
- `.rect(cornerRadius: .containerConcentric)`

### Specific Corner Radius Values (from community design systems)

| Element | Corner Radius |
|---------|---------------|
| Card containers | ~28pt |
| Pill / capsule shapes | 999pt (effectively capsule) |
| Sheet containers | ~34pt |
| Rounded rectangle buttons | ~12-20pt |
| Table view cell groups | More rounded than iOS 18 (system-enforced) |

**Note:** Apple does not publish exact pixel values for most built-in components. The system handles these dynamically and they should match `containerConcentric` alignment.

---

## 12. Design Tokens & Spacing

### Apple's Approach

Apple intentionally abstracts away specific blur/opacity/refraction values within the `glassEffect()` API. The system renders them dynamically. Apple does NOT publish exact token values -- the philosophy is that the system handles the material behavior for you.

### Community-Developed Design Tokens

The following token values come from the most-cited community design system for Liquid Glass (by Sanjay Nelagadde, Level Up Coding):

#### Radius Tokens

| Token | Value |
|-------|-------|
| Card | 28pt |
| Pill | 999pt (capsule) |
| Sheet | 34pt |

#### Spacing / Padding Tokens

| Token | Value |
|-------|-------|
| Card padding | 16pt all sides |
| Pill padding | 10pt top/bottom, 14pt leading/trailing |
| Icon button padding | 12pt |

#### Stroke Tokens

| Token | Value |
|-------|-------|
| Stroke width | 1pt |
| Subtle stroke opacity | 0.22 |
| Strong stroke opacity | 0.35 |

#### Shadow Tokens

| Token | Value |
|-------|-------|
| Shadow radius | 18pt |
| Shadow Y offset | 8pt |
| Shadow opacity | 0.18 |

#### Glass Level Tokens

| Level | Use Case |
|-------|----------|
| `chrome` | Toolbars, floating controls |
| `surface` | Cards, panels |
| `element` | Small buttons, chips |

### Spacing & Layout Changes in iOS 26

- Table view cells have rounder corners and are more spaced out and inset
- Groups are slightly more spacious than iOS 18
- Glyphs are slightly larger
- Elements are more spacious overall to accommodate increased roundedness
- Content under tab bars uses safe area with the glass blur overlay

### General Tint Opacity Guideline

- **20% opacity** is recommended for subtle tints, background overlays, and atmospheric visual effects that reinforce depth without clutter
- Tint with purpose: Use `.tint()` to convey semantic meaning (primary action, state), NOT decoration

---

## 13. Light Mode vs Dark Mode

### Behavioral Differences

| Aspect | Light Mode | Dark Mode |
|--------|------------|-----------|
| **Glass visibility** | Blends in more; less visible | Far more visible; frosted blur uses white base tint |
| **Glass intensity** | Amplifies the glossy effect | Softens the effect |
| **Text on glass** | Automatically receives vibrant treatment | Adjusted color/brightness/saturation |
| **Clear icons** | Dim the wallpaper beneath | Stay transparent with darker layers for legibility |

### Tinted vs Clear Options (iOS 26.1+)

Users can choose between two glass appearances in Settings > Display & Brightness > Liquid Glass:

| Option | Behavior |
|--------|----------|
| **Clear** | Standard Liquid Glass look (default) |
| **Tinted** | Increases opacity of glass elements, improves contrast |

- Tinted switches between light/dark shades depending on on-screen content
- Affects Lock Screen notifications and in-app menu/navigation bars
- Little effect on Control Center, App Library, or Home Screen icons

### Liquid Color (Custom Tinting)

- Users can tint the entire Liquid Glass interface with custom colors
- Can grab a dominant color from wallpaper, or use "Auto" to match iPhone hardware color
- Liquid Color interacts differently in Light vs Dark Mode

### Developer Guidance

- The glass material adapts to light or dark appearance automatically to maintain legibility
- Design first in Default Light, then adjust for Dark, Clear, and Tinted variants
- Only modify background hues between variants; foreground symbols should remain identical
- Use semantic colors (`systemBackground`, `label`, etc.) to ensure visual harmony

---

## 14. Buttons & Controls

### Button Shape Changes

- **Bordered buttons** now have a **capsule** shape by default (was squircle/rounded rectangle)
- **Single action buttons** are entirely **circular** (e.g., Control Center, Done, Close)
- "Done" buttons replaced with circular checkmark buttons
- "Close" buttons replaced with circular "X" buttons
- Text-only buttons increasingly replaced with SF Symbol glyphs
- When text is used, it is always enclosed within a tappable shape

### Button Styles (SwiftUI API)

```
.buttonStyle(.glass)          -- Secondary actions
.buttonStyle(.glassProminent) -- Primary actions
```

### Interactive Behavior

When pressed, glass buttons animate with:
- A highlighted and "elevated" state
- Scaling effect
- Bounce animation
- Shimmer effect
- Touch-point illumination

### Toggles & Switches

- Elongated pill shape
- New reflections, brightness, and interactions
- Natively adopt the glass material's visual consistency

---

## 15. Keyboard Changes

- Complete visual overhaul: semi-transparent background
- Rounder buttons (no longer 3D drop-shadow effect)
- Keys use SF Compact Display font
- Soft rounded edges with translucency (glass-like vibe)
- Round edges at the top of the keyboard
- Keys are closer together (narrower horizontal margins near screen edges)
- "Done" button above keyboard replaced with a contextual button that changes icon based on state
- Applies automatically when developer recompiles with Xcode 26
- No user-facing option to revert to old keyboard style

---

## 16. Typography Changes

- Apple moving away from **center-aligned text** toward **left-aligned text** in components like alerts and onboarding sheets
- Left-aligned text is easier to read, especially for longer paragraphs
- Default system font remains **San Francisco** at **17pt** default size
- SF Compact Display used for keyboard keys
- Text within glass effects automatically receives **vibrant treatment** with adjusted color, brightness, and saturation for legibility

---

## 17. CSS Approximation Values

For web implementations approximating Liquid Glass, these are the commonly cited values from multiple sources:

### Background Properties

| Property | Value |
|----------|-------|
| Background color | `rgba(255, 255, 255, 0.10)` to `rgba(255, 255, 255, 0.15)` |
| Border | `1px solid rgba(255, 255, 255, 0.8)` (light mode) |
| Border radius | 60px for pills, 16-28px for cards |

### Filter Properties

| Property | Value Range |
|----------|-------------|
| `backdrop-filter: blur()` | `blur(0.25px)` to `blur(2px)` for lensing; `blur(4px)` for heavier frost |
| `backdrop-filter: saturate()` | `saturate(110%)` to `saturate(180%)` |
| `filter: brightness()` | `brightness(105%)` to `brightness(150%)` |
| `filter: contrast()` | `contrast(1.2)` |

### SVG Filter Values (for lensing/distortion)

| SVG Filter | Values |
|------------|--------|
| `feGaussianBlur stdDeviation` | `6` (for frosted glass) or `0.02` (for subtle lensing) |
| `feColorMatrix type="saturate"` | `5.4` |
| `feTurbulence baseFrequency` | `0.008 0.008` |
| `feTurbulence numOctaves` | `2` |
| `feDisplacementMap scale` | `55` to `77` |

### Recommended CSS Custom Properties

```css
--glass-bg: rgba(255, 255, 255, 0.12);
--glass-border: 1px solid rgba(255, 255, 255, 0.3);
--glass-blur: blur(2px) saturate(180%);
--glass-radius-pill: 60px;
--glass-radius-card: 28px;
--glass-radius-sheet: 34px;
--glass-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
--glass-stroke-subtle: rgba(255, 255, 255, 0.22);
--glass-stroke-strong: rgba(255, 255, 255, 0.35);
```

**Important note:** These are approximations. The real iOS Liquid Glass uses GPU-accelerated lensing and refraction that cannot be perfectly replicated in CSS. The key distinction is that Apple uses light **bending** (lensing), not just light **scattering** (blur).

---

## 18. Accessibility Adaptations

### System Settings That Modify Glass

| Setting | Effect on Liquid Glass |
|---------|------------------------|
| **Reduce Transparency** | Removes frosted blur; replaces with solid, darker surfaces |
| **Increase Contrast** | Applies stark borders and increases opacity |
| **Reduce Motion** | Tones down lensing animations and device-motion highlights |
| **iOS 26.1 Tinted option** | User-controlled opacity increase for glass elements |

### Automatic Adaptations (No Code Required)

The system automatically handles:
- Reducing frosting for "Reduced Transparency" setting
- Increasing contrast and applying stark borders for "Increase Contrast"
- Toning down animations under "Reduce Motion"
- Supporting user-controlled opacity in iOS 26.1+ Settings

### Known Accessibility Concerns

- Liquid Glass relies heavily on what is behind it; looks great on Apple's default wallpapers but can be problematic on random user wallpapers
- Translucent elements can make text and UI harder to see for users with low vision
- UI elements can feel "invisible" -- one of the oldest usability findings is that anything placed on top of something else becomes harder to see
- Light mode amplifies glass effects more than dark mode, potentially causing more visibility issues
- The glass effect is stronger in Light Mode; Dark Mode tones it down

---

## 19. Key Design Guidance Summary

### The Golden Rules

1. **Glass is for navigation, not content.** Never apply Liquid Glass to lists, tables, or media content.
2. **Never stack glass on glass.** Use `GlassEffectContainer` when multiple glass elements need to coexist.
3. **Let the system handle it.** Remove custom backgrounds, `UIBarAppearance`, and `backgroundColor` from navigation bars and toolbars.
4. **Use concentric corners.** Align inner element corners concentrically with their containers and with device hardware corners.
5. **Tint selectively.** Use `.tint()` only to convey semantic meaning (primary action, state), not for decoration.
6. **Design for both modes.** Design first in Default Light, then adjust for Dark, Clear, and Tinted.
7. **Use semantic colors.** Avoid hard-coded color values; use `systemBackground`, `label`, etc.
8. **Respect safe areas.** Content lives under translucent bars -- do not place critical UI where it will fight with glass highlights.
9. **Test on real devices.** The glass effect responds to device motion and actual wallpapers, which cannot be simulated.
10. **Profile performance.** Translucent effects increase GPU load; test animations on older devices.

### What Happens Automatically (When Using Native Components)

Apps get all of this for free when recompiled with Xcode 26:
- Tab bars become floating glass pills with collapse behavior
- Navigation bars become transparent with glass material
- Toolbars float with glass backgrounds
- Sheets use glass material with inset behavior
- Alerts and action sheets morph from presenting buttons
- Buttons adopt capsule shape with glass styling
- Scroll edge effects apply where content meets translucent bars
- Keyboard gets semi-transparent rounded treatment
- Switches/toggles adopt new glass reflections

---

## Sources

- [Apple Newsroom - New Software Design](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/)
- [Apple Developer - Applying Liquid Glass to Custom Views](https://developer.apple.com/documentation/SwiftUI/Applying-Liquid-Glass-to-custom-views)
- [Apple Developer - Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Apple Developer - Build a SwiftUI App with the New Design (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/323/)
- [Apple Developer - Build a UIKit App with the New Design (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/284/)
- [Apple Developer - Tab Bars HIG](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- [Liquid Glass - Wikipedia](https://en.wikipedia.org/wiki/Liquid_Glass)
- [Liquid Glass Reference (GitHub - conorluddy)](https://github.com/conorluddy/LiquidGlassReference)
- [NN/g - Liquid Glass Is Cracked, and Usability Suffers](https://www.nngroup.com/articles/liquid-glass/)
- [MacStories - iOS and iPadOS 26 Review](https://www.macstories.net/stories/ios-and-ipados-26-the-macstories-review/3/)
- [Donny Wals - Exploring Tab Bars on iOS 26](https://www.donnywals.com/exploring-tab-bars-on-ios-26-with-liquid-glass/)
- [Donny Wals - Designing Custom UI with Liquid Glass](https://www.donnywals.com/designing-custom-ui-with-liquid-glass-on-ios-26/)
- [Nil Coalescing - SwiftUI Search Enhancements iOS 26](https://nilcoalescing.com/blog/SwiftUISearchEnhancementsIniOSAndiPadOS26/)
- [Nil Coalescing - Corner Concentricity in SwiftUI](https://nilcoalescing.com/blog/ConcentricRectangleInSwiftUI/)
- [Nil Coalescing - Presenting Liquid Glass Sheets](https://nilcoalescing.com/blog/PresentingLiquidGlassSheetsInSwiftUI/)
- [Create with Swift - Scroll Edge Effect Style](https://www.createwithswift.com/define-the-scroll-edge-effect-style-of-a-scroll-view-for-liquid-glass/)
- [Hacking with Swift - Scroll Edge Effect](https://www.hackingwithswift.com/quick-start/swiftui/how-to-adjust-the-scroll-edge-effect-for-scrollview-and-list)
- [Design for Native - UI Changes in iOS 26](https://designfornative.com/ui-changes-in-ios-26-thats-not-about-liquid-glass/)
- [Fatbobman - Grow on iOS 26](https://fatbobman.com/en/posts/grow-on-ios26/)
- [InspiringApps - Preparing for iOS 26](https://www.inspiringapps.com/blog/ios-18-lessons-preparing-ios-19-app-development)
- [Mobivery - The Liquid Glass Effect](https://mobivery.com/en/liquid-glass-effect/)
- [UX Planet - iOS 26: Beyond Liquid Glass](https://uxplanet.org/ios-26-beyond-liquid-glass-f1e41306a57b)
- [CSS-Tricks - Getting Clarity on Apple's Liquid Glass](https://css-tricks.com/getting-clarity-on-apples-liquid-glass/)
- [LogRocket - Liquid Glass with CSS and SVG](https://blog.logrocket.com/how-create-liquid-glass-effects-css-and-svg/)
- [DEV Community - Recreating Liquid Glass with Pure CSS](https://dev.to/kevinbism/recreating-apples-liquid-glass-effect-with-pure-css-3gpl)
- [Level Up Coding - Build a Liquid Glass Design System](https://levelup.gitconnected.com/build-a-liquid-glass-design-system-in-swiftui-ios-26-bfa62bcba5be)
- [MacRumors - Apple Updates Design Resources for iOS 26](https://www.macrumors.com/2025/06/11/apple-updates-design-resources-ios-26/)
- [MacRumors - iOS 26 Reduce Transparency](https://www.macrumors.com/how-to/ios-reduce-transparency-liquid-glass-effect/)
- [MacRumors - iOS 26.1 Transparency Toggle](https://www.macrumors.com/2025/10/20/ios-26-1-transparency-option-liquid-glass/)
- [Ryan Ashcraft - My Beef with the iOS 26 Tab Bar](https://ryanashcraft.com/ios-26-tab-bar-beef/)
- [Medium - Don't Design Junk in the New iOS 26 Tab Bar](https://medium.com/design-bootcamp/dont-design-junk-in-the-new-ios-26-tab-bar-4de8e842da89)
- [Liquid Glass Generator Tool](https://www.liquid-glass.pro/)
