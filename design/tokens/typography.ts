/**
 * ZUKAI DESIGN SYSTEM - TYPOGRAPHY SCALE
 * Inspired by Apple Human Interface Guidelines, built for Inter & Inter Display.
 * Generous whitespace, assertive display headings, and high-legibility body.
 */

export interface TypographyToken {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700' | '800';
  letterSpacing: number; // in pixels
  fontFamily: string;
}

const FONT_FAMILY = {
  display: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
};

export const typography = {
  fontFamilies: FONT_FAMILY,

  // Display XL: 48pt - Cold start splash hero, major celebration numbers
  displayXl: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '800',
    letterSpacing: -1.2,
    fontFamily: FONT_FAMILY.display,
  } as TypographyToken,

  // Display: 40pt - Large audio time saved, Paywall hero titles
  display: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700',
    letterSpacing: -1.0,
    fontFamily: FONT_FAMILY.display,
  } as TypographyToken,

  // Title 1: 32pt - Screen top titles (Home, Library, Player header)
  title1: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.6,
    fontFamily: FONT_FAMILY.display,
  } as TypographyToken,

  // Title 2: 28pt - Section hero titles, Modal headers
  title2: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600',
    letterSpacing: -0.4,
    fontFamily: FONT_FAMILY.display,
  } as TypographyToken,

  // Title 3: 22pt - Card titles, Track titles in mini-player
  title3: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: -0.2,
    fontFamily: FONT_FAMILY.display,
  } as TypographyToken,

  // Headline: 17pt (SemiBold) - Card primary text, chapter headers
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.15,
    fontFamily: FONT_FAMILY.body,
  } as TypographyToken,

  // Body: 17pt (Regular) - Player transcript active text, narrative copy
  body: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0.0,
    fontFamily: FONT_FAMILY.body,
  } as TypographyToken,

  // Callout: 16pt (Medium) - Button labels, segmented control tabs
  callout: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: 0.0,
    fontFamily: FONT_FAMILY.body,
  } as TypographyToken,

  // Subhead: 15pt (Regular) - Secondary metadata, list item subtitles
  subhead: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0.05,
    fontFamily: FONT_FAMILY.body,
  } as TypographyToken,

  // Footnote: 13pt (Regular) - Disclaimers, file extension badges, dates
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: 0.1,
    fontFamily: FONT_FAMILY.body,
  } as TypographyToken,

  // Caption: 12pt (Medium) - Audio duration counters, scrubber markers
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
    fontFamily: FONT_FAMILY.body,
  } as TypographyToken,

  // Monospace (Numbers, Timestamps & Audio Scrubber)
  monoTime: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: 0.5,
    fontFamily: FONT_FAMILY.mono,
  } as TypographyToken,

  monoCounter: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: FONT_FAMILY.mono,
  } as TypographyToken,
} as const;

