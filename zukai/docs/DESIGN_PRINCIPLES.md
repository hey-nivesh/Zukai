# Zukai — Design Principles & UI Specification
**Document Version:** 1.0.0  
**Scope:** Design System Tokens, Button Anatomy, Typography, Motion, and Glassmorphism

---

## 1. Brand Color System (Sampled Directly from Zukai Logo)

The visual identity of Zukai is rooted in the contrast between deep, velvety cyber obsidian and piercing electric neon volt green, elevated by crisp glassmorphism.

```
+-----------------------------------------------------------------------------------+
|  PRIMARY HERO ACCENT: #92F702 (Neon Volt Green)                                   |
|  VISOR GLOW ACCENT:   #0BF807 (Electric Emerald)                                  |
|  BACKGROUND BASE:     #09161B (Deep Obsidian Slate)                               |
|  SURFACE CARD:        rgba(15, 31, 38, 0.70) (Frosted Cyber Glass)                 |
|  PRIMARY TEXT:        #F8F9FA (Pure Crisp Off-White)                              |
+-----------------------------------------------------------------------------------+
```

### Complete Color Token Hierarchy

```typescript
// System Color Token Palette
export const colors = {
  // Brand Neon Greens (Sampled from Logo 'Z' and Visor)
  brand: {
    primary: '#92F702',       // Hero Neon Volt (Buttons, active state, hero icons)
    primaryHover: '#A4F924',  // Pressed / Lightened State
    primaryDark: '#70C200',   // Shadow / Deep Border Accent
    emerald: '#0BF807',       // Visor Inner Glow / Secondary Neon Accent
    emeraldMuted: 'rgba(11, 248, 7, 0.15)', // Ambient audio glow
  },

  // Dark Canvas & Backgrounds (Sampled from Logo Body)
  canvas: {
    abyss: '#050D10',         // Cold Black Base for full screens
    deep: '#09161B',          // Main Background Canvas
    card: '#0D1E24',          // Primary Solid Surface Card
    cardElevated: '#132830',  // Elevated Floating Surface
    cardHighlight: '#18333D', // Hover / Selected Surface
  },

  // Glassmorphic Surface Overlays
  glass: {
    surfaceLight: 'rgba(255, 255, 255, 0.06)',  // Subtle Glass Layer
    surfaceMedium: 'rgba(15, 31, 38, 0.70)',    // Standard Frosted Card
    surfaceHeavy: 'rgba(9, 22, 27, 0.88)',      // Modal & Bottom Sheet Sheet
    borderLight: 'rgba(255, 255, 255, 0.12)',   // 1px Inner Border
    borderActive: 'rgba(146, 247, 2, 0.40)',    // 1px Active Neon Border
    glowGreen: 'rgba(146, 247, 2, 0.25)',       // Button & Card Radial Glow
  },

  // Text & Content Hierarchy
  text: {
    primary: '#F8F9FA',       // High-contrast Headings & Titles (Contrast ratio 14.8:1)
    secondary: '#B5C4CC',     // Body copy and descriptions (Contrast ratio 8.2:1)
    tertiary: '#6B828F',      // Footnotes, inactive tabs, timestamps (Contrast ratio 4.6:1)
    inverse: '#09161B',       // Dark text on Neon Green CTA buttons
  },

  // Semantic Status Tones
  status: {
    success: '#00E676',       // Operation succeeded / Audio completed
    warning: '#FFD600',       // Low quota warning / Long file notice
    error: '#FF3D71',         // Upload failed / Parsing exception
    info: '#00B0FF',          // Processing / Information updates
  }
} as const;
```

---

## 2. Button Anatomy: The "Zukai Shine & Reflection" Engine

Every primary button in Zukai is a multi-layered, tactile element featuring a glossy top highlight, an inner light stroke, a neon glow, a gentle idle shimmer, and an interactive light-sweep on press.

