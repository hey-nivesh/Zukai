# Zukai — Mascot Brief & Asset Specification
**Document Version:** 1.0.0  
**Character Identity:** The Zukai Audio Mentor & Navigator

---

## 1. Mascot Name Candidates & Rationales

| Candidate Name | Phonetic & Meaning | Brand Resonance & Recommendation |
| :--- | :--- | :--- |
| **Option 1: Zuke (Recommended)** | Short, snappy, friendly (*"Zuke"* rhymes with *Duke* / *Luke*). | **Top Pick.** Directly mirrors the brand name "Zukai". Easy to pronounce across global and South Asian languages. Sounds like a sharp, reliable digital companion. |
| **Option 2: Vizo** | Derived from "Visor" and "Visual-to-Audio". | Futuristic and tech-forward. Emphasizes the signature neon-green cyber visor featured in the logo. |
| **Option 3: Kaito** | Japanese for "Solution / Answer" (解答) + sound of "Kite". | Elegant and intellectual. Reinforces clarity and decoding complex knowledge, but slightly more abstract than *Zuke*. |

---

## 2. Character Personality & Backstory

**Zuke** is not a goofy cartoon animal; he is a sleek, intelligent, cyberpunk knowledge mentor. Think of Zuke as a blend of *EVE from WALL-E*, an ultra-smart audio engineer, and a charismatic friend who reads 500-page textbooks in seconds and explains them over coffee in five minutes.

### Personality Pillars:
1. **Effortlessly Sharp, Never Pretentious:** Zuke demystifies dense jargon without ever making the user feel uninformed.
2. **Patient & Encouraging:** Never gets tired of explaining complex topics; loves breaking hard ideas into analogies.
3. **Audio Enthusiast:** Passionate about sound, rhythm, and clarity. Always seen with glowing audio waves or sleek cyber headphones.
4. **Witty & Observant:** In processing screens, Zuke drops quick one-liners: *"Skimming 40 pages of financial disclosures so your eyes don't have to..."* or *"Filtering out the corporate buzzwords..."*

---

## 3. Visual Rules Derived Directly from the Zukai Logo

```
       [VISOR] Neon Emerald / Lime (#92F702 & #0BF807) with White Top Gloss
          \
         +--------------------+
         |   /=====\          |  <--- [HELMET] Dark Obsidian (#09161B)
         |  | [===] |         |       Angular cuts & 45-degree diagonal lines
         |   \____/           |
         +--------------------+
          /                  \
   [CHEST PLATE]          [AUDIO BADGE]
   Matte Off-White        Equilateral Triangle with 3 Neon Equalizer Bars
   Geometric Face Mask    (From lower crook of logo 'Z')
```

### Mandatory Design Rules:
1. **The Signature Visor:** The visor is the primary focal point of emotion. It features the exact top-down glass shine and neon gradient (`#92F702` to `#0BF807`) seen in `logo.png`. Emotion is expressed through visor shape shifts and glowing HUD symbols.
2. **The Angular "Z" Geometry:** Zuke’s body lines and helmet shell reflect the 45-degree angular diagonals of the logo's "Z" glyph.
3. **The Triangle Audio-Bar Emblem:** Pinned to Zuke’s chest or floating companion drone is the exact triangle glyph with three vertical equalizer pills from the logo. The middle bar is taller than the outer two.
4. **Color Strictness:**
   - Helmet Shell: Cyber Obsidian `#09161B`
   - Visor & Glow Elements: Neon Volt `#92F702` & Emerald `#0BF807`
   - Mask/Plates: Pure Crisp Off-White `#F8F9FA`
   - Accents: Deep Slate Teal `#13262E`

---

## 4. Complete Pose & Expression Manifest

### 1. `Zuke-Welcome` (Onboarding & Sign-In)
- **Pose:** Standing confidently at a 3/4 angle, one hand giving a friendly cyber wave, visor glowing with a welcoming upward curved smile line.
- **Context:** Onboarding slide 1, authentication screen hero header.

