/**
 * ZUKAI SHINY BUTTON — 6-Layer Shine & Reflection Engine
 * Implements the full button anatomy from DESIGN_PRINCIPLES.md § 2.
 *
 * Layer Stack (bottom → top):
 *   1. Outer Glow Shadow (elevation / Skia)
 *   2. Base LinearGradient fill (#A4F924 → #92F702 → #75CE00)
 *   3. 1px Inner Light Rim stroke
 *   4. Top Gloss Half-Pill overlay (upper 45%)
 *   5. Moving Shimmer sweep bar (Reanimated, 1200ms, every 4000ms)
 *   6. Content (icon + label)
 *
 * All animation runs on the UI thread via Reanimated worklets.
 */

import React, { useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

// Haptics (optional — graceful degradation if not installed)
let Haptics: { impactAsync: (style: string) => Promise<void> } | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Haptics = require('expo-haptics');
} catch {}

// ─── Types ───────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'icon' | 'floating';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ShinyButtonProps {
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  enableIdleShimmer?: boolean;
  onPress: () => void;
  style?: object;
  fullWidth?: boolean;
}

// ─── Size Tokens ─────────────────────────────────────────────────────────────

const SIZE_MAP: Record<ButtonSize, { height: number; paddingH: number; fontSize: number; iconSize: number }> = {
  sm: { height: 40, paddingH: 16, fontSize: 14, iconSize: 16 },
  md: { height: 52, paddingH: 24, fontSize: 16, iconSize: 18 },
  lg: { height: 60, paddingH: 32, fontSize: 17, iconSize: 20 },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ShinyButton({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  enableIdleShimmer,
  onPress,
  style,
  fullWidth = false,
}: ShinyButtonProps) {
  const { colors, gradients, motion, radius: r } = useTheme();
  const sizeToken = SIZE_MAP[size];
  const br = r.lg;

  // Should idle shimmer run? Default true for primary, false for others
  const runShimmer = enableIdleShimmer ?? variant === 'primary';

  // ── Animation Values ────────────────────────────────────────────────────
  const pressScale = useSharedValue(1);
  const shimmerX = useSharedValue(-120);

  // Press spring animation
  const animatedContainer = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  // Shimmer translateX animation
  const animatedShimmer = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  // Start idle shimmer loop
  useEffect(() => {
    if (!runShimmer || disabled) return;

    const startShimmer = () => {
      shimmerX.value = withDelay(
        4000,
        withRepeat(
          withSequence(
            withTiming(300, { duration: 1200 }),
            withTiming(-120, { duration: 0 }),
          ),
          -1,
          false,
        ),
      );
    };
    startShimmer();
  }, [runShimmer, disabled, shimmerX]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const triggerHaptic = useCallback(() => {
    Haptics?.impactAsync('medium');
  }, []);

  const handlePressIn = useCallback(() => {
    pressScale.value = withSpring(motion.scale.pressed, motion.spring.snappy);
    runOnJS(triggerHaptic)();
  }, [pressScale, motion, triggerHaptic]);

  const handlePressOut = useCallback(() => {
    pressScale.value = withSpring(1, motion.spring.snappy);
  }, [pressScale, motion]);

  // ── Style resolution by variant ──────────────────────────────────────────
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isDestructive = variant === 'destructive';
  const isGhost = variant === 'tertiary';
  const isIcon = variant === 'icon';
  const isFloating = variant === 'floating';

  const isGlassStyle = isSecondary || isGhost;
  const outerGlowColor = isDestructive
    ? 'rgba(255,61,113,0.35)'
    : colors.glass.glowGreen;

  // ── Gradient selection ───────────────────────────────────────────────────
  let baseGradientColors: readonly string[];
  let baseGradientStart = { x: 0, y: 0 };
  let baseGradientEnd = { x: 1, y: 1 };

  if (isDestructive) {
    baseGradientColors = gradients.button.destructive.colors;
  } else if (isGlassStyle || isGhost) {
    baseGradientColors = gradients.button.secondaryGlass.colors;
    baseGradientStart = { x: 0, y: 0 };
    baseGradientEnd = { x: 0, y: 1 };
  } else {
    baseGradientColors = gradients.button.primary.colors;
  }

  const textColor = isGlassStyle || isGhost
    ? colors.text.primary
    : isDestructive
    ? '#fff'
    : colors.text.inverse;

  const iconColor = textColor;

  const iconWidth = isIcon ? sizeToken.height : undefined;
  const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 };

  return (
    <Animated.View
      style={[
        animatedContainer,
        fullWidth && styles.fullWidth,
        // Outer glow shadow (Android elevation on its own layer)
        isPrimary && {
          shadowColor: outerGlowColor,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 1,
          shadowRadius: 16,
          elevation: 10,
        },
        style,
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled || loading}
        hitSlop={hitSlop}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        style={[
          styles.pressable,
          {
            height: isIcon ? sizeToken.height : sizeToken.height,
            width: isIcon ? sizeToken.height : undefined,
            borderRadius: isIcon ? sizeToken.height / 2 : br,
            overflow: 'hidden',
            opacity: disabled ? 0.4 : 1,
          },
        ]}
      >
        {/* Layer 2: Base Gradient */}
        <LinearGradient
          colors={baseGradientColors as unknown as [string, string, ...string[]]}
          start={baseGradientStart}
          end={baseGradientEnd}
          style={StyleSheet.absoluteFill}
        />

        {/* Layer 3: 1px Inner Rim Border */}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: isIcon ? sizeToken.height / 2 : br,
              borderWidth: 1,
              borderColor: isPrimary
                ? 'rgba(255,255,255,0.35)'
                : 'rgba(255,255,255,0.12)',
            },
          ]}
        />

        {/* Layer 4: Gloss Top Half-Pill */}
        {isPrimary && (
          <LinearGradient
            colors={['rgba(255,255,255,0.40)', 'rgba(255,255,255,0.00)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[
              StyleSheet.absoluteFill,
              {
                height: '45%',
                borderTopLeftRadius: br,
                borderTopRightRadius: br,
              },
            ]}
          />
        )}

        {/* Layer 5: Moving Shimmer Bar */}
        {runShimmer && !disabled && (
          <Animated.View
            style={[
              styles.shimmerBar,
              animatedShimmer,
              { height: sizeToken.height },
            ]}
            pointerEvents="none"
          />
        )}

        {/* Layer 6: Content */}
        <View
          style={[
            styles.content,
            { paddingHorizontal: isIcon ? 0 : sizeToken.paddingH },
          ]}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={isPrimary ? colors.text.inverse : colors.brand.hero}
            />
          ) : (
            <>
              {icon && iconPosition === 'left' && (
                <View style={styles.iconLeft}>{icon}</View>
              )}
              {label && (
                <Text
                  variant="callout"
                  rawColor={textColor}
                  style={{ fontWeight: '600', fontSize: sizeToken.fontSize }}
                >
                  {label}
                </Text>
              )}
              {icon && iconPosition === 'right' && (
                <View style={styles.iconRight}>{icon}</View>
              )}
              {icon && !label && icon}
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressable: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconLeft: {
    marginRight: 4,
  },
  iconRight: {
    marginLeft: 4,
  },
  shimmerBar: {
    position: 'absolute',
    width: 32,
    backgroundColor: 'rgba(255,255,255,0.45)',
    transform: [{ skewX: '-25deg' }],
    top: 0,
    left: 0,
  },
});

