/**
 * ZUKAI THEME PROVIDER
 * React context provider giving all children access to design tokens.
 */

import React, { createContext, useContext } from 'react';
import { colors } from './tokens/colors';
import { typography } from './tokens/typography';
import { gradients } from './tokens/gradients';
import { motion } from './tokens/motion';
import { spacing } from './tokens/spacing';
import { radius } from './tokens/radius';

const theme = {
  colors,
  typography,
  gradients,
  motion,
  spacing,
  radius,
} as const;

export type ZukaiTheme = typeof theme;

const ThemeContext = createContext<ZukaiTheme>(theme);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ZukaiTheme {
  return useContext(ThemeContext);
}

