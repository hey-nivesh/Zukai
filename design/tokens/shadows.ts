/**
 * ZUKAI DESIGN SYSTEM - SHADOWS & ELEVATION
 * Tailored for dark-canvas neon glow and glass depth.
 * Provides CSS-compatible strings and React Native shadow definitions.
 */

export interface RNShadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number; // Android elevation
}

export const shadows = {
  // 1. Subtle Dark Surface Elevation
  surfaceSm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 2,
    css: '0px 2px 8px rgba(0, 0, 0, 0.40)',
  },

  surfaceMd: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
    css: '0px 6px 16px rgba(0, 0, 0, 0.50)',
  },

  surfaceLg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.60,
    shadowRadius: 24,
    elevation: 12,
    css: '0px 12px 32px rgba(0, 0, 0, 0.65)',
  },

  // 2. Signature Brand Neon Green Glows
  buttonGlow: {
    shadowColor: '#92F702',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40,
    shadowRadius: 16,
    elevation: 8,
    css: '0px 4px 20px rgba(146, 247, 2, 0.38)',
  },

  buttonGlowIntense: {
    shadowColor: '#92F702',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.60,
    shadowRadius: 24,
    elevation: 12,
    css: '0px 6px 28px rgba(146, 247, 2, 0.55)',
  },

  visorGlow: {
    shadowColor: '#0BF807',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.50,
    shadowRadius: 20,
    elevation: 10,
    css: '0px 0px 24px rgba(11, 248, 7, 0.45)',
  },

  // 3. Glassmorphic Card Top Rim Highlight & Inner Shadow
  glassRim: {
    css: 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.25), 0 8px 24px rgba(0, 0, 0, 0.45)',
  },
} as const;

