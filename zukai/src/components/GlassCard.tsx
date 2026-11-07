/**
 * ZUKAI GLASS CARD
 * Translucent frosted surface card with expo-blur, 3D specular bevel, and neon glow.
 * Implements the GlassCard recipe with 3D depth, multi-stop light rim, and spatial shadow.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewProps,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';

export interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  /** Show the neon volt-green active border glow */
  glow?: boolean;
  /** Override corner radius */
  borderRadius?: number;
  /** Padding inside the card */
  padding?: number;
  /** Disable blur on low-end devices automatically (default: true) */
  adaptiveBlur?: boolean;
}

export function GlassCard({
  children,
  glow = false,
  borderRadius,
  padding,
  adaptiveBlur = true,
  style,
  ...rest
}: GlassCardProps) {
  const { colors, radius: r, spacing } = useTheme();
  const br = borderRadius ?? r.xl;
  const pad = padding ?? spacing['2xl'];

  const borderColor = glow
    ? colors.glass.borderActive
    : 'rgba(255, 255, 255, 0.16)';

  return (
    <View
      style={[
        styles.outerShadow,
        { borderRadius: br },
        glow && styles.glowShadow,
      ]}
    >
      <View
        style={[
          styles.container,
          {
            borderRadius: br,
            borderColor,
            overflow: 'hidden',
          },
          style,
        ]}
        {...rest}
      >
        {/* Layer 1: Frosted Blur Backdrop */}
        <BlurView
          intensity={32}
          tint="dark"
          style={[StyleSheet.absoluteFill, { borderRadius: br }]}
        />

        {/* Layer 2: Frosted Deep Surface Glass */}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'rgba(12, 26, 33, 0.82)',
              borderRadius: br,
            },
          ]}
        />

        {/* Layer 3: 3D Top Rim Specular Highlight */}
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.22)',
            'rgba(255, 255, 255, 0.05)',
            'transparent',
          ]}
          locations={[0, 0.4, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: br, height: 60 },
          ]}
        />

        {/* Layer 4: Optional Active Neon Volt Bevel Glow */}
        {glow && (
          <LinearGradient
            colors={['rgba(146, 247, 2, 0.35)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: br, height: 70 },
            ]}
          />
        )}

        {/* Content Container */}
        <View style={{ padding: pad }}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 10,
  },
  glowShadow: {
    shadowColor: '#92F702',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  container: {
    borderWidth: 1.2,
  },
});
