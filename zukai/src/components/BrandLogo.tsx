/**
 * ZUKAI BRAND LOGO
 * Renders the official brand icon with optional text, 3D glow aura, and orientation.
 */

import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './Text';
import { colors } from '../theme/tokens/colors';

interface BrandLogoProps {
  size?: number;
  showText?: boolean;
  layout?: 'row' | 'column';
  style?: ViewStyle;
}

export function BrandLogo({
  size = 44,
  showText = true,
  layout = 'row',
  style,
}: BrandLogoProps) {
  const isCol = layout === 'column';

  return (
    <View style={[styles.container, isCol && styles.columnContainer, style]}>
      {/* 3D Glow Aura Behind Cyber Logo */}
      <View
        style={[
          styles.iconWrap,
          {
            width: size,
            height: size,
            borderRadius: size * 0.28,
          },
        ]}
      >
        <View
          style={[
            styles.glowAura,
            {
              width: size * 1.25,
              height: size * 1.25,
              borderRadius: size * 0.625,
            },
          ]}
        />
        <Image
          source={require('../assets/brand/logo.png')}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </View>

      {showText && (
        <Text
          variant={isCol ? 'display' : 'title1'}
          rawColor={colors.brand.hero}
          style={[styles.text, isCol && styles.columnText]}
        >
          ZUKAI
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  columnContainer: {
    flexDirection: 'column',
    gap: 14,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand.hero,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  glowAura: {
    position: 'absolute',
    backgroundColor: 'rgba(146, 247, 2, 0.18)',
  },
  text: {
    letterSpacing: 5,
    fontWeight: '900',
  },
  columnText: {
    letterSpacing: 6,
    fontSize: 28,
  },
});
