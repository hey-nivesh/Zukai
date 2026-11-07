/**
 * ZUKAI MASCOT COMPONENT
 * Renders a 3D-style PNG mascot with idle Reanimated animations:
 *   - Gentle vertical float (translateY ±6dp)
 *   - Soft scale breathe (0.97 ↔ 1.03)
 *   - Pulsing neon glow behind (opacity 0.4 ↔ 0.9)
 * Respects reduced-motion accessibility setting.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { mascotImages, type MascotPose } from '../assets/mascot/index';
import { useTheme } from '../theme/ThemeProvider';

export interface MascotProps {
  pose: MascotPose;
  size?: number;
  /** Enable idle float/breathe/glow animations */
  animated?: boolean;
  style?: object;
  accessibilityLabel?: string;
}

export function Mascot({
  pose,
  size = 200,
  animated = true,
  style,
  accessibilityLabel,
}: MascotProps) {
  const { colors } = useTheme();
  const reducedMotion = useRef(false);

  // Check accessibility preference
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((val) => {
      reducedMotion.current = val;
    });
  }, []);

  // ── Shared Animation Values ───────────────────────────────────────────────
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    if (!animated || reducedMotion.current) return;

    // Float up/down — 3s cycle
    translateY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(6, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    // Breathe scale — 2.4s cycle
    scale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.97, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    // Glow pulse — 2s cycle
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.35, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(scale);
      cancelAnimation(glowOpacity);
    };
  }, [animated, translateY, scale, glowOpacity]);

  const animatedMascotStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const imageSource = mascotImages[pose];

  return (
    <View
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}
      accessible
      accessibilityLabel={accessibilityLabel ?? `Zuke mascot — ${pose}`}
      accessibilityRole="image"
    >
      {/* Neon glow behind mascot */}
      <Animated.View
        style={[
          styles.glow,
          animatedGlowStyle,
          {
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: size * 0.35,
            backgroundColor: colors.brand.hero,
          },
        ]}
        pointerEvents="none"
      />

      {/* 3D PNG mascot image */}
      <Animated.View style={[{ width: size, height: size }, animatedMascotStyle]}>
        <Image
          source={imageSource}
          style={{ width: size, height: size }}
          contentFit="contain"
          priority="high"
          transition={150}
          accessibilityIgnoresInvertColors
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    // Soft radial glow effect via shadow on iOS, elevation tint on Android
    shadowColor: '#92F702',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 0,
    zIndex: 0,
  },
});

