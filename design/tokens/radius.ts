/**
 * ZUKAI DESIGN SYSTEM - RADIUS TOKENS
 * Continuous-corner squircle aesthetic inspired by Apple iOS design.
 */

export const radius = {
  none: 0,
  xs: 4,      // Micro tags, sub-indicators
  sm: 8,      // Badges, small pills, chip filters
  md: 12,     // Compact inputs, list item containers
  lg: 16,     // Primary buttons, text inputs
  xl: 20,     // Standard glass cards, audio player cover
  '2xl': 24,  // Bottom sheets, hero floating cards
  '3xl': 32,  // Large modal dialogs, player carousel
  full: 9999, // Pill buttons, circular icons, progress rings
} as const;

export type Radius = typeof radius;