```
+-------------------------------------------------------------------+
|  [Layer 1] Outer Radial Neon Glow: rgba(146, 247, 2, 0.35) blur   |
|  +-------------------------------------------------------------+  |
|  | [Layer 2] 1px Inner Highlight Border: rgba(255,255,255,0.40)|  |
|  | +---------------------------------------------------------+ |  |
|  | | [Layer 3] Top Gloss Half-Pill Gradient:                 | |  |
|  | |           rgba(255, 255, 255, 0.28) -> transparent      | |  |
|  | | [Layer 4] Base Gradient: #92F702 -> #7ED802             | |  |
|  | | [Layer 5] Moving Light-Sweep Shimmer (Angle: 25 deg)    | |  |
|  | | [Layer 6] Button Label: #09161B (Inter Bold, 16px)      | |  |
|  | +---------------------------------------------------------+ |  |
|  +-------------------------------------------------------------+  |
+-------------------------------------------------------------------+
```

### Layer Specifications & Values
1. **Outer Glow (Drop Shadow / Skia Glow):**
   - Color: `rgba(146, 247, 2, 0.35)`
   - Offset: `{ width: 0, height: 6 }`
   - Shadow Radius: `16px`
2. **Base Gradient Fill:**
   - Colors: `['#A4F924', '#92F702', '#76CE00']`
   - Angle / Coordinates: `start={{ x: 0, y: 0 }}, end={{ x: 1, y: 1 }}`
3. **Glossy Top Highlight (Upper 45% of button):**
   - Shape: Rounded half-capsule overlay pinned to top.
   - Gradient: `['rgba(255, 255, 255, 0.40)', 'rgba(255, 255, 255, 0.00)']`
   - Height: `45%` of button height.
4. **Subtle Inner Light Stroke:**
   - Border Width: `1px`
   - Border Color: `rgba(255, 255, 255, 0.35)`
5. **Idle Shimmer Animation (Reanimated / Skia):**
   - A diagonal light bar (`rgba(255, 255, 255, 0.45)`, width `32px`, tilted at `25°`) sweeps horizontally across the button from left to right.
   - **Timing:** Duration `1,200ms`, repeated with a `4,000ms` pause between sweeps.
6. **Press-Down Interaction & Haptics:**
   - Scale down: `scale: 0.96` with spring configuration (`mass: 0.5, damping: 10, stiffness: 250`).
   - Haptic Feedback: `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)`.

---

## 3. Typography Scale (Inter & Inter Display)

Zukai adopts a typography architecture inspired by Apple's Human Interface Guidelines, conveying poise, clarity, and authority.

| Level | Size (pt) | Line Height (pt) | Weight | Tracking (Letter Spacing) | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Display** | 36 | 44 | Bold (700) | -0.8px | Splash screen, audio completed hero titles |
| **Title 1 (H1)** | 28 | 34 | SemiBold (600) | -0.5px | Screen headers, Paywall main value prop |
| **Title 2 (H2)** | 22 | 28 | SemiBold (600) | -0.3px | Section headers, Document titles in player |
| **Headline (H3)**| 18 | 24 | Medium (500) | -0.15px| Card titles, Chapter names |
| **Body Large** | 16 | 24 | Regular (400) | 0.0px | Main player transcript text, modal body |
| **Body Medium** | 14 | 20 | Regular (400) | +0.1px | Subtitles, descriptions, settings rows |
| **Caption 1** | 12 | 16 | Medium (500) | +0.2px | Timestamps, scrubber labels, chip tags |
| **Button Label** | 16 | 20 | SemiBold (600) | +0.3px | Interactive buttons, navigation pills |

---

## 4. Background Gradient Recipes & Glassmorphism

All screens in Zukai employ ambient mesh/radial glow backdrops rather than flat black, imparting depth and luxury.

```
[Screen Background Composition]
Base Layer: #09161B (Cyber Obsidian)
     +
Top-Right Radial Mesh: rgba(146, 247, 2, 0.12) - Neon Green Aura (radius: 350px)
     +
Bottom-Left Radial Mesh: rgba(11, 248, 7, 0.08) - Deep Teal/Emerald Aura (radius: 400px)
     +
Subtle 2% Monochromatic Noise Grain Overlay (Eliminates color banding on OLED screens)
```

### The Glassmorphic Card Recipe (`GlassCard`)
- **Background Color:** `rgba(15, 31, 38, 0.65)`
- **Backdrop Blur:** `blur(24px)` (via `expo-glass-effect` or BlurView)
- **Border:** `1px solid rgba(255, 255, 255, 0.10)`
- **Corner Radius:** `20px` (or `24px` for modals)
- **Top Rim Light:** Inner shadow / top edge highlight `rgba(255, 255, 255, 0.08)`

