/**
 * ZUKAI TYPED TEXT COMPONENT
 * Never use raw RN <Text> in feature code. Always use this.
 * Variants map 1-to-1 with the typography token scale.
 */

import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export type TextVariant =
  | 'displayXl'
  | 'display'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'headline'
  | 'body'
  | 'callout'
  | 'subhead'
  | 'footnote'
  | 'caption'
  | 'monoTime'
  | 'monoCounter';

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'disabled'
  | 'inverse'
  | 'accent';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
  /** Override color directly with any string */
  rawColor?: string;
  children: React.ReactNode;
}

export function Text({
  variant = 'body',
  color = 'primary',
  rawColor,
  style,
  children,
  ...rest
}: TextProps) {
  const { typography, colors } = useTheme();
  const token = typography[variant];

  const computedColor = rawColor ?? colors.text[color];

  return (
    <RNText
      allowFontScaling
      style={[
        {
          fontSize: token.fontSize,
          lineHeight: token.lineHeight,
          fontWeight: token.fontWeight,
          letterSpacing: token.letterSpacing,
          color: computedColor,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

