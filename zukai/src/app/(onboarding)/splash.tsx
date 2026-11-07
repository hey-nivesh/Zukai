/**
 * ZUKAI — Animated Splash Screen
 * Features the official cybernetic brand logo with ambient glow & pulse animation.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
} from 'react-native-reanimated';
import { MeshBackground } from '../../components/MeshBackground';
import { Text } from '../../components/Text';

const C = {
  brandHero: '#92F702',
  textSecondary: '#B8CED9',
  textTertiary: '#718E9E',
};

export default function SplashScreen() {
  const router = useRouter();
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const title = useSharedValue(0);
  const subtitle = useSharedValue(0);
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: title.value,
    transform: [{ translateY: (1 - title.value) * 16 }],
  }));
  const subtitleStyle = useAnimatedStyle(() => ({ opacity: subtitle.value }));
  const dot1Style = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: dot3.value }));

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value = withTiming(1, { duration: 700 });
    title.value = withDelay(300, withTiming(1, { duration: 700 }));
    subtitle.value = withDelay(600, withTiming(1, { duration: 600 }));
    dot1.value = withDelay(800, withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1, false));
    dot2.value = withDelay(1000, withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1, false));
    dot3.value = withDelay(1200, withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1, false));

    const timer = setTimeout(() => {
      router.replace('/(onboarding)/onboarding');
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={s.root}>
      <MeshBackground variant="splash" />
      <View style={s.center}>
        <Animated.View style={[s.logoWrapper, logoStyle]}>
          <View style={s.glowBackdrop} />
          <Image
            source={require('../../assets/brand/logo.png')}
            style={s.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={titleStyle}>
          <Text variant="displayXl" rawColor={C.brandHero} style={s.appName}>
            ZUKAI
          </Text>
        </Animated.View>

        <Animated.View style={subtitleStyle}>
          <Text variant="callout" rawColor={C.textSecondary} style={s.tagline}>
            AI Audio Learning
          </Text>
        </Animated.View>

        <View style={s.dots}>
          <Animated.View style={[s.dot, dot1Style]} />
          <Animated.View style={[s.dot, dot2Style]} />
          <Animated.View style={[s.dot, dot3Style]} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050D10',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#92F702',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 14,
  },
  glowBackdrop: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(146, 247, 2, 0.22)',
  },
  logoImage: {
    width: 124,
    height: 124,
  },
  appName: {
    fontSize: 46,
    letterSpacing: 10,
    fontWeight: '900',
  },
  tagline: {
    letterSpacing: 3,
    marginTop: 4,
    marginBottom: 28,
    textTransform: 'uppercase',
    fontSize: 13,
  },
  dots: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#92F702',
  },
});
