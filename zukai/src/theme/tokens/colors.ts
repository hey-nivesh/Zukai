/**
 * ZUKAI DESIGN SYSTEM - COLOR TOKENS
 * Sampled directly from Zukai Brand Identity (logo.png, logo-with-name.png)
 * Strictly tuned for high-contrast, premium dark mode and WCAG AA/AAA compliance.
 */

export const colors = {
  // Brand Neon & Volt Green Scale (50 to 900)
  brand: {
    50: '#F4FEE7',
    100: '#E6FDC7',
    200: '#D1FB97',
    300: '#B8F95F',
    400: '#A4F924',  // Light hover green
    500: '#92F702',  // HERO NEON VOLT GREEN (exact logo accent)
    600: '#75CE00',  // Mid-tone active green
    700: '#5BA300',  // Deep accent green
    800: '#427A00',  // Dark green container border
    900: '#2C5300',  // Deepest green shade
    // Key Accents
    hero: '#92F702',
    visor: '#0BF807',       // Vivid Emerald (visor center glow)
    deep: '#70C200',        // Deep button bevel / shadow
    darkContainer: '#132E14',// Green tinted card base
  },

  // Dark Canvas & Background Scale
  canvas: {
    abyss: '#050D10',        // Deepest cold black (Player & Splash base)
    base: '#09161B',         // Base near-black canvas (sampled from logo body)
    surface: '#0D1E24',      // Standard surface card
    surfaceRaised: '#132830',// Elevated cards, bottom sheets, modals
    surfaceHighlight: '#18333D', // Hover & selected list items
    overlay: 'rgba(5, 13, 16, 0.85)', // Modal backdrops
  },

  // Typography & Content Hierarchy
  text: {
    primary: '#F8F9FA',      // High-contrast off-white (14.8:1 contrast on base)
    secondary: '#B5C4CC',    // Muted body, subtitles (8.2:1 contrast)
    tertiary: '#6B828F',     // Metadata, timestamps, inactive icons (4.6:1 contrast)
    disabled: '#3A4B54',     // Inactive actions, placeholder text
    inverse: '#09161B',      // Dark text on bright Neon Green CTA buttons
    accent: '#92F702',       // Highlighted keywords, links, active state
  },

  // Semantic Status Tones (Tuned specifically for dark UI)
  semantic: {
    success: '#00E676',      // Vibrantly clear green for completed audio
    successMuted: 'rgba(0, 230, 118, 0.16)',
    warning: '#FFD600',      // Crisp golden yellow for quota warnings
    warningMuted: 'rgba(255, 214, 0, 0.16)',
    error: '#FF3D71',        // Electric coral red for parsing/upload failures
    errorMuted: 'rgba(255, 61, 113, 0.16)',
    info: '#00B0FF',         // Cyan blue for informational status/processing
    infoMuted: 'rgba(0, 176, 255, 0.16)',
  },

  // Glassmorphic Fills, Strokes & Glows
  glass: {
    surfaceSubtle: 'rgba(255, 255, 255, 0.04)',
    surfaceLight: 'rgba(255, 255, 255, 0.07)',
    surfaceCard: 'rgba(15, 31, 38, 0.70)',       // Primary frosted card fill
    surfaceRaised: 'rgba(19, 40, 48, 0.82)',     // Modal / Sheet fill
    surfaceShine: 'rgba(255, 255, 255, 0.28)',    // Button upper gloss highlight
    borderSubtle: 'rgba(255, 255, 255, 0.08)',   // Inactive card borders
    borderLight: 'rgba(255, 255, 255, 0.14)',    // Standard glass card border
    borderHighlight: 'rgba(255, 255, 255, 0.35)',// Top-rim reflection stroke
    borderActive: 'rgba(146, 247, 2, 0.45)',     // Focused input & active card border
    glowGreen: 'rgba(146, 247, 2, 0.30)',        // Primary button & player aura
    glowVisor: 'rgba(11, 248, 7, 0.22)',         // Ambient audio visualizer glow
  },
} as const;

export type Colors = typeof colors;

