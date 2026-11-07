/**
 * ZUKAI DESIGN SYSTEM - TOKEN BUNDLE EXPORT
 */

export * from './colors';
export * from './gradients';
export * from './typography';
export * from './spacing';
export * from './radius';
export * from './shadows';
export * from './motion';

import { colors } from './colors';
import { gradients } from './gradients';
import { typography } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';
import { motion } from './motion';

export const theme = {
  colors,
  gradients,
  typography,
  spacing,
  radius,
  shadows,
  motion,
} as const;

export default theme;

