# Zukai Design System — Architectural Decisions Log (DECISIONS.md)
**Document Version:** 1.0.0  
**Phase:** Phase 1 Design System & UI Architecture

---

## Decision 1: Brand Token Extraction from Logo
- **Context:** The brand identity in `logo.png` features subtle gradients and cyber tones across the angular "Z", visor, and dark body.
- **Decision:** Sampled exact hex tokens:
  - Hero Accent: `#92F702` (Electric Neon Volt Green)
  - Visor Emerald Accent: `#0BF807`
  - Base Obsidian Canvas: `#09161B` (a deep slate-black with cold cyan undertones: R:9, G:22, B:27)
  - Secondary Card Fill: `rgba(15, 31, 38, 0.70)`
  - Primary Text: `#F8F9FA` (high-contrast off-white, yielding 14.8:1 contrast on dark canvas)

## Decision 2: 6-Layer Shiny Button Implementation
- **Context:** The prompt mandates that every button must possess shine, reflection, inner strokes, outer glow, and a shimmer sweep.
- **Decision:** Decomposed the button architecture into 6 distinct, reproducible layers:
  1. Base Fill: 3-stop gradient (`#A4F924` $\rightarrow$ `#92F702` $\rightarrow$ `#75CE00`).
  2. Glossy Highlight: Upper 45% capsule overlay (`rgba(255,255,255,0.42)` $\rightarrow$ transparent).
  3. Inner Rim: 1px light stroke on the top perimeter (`rgba(255,255,255,0.35)`).
  4. Outer Glow: Radial blur shadow (`rgba(146, 247, 2, 0.38)`).
  5. Shimmer Sweep: Moving 25° diagonal light streak (`1,200ms` duration).
  6. Idle Pulse: Periodic `4,000ms` sweep cycle on primary CTAs only.
  - Scale down to `0.97` with spring damping on touch down.

## Decision 3: Typography Standard (Inter Display + Monospace Time)
- **Context:** Apple-style poise requires confident display titles with tight tracking, balanced body copy, and non-proportional numerals for audio scrubbers.
- **Decision:** Selected `Inter` / `Inter Display` via `@expo-google-fonts/inter`. Monospace numbers and timestamps use `JetBrains Mono` / `SF Mono` (`monoTime` token) so audio scrubber numbers never jitter during playback.

## Decision 4: Mascot Family Identity "Zuke" & Format Amendment
- **Context:** The mascot must embody the brand's visor-wearing head, angular Z geometry, and audio-bar triangle.
- **Decision:** Formalized **Zuke** as the canonical character name across 10 core poses (`welcome`, `uploading`, `thinking`, `listening`, `success`, `error`, `empty`, `paywall`, `offline`, and `base`).
- **Amendment (Format & Runtime Architecture):** Mascots are **NOT** vector SVG or Lottie. The final mascot assets are **3D-rendered-style PNG images with transparent backgrounds** exported at high densities (@1x, @2x, @3x). Any earlier SVG mascots were concept sketches only and must not be used in the app. In all docs, screen mockups, and the style guide, structured placeholder boxes labeled with the pose name indicate mascot positions. In production React Native code, mascots are rendered with **`expo-image`** for hardware-accelerated texture caching, and idle animations (float, scale, glow pulse) are executed **directly in code using `react-native-reanimated`**.

## Decision 5: Android Adaptive Icon Canvas Constraints
- **Context:** Android adaptive icons mandate a 432x432 dp canvas with a 264x264 dp safe zone to ensure no clipping across circle, squircle, or rounded rect OEM masks.
- **Decision:** Centered the Zukai mark strictly within the 264dp safe circle in `adaptive-foreground.svg` and paired it with a deep obsidian radial mesh background in `adaptive-background.svg`.

## Decision 6: Multi-Tenant Workspace Integration in UI
- **Context:** Enterprise features must exist from day one without cluttering the consumer experience.
- **Decision:** The top navigation keeps the core focus on personal audio feeds, while multi-tenant organizations are accessible via a clean workspace switcher in `Settings` and a dedicated `Team` tab.

## Decision 7: Responsive Phone Viewport Standard (390 x 844)
- **Context:** Mobile mockups must reflect standard modern Android and iOS flagship dimensions.
- **Decision:** Standardized all 13 high-fidelity HTML screens on a `390x844` phone viewport with hardware bezels, standard status bars (`9:41`), and home indicator bars.

## Decision 8: Interactive Karaoke Transcripts over Static Text
- **Context:** Users listening to spoken explanations need cognitive alignment between the ear and eye.
- **Decision:** In the player mockup (`8-player.html`), the active spoken sentence is highlighted in a neon-bordered glass card with timestamp pills, while inactive sentences are subdued at 60% opacity.

## Decision 9: Performance Optimization for Low-End Android
- **Context:** Real-time backdrop blur (`expo-blur`) and multiple Skia radial glows can cause frame drops on budget Android chipsets (e.g., MediaTek Helio, Snapdragon 6-series).
- **Decision:** Documented in `PORTING_NOTES.md` a CSS/pre-rendered static radial gradient fallback that eliminates runtime Gaussian blur passes when frame rates drop below 55fps.

## Decision 10: Seamless Language Code-Mixing UX
- **Context:** South Asian professionals frequently switch between English and Hinglish depending on topic complexity.
- **Decision:** Language selection is prominent in onboarding (`4-language.html`), accessible per-upload in the upload sheet (`6-upload.html`), and persistent as a user default in settings (`12-settings.html`).

