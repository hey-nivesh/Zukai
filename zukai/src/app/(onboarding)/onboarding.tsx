/**
 * ZUKAI — Onboarding Slides (3-step)
 * 3D Glassmorphic Experience with Generous Spacing and Dynamic Mascot Animations.
 */

import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { MeshBackground } from '../../components/MeshBackground';
import { GlassCard } from '../../components/GlassCard';
import { Text } from '../../components/Text';
import { Mascot } from '../../components/Mascot';
import { ShinyButton } from '../../components/ShinyButton';
import type { MascotPose } from '../../assets/mascot';

const C = {
  brandHero: '#92F702',
  textPrimary: '#FFFFFF',
  textSecondary: '#B8CED9',
  textTertiary: '#718E9E',
};

interface SlideData {
  pose: MascotPose;
  badge: string;
  title: string;
  body: string;
}

const SLIDES: SlideData[] = [
  {
    pose: 'uploading',
    badge: 'INSTANT INGESTION',
    title: 'Upload Any Document',
    body: 'Drop PDFs, Word documents, lecture slides, or raw notes. Zukai breaks down dense text in seconds.',
  },
  {
    pose: 'thinking',
    badge: 'AI INTELLIGENCE',
    title: 'Understand in Minutes',
    body: 'Complex theories distilled into conversational English or Hinglish audio with analogies and key takeaways.',
  },
  {
    pose: 'listening',
    badge: 'AUDIO COMPANION',
    title: 'Learn While You Move',
    body: 'Listen on your commute, at the gym, or before sleep. Follow along with karaoke transcripts and chapter navigation.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);
  const opacity = useSharedValue(1);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const goTo = (idx: number) => {
    opacity.value = withTiming(0, { duration: 160 }, () => {
      opacity.value = withTiming(1, { duration: 220 });
    });
    setTimeout(() => setCurrent(idx), 160);
  };

  const handleNext = () => {
    if (current < SLIDES.length - 1) {
      goTo(current + 1);
    } else {
      router.replace('/(auth)/sign-in');
    }
  };

  const slide = SLIDES[current];

  return (
    <View style={s.root}>
      <MeshBackground variant="onboarding" />

      {/* Top Bar with Skip */}
      <View style={[s.topBar, { paddingTop: insets.top + 16 }]}>
        <View style={s.stepPill}>
          <Text variant="caption" rawColor={C.brandHero} style={s.stepText}>
            STEP {current + 1} OF 3
          </Text>
        </View>
        <Pressable onPress={() => router.replace('/(auth)/sign-in')} hitSlop={12}>
          <Text variant="subhead" rawColor={C.textSecondary} style={{ fontWeight: '600' }}>
            Skip
          </Text>
        </Pressable>
      </View>

      {/* Main Slide Animated Content */}
      <Animated.View style={[s.content, contentStyle]}>
        {/* Animated 3D Mascot */}
        <View style={s.mascotWrap}>
          <Mascot pose={slide.pose} size={180} animated />
        </View>

        {/* 3D Glass Information Card */}
        <GlassCard style={s.infoCard} padding={24} borderRadius={24}>
          <View style={s.badgeWrap}>
            <Text variant="caption" rawColor={C.brandHero} style={s.badgeText}>
              {slide.badge}
            </Text>
          </View>
          <Text variant="title1" rawColor={C.textPrimary} style={s.title}>
            {slide.title}
          </Text>
          <Text variant="body" rawColor={C.textSecondary} style={s.body}>
            {slide.body}
          </Text>
        </GlassCard>
      </Animated.View>

      {/* Bottom Bar: Indicators & Button */}
      <View style={[s.bottom, { paddingBottom: insets.bottom + 28 }]}>
        {/* Neon Indicator Dots */}
        <View style={s.dotsRow}>
          {SLIDES.map((_, i) => (
            <Pressable key={i} onPress={() => goTo(i)} hitSlop={8}>
              <View style={[s.dot, i === current && s.dotActive]} />
            </Pressable>
          ))}
        </View>

        {/* Next / Get Started Action */}
        <ShinyButton
          label={current === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleNext}
          style={s.ctaBtn}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#071216',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  stepPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(146, 247, 2, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(146, 247, 2, 0.25)',
  },
  stepText: {
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  mascotWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  infoCard: {
    width: '100%',
    alignItems: 'center',
  },
  badgeWrap: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 12,
  },
  badgeText: {
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  title: {
    textAlign: 'center',
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  body: {
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  bottom: {
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
  },
  dotActive: {
    width: 28,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#92F702',
    shadowColor: '#92F702',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  ctaBtn: {
    height: 56,
  },
});
