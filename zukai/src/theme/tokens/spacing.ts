/**
 * ZUKAI DESIGN SYSTEM - SPACING TOKENS
 * Strict 4pt grid system ensuring proportional rhythm and visual cohesion.
 */

export const spacing = {
  0: 0,
  xxs: 2,   // 2pt micro spacing
  xs: 4,    // 4pt
  sm: 8,    // 8pt
  md: 12,   // 12pt
  lg: 16,   // 16pt (Base gutter & padding)
  xl: 20,   // 20pt
  '2xl': 24,// 24pt (Standard card padding)
  '3xl': 32,// 32pt (Section gaps)
  '4xl': 40,// 40pt
  '5xl': 48,// 48pt (Touch target height minimum)
  '6xl': 64,// 64pt (Major component separation)
  '7xl': 80,// 80pt
  '8xl': 96,// 96pt (Screen bottom padding for player clearance)

  // Layout Specific Consts
  screenPaddingHorizontal: 20,
  screenPaddingTop: 56, // Safe area top inset buffer
  bottomPlayerHeight: 76,
  bottomBarHeight: 64,
  touchTargetMinimum: 48, // 48x48dp WCAG touch target compliance
} as const;

export type Spacing = typeof spacing;

