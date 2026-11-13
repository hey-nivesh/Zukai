/**
 * ZUKAI DESIGN SYSTEM - SPACING TOKENS
 * Strict 4pt grid system ensuring proportional rhythm and visual cohesion.
 */

export const spacing = {
  0: 0,
  xxs: 2,   // 2pt micro spacing
  xs: 4,    // 4pt
  sm: 8,    // 8pt (Default item gap)
  md: 12,   // 12pt (Compact card padding)
  lg: 16,   // 16pt (Compact screen gutter & section gap)
  xl: 20,   // 20pt (Standard section separation)
  '2xl': 24,// 24pt
  '3xl': 32,// 32pt
  '4xl': 40,// 40pt
  '5xl': 48,// 48pt (Touch target height minimum)
  '6xl': 56,// 56pt (Compact list row height)
  '7xl': 64,// 64pt (Standard list row height)
  '8xl': 88,// 88pt (Screen bottom padding for player clearance)

  // Compact Layout Specific Tokens (Phase 7 EdTech Vibe)
  screenPaddingHorizontal: 16,
  screenPaddingTop: 48,
  cardPadding: 12,
  cardPaddingCompact: 10,
  sectionGap: 16,
  sectionGapTight: 12,
  itemGap: 8,
  itemGapTight: 6,
  listRowHeight: 56,
  bottomPlayerHeight: 68,
  bottomBarHeight: 60,
  touchTargetMinimum: 48, // 48x48dp WCAG touch target compliance
} as const;

export type Spacing = typeof spacing;

