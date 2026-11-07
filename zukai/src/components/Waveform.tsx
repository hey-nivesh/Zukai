/**
 * ZUKAI WAVEFORM COMPONENT
 * Static audio-bar visualizer; bars animate with Reanimated when active.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';

export interface WaveformProps {
  barCount?: number;
  height?: number;
  color?: string;
  active?: boolean;
  amplitude?: number; // 0–1
}

function WaveBar({ delay, height, color, active }: {
  delay: number;
  height: number;
  color: string;
  active: boolean;
}) {
  const scaleY = useSharedValue(0.3);

  useEffect(() => {
    if (active) {
      scaleY.value = withDelay(
        delay,
        withRepeat(
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          -1,
          true,
        ),
      );
    } else {
      scaleY.value = withTiming(0.3, { duration: 300 });
    }
  }, [active, delay, scaleY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: 3,
          height,
          borderRadius: 2,
          backgroundColor: color,
          marginHorizontal: 2,
        },
        animStyle,
      ]}
    />
  );
}

export function Waveform({
  barCount = 20,
  height = 32,
  color,
  active = false,
  amplitude = 0.6,
}: WaveformProps) {
  const { colors } = useTheme();
  const barColor = color ?? colors.brand.hero;

  return (
    <View style={[styles.container, { height }]}>
      {Array.from({ length: barCount }).map((_, i) => (
        <WaveBar
          key={i}
          delay={i * 60}
          height={height}
          color={barColor}
          active={active}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