### 2. `Zuke-Uploading` (Document Selection)
- **Pose:** Holding a stylized glowing glass tablet or holographic document hovering above an upward neon suction beam. Visor shows an arrow icon pointing up.
- **Context:** Upload bottom sheet, file confirmation modal.

### 3. `Zuke-Thinking` (Processing & Audio Synthesis)
- **Pose:** Floating cross-legged or in micro-gravity. Visor displays animated pulsing equalizer bars and scrolling code runes. A tiny floating holographic soundwave surrounds him.
- **Context:** `/upload/processing` screen while Gemini synthesizes the script and generates TTS.

### 4. `Zuke-Listening` (Player Screen & Active Audio)
- **Pose:** Wearing sleek over-ear neon headphones, eyes closed in acoustic focus, head gently nodding to the beat, neon soundwaves rippling outward from the headphones.
- **Context:** Full-screen audio player, "Continue Listening" dashboard cards.

### 5. `Zuke-Success` (Job Complete & Milestones)
- **Pose:** Triumphant thumbs-up or fist pump, visor displaying a bright star or checkmark, surrounded by neon green confetti particles.
- **Context:** Audio ready modal, listening streak milestones, completion dialog.

### 6. `Zuke-Error` (Parsing Failure / Offline)
- **Pose:** Scratching his helmet in confusion, holding a tiny digital wrench or looking down at an unplugged glowing cable. Visor displays a gentle blinking question mark or warning icon.
- **Context:** Document parsing error, offline mode, quota exhaustion dialog.

### 7. `Zuke-Empty` (Empty State)
- **Pose:** Sitting on a minimalist glass pedestal with a clean, empty audio tray, visor looking around playfully as if waiting for the user to hand him a book.
- **Context:** Empty library screen, empty favorites list, no search results.

### 8. `Zuke-Paywall` (Subscription / Pro Upsell)
- **Pose:** Holding a glowing neon VIP badge or an electric golden audio key, visor gleaming with luxury green highlights, standing next to a sleek unlocked vault door.
- **Context:** `/paywall` modal and Pro feature locks.

---

## 5. Asset Manifest: Deliverables & Specifications

All mascot assets will be prepared for React Native Expo in **Vector SVG** (scaled dynamically), **High-Density PNG** (@1x, @2x, @3x for instant image rendering), and **Lottie JSON** (for interactive animations).

| Asset File Name | Primary Format | Target Render Size (dp) | Export Formats & Densities | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `mascot-welcome` | SVG / Lottie | 180 x 180 | SVG, PNG (@1x 180px, @2x 360px, @3x 540px), Lottie JSON | Onboarding hero, auth header |
| `mascot-uploading`| SVG | 140 x 140 | SVG, PNG (@1x 140px, @2x 280px, @3x 420px) | Upload dialog sheet |
| `mascot-thinking` | Lottie (Animated)| 200 x 200 | Lottie JSON (60fps loop), PNG fallback | Processing screen live animation |
| `mascot-listening`| Lottie / SVG | 160 x 160 | Lottie JSON (Subtle head bob loop), SVG, PNG | Audio player ambient visualizer |
| `mascot-success` | Lottie / SVG | 160 x 160 | Lottie JSON (1-shot celebration), SVG, PNG | Audio ready & milestone alerts |
| `mascot-error` | SVG | 140 x 140 | SVG, PNG (@1x 140px, @2x 280px, @3x 420px) | Error dialogs and retry screens |
| `mascot-empty` | SVG | 160 x 160 | SVG, PNG (@1x 160px, @2x 320px, @3x 480px) | Empty library & search views |
| `mascot-paywall` | SVG / Lottie | 180 x 180 | SVG, PNG (@1x 180px, @2x 360px, @3x 540px), Lottie JSON | Pro upgrade sheet hero |
| `mascot-avatar-head`| SVG | 48 x 48 | SVG, PNG (@1x 48px, @2x 96px, @3x 144px) | Mini status badges, app bar avatar |
