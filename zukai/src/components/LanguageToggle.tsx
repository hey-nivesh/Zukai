/**
 * ZUKAI LANGUAGE TOGGLE
 * Switches between English and Hinglish. Pill-shaped with spring animation.
 */

import React, { useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export type Language = 'english' | 'hinglish';

export interface LanguageToggleProps {
  value: Language;
  onChange: (lang: Language) => void;
}

export function LanguageToggle({ value, onChange }: LanguageToggleProps) {
  const { colors, motion, radius: r, spacing } = useTheme();
  const isHinglish = value === 'hinglish';
  const translateX = useSharedValue(isHinglish ? 1 : 0);

  const handlePress = useCallback((lang: Language) => {
    translateX.value = withSpring(lang === 'hinglish' ? 1 : 0, motion.spring.snappy);
    onChange(lang);
  }, [onChange, translateX, motion]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: translateX.value * 110,
      },
    ],
  }));

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: colors.canvas.surface,
          borderRadius: r.full,
          borderColor: colors.glass.borderLight,
          borderWidth: 1,
        },
      ]}
    >
      {/* Sliding Indicator */}
      <Animated.View
        style={[
          styles.knob,
          knobStyle,
          {
            backgroundColor: colors.brand.hero,
            borderRadius: r.full,
          },
        ]}
      />

      {/* English option */}
      <Pressable
        style={styles.option}
        onPress={() => handlePress('english')}
        accessibilityRole="radio"
        accessibilityState={{ checked: value === 'english' }}
      >
        <Text
          variant="callout"
          rawColor={value === 'english' ? colors.text.inverse : colors.text.secondary}
          style={{ fontWeight: '600' }}
        >
          English
        </Text>
      </Pressable>

      {/* Hinglish option */}
      <Pressable
        style={styles.option}
        onPress={() => handlePress('hinglish')}
        accessibilityRole="radio"
        accessibilityState={{ checked: value === 'hinglish' }}
      >
        <Text
          variant="callout"
          rawColor={value === 'hinglish' ? colors.text.inverse : colors.text.secondary}
          style={{ fontWeight: '600' }}
        >
          Hinglish
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: 48,
    width: 220,
    padding: 4,
    position: 'relative',
  },
  knob: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 106,
    height: 40,
    zIndex: 1,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});