---

## 5. Screen-to-Background Gradient & Mascot Mapping

| Screen Route | Primary Background Gradient Recipe | Mascot Asset | Mascot State / Purpose |
| :--- | :--- | :--- | :--- |
| `/splash` | Deep Abyss (`#050D10`) with Center Neon Pulse (`#92F702`, 25% opacity) | Logo Mark | Visor glowing neon sweep |
| `/onboarding` | Deep Teal Mesh (`#09161B` base, `#0BF807` at top, `#92F702` bottom right) | `Zuke-Welcome` / `Zuke-Listening` | Friendly waving, then wearing headphones |
| `/(auth)/sign-in` | Subtle Obsidian-Emerald (`#09161B` with top-center teal aura) | `Zuke-Welcome` | Welcoming user at top of login card |
| `/(tabs)/home` | Dual Mesh (`#09161B`, top-right `#92F702` 10%, bottom-left `#0BF807` 8%) | `Zuke-Listening` | Mini mascot badge in progress widget |
| `/(tabs)/library`| Neutral Dark (`#09161B` with faint center glow) | `Zuke-Empty` | Illustrated on empty library state |
| `/upload/picker` | Focused Radial (`#09161B` with center `#92F702` spotlight) | `Zuke-Uploading` | Holding document arrow with visor up |
| `/upload/processing`| Dynamic Pulse Mesh (Pulsing `#92F702` and `#0BF807` rings) | `Zuke-Thinking` | Animated visor processing data bars |
| `/player/full` | Immersive Soundscape (`#050D10` with beat-reactive ambient green aura) | `Zuke-Listening` | Sound waves radiating from headphones |
| `/paywall` | Premium Neon Luxe (`#050D10` with high-intensity `#92F702` 20% glow) | `Zuke-Paywall` | Cyber badge, holding golden audio key |
| `/error` | Crimson-Obsidian (`#09161B` with muted `#FF3D71` 12% top aura) | `Zuke-Error` | Visor flickering with wrench icon |

---

## 6. Motion & Haptics System

Zukai experiences feel fluid, physical, and responsive. Nothing pops in abruptly or moves with linear stiffness.

### Spring Configurations (React Native Reanimated):
```typescript
export const springs = {
  // Snappy response for buttons, toggles, and chips
  snappy: {
    mass: 0.8,
    damping: 15,
    stiffness: 220,
  },
  // Smooth sheet presentation and card expansions
  smooth: {
    mass: 1.0,
    damping: 22,
    stiffness: 140,
  },
  // Bouncy micro-interactions (mascot reactions, success confetti)
  bouncy: {
    mass: 0.6,
    damping: 9,
    stiffness: 180,
  }
};
```

### Haptic Feedback Mapping:
- **Button Press (Primary CTAs):** `Haptics.impactAsync(ImpactFeedbackStyle.Medium)`
- **Scrubber / Slider Step Tick:** `Haptics.selectionAsync()`
- **Audio Processing Completed:** `Haptics.notificationAsync(NotificationFeedbackType.Success)`
- **Upload / Validation Error:** `Haptics.notificationAsync(NotificationFeedbackType.Error)`
- **Speed Pill Change (1.0x $\rightarrow$ 1.25x):** `Haptics.impactAsync(ImpactFeedbackStyle.Light)`

---

## 7. Accessibility & Ergonomics Standards

1. **Target Contrast (WCAG AA & AAA):**
   - High-contrast text `#F8F9FA` against `#09161B` delivers a contrast ratio of **14.8:1** (exceeding WCAG AAA requirement of 7:1).
   - Brand Neon Green `#92F702` against `#09161B` yields a contrast ratio of **11.2:1** for graphical elements and large labels.
2. **Minimum Touch Target:** All interactive controls (buttons, scrubber thumbs, speed pills, close icons) enforce a minimum touch bounding box of **48 x 48 dp**.
3. **Dynamic Type / Scalable Text:** All typography values use React Native scaled units (`allowFontScaling = true`), ensuring layout resilience when users increase system font size up to 200%.
4. **Reduced Motion Accessibility (`prefers-reduced-motion`):**
   - When the user enables reduced motion in Android settings, all continuous ambient mesh pulses and idle button shimmers are deactivated, and transitions fall back to instant cross-fades (duration `150ms`).
