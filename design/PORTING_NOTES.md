# Zukai — React Native Porting Notes & Technical Guide
**Document Version:** 1.0.0  
**Target Platform:** React Native (Expo SDK 58, TypeScript, Android First)

---

## 1. Library Mapping Matrix

| Design Element | Web Prototype Equivalent | Recommended React Native / Expo Library |
| :--- | :--- | :--- |
| **Gradients** | CSS `linear-gradient` | `expo-linear-gradient` (`LinearGradient`) |
| **Mesh Glows & Blurs** | CSS `radial-gradient` + `blur()` | `@shopify/react-native-skia` (`Canvas`, `RadialGradient`, `BlurMask`) |
| **Glassmorphism Blur** | CSS `backdrop-filter: blur(24px)` | `expo-glass-effect` or `expo-blur` (`BlurView`) |
| **Button Animations & Shimmer** | CSS Keyframe Animations | `react-native-reanimated` (v4) with `useSharedValue` and `withRepeat` |
| **Tactile Haptic Feedback** | Web Audio / Vibration API | `expo-haptics` (`Haptics.impactAsync`, `Haptics.selectionAsync`) |
| **Mascot Graphics** | Placeholder Boxes in Mockups | `expo-image` (`<Image contentFit="contain" priority="high" />`) rendering 3D-style transparent PNGs |
| **Mascot Idle Animations** | CSS Keyframe Animations | `react-native-reanimated` (v4) code-driven float, scale, and glow pulse (NO SVG/Lottie) |
| **Typography & Fonts** | Google Fonts Link | `@expo-google-fonts/inter` + `expo-font` |
| **Audio Playback Engine** | Web Audio | `expo-av` or `react-native-track-player` (Background Audio Service) |

---

## 2. Shiny Button Component Architecture (`GlossButton.tsx`)

In React Native, CSS pseudo-elements (`::before`, `::after`) do not exist. The shiny button is assembled as a nested stack of positioned views:

```
[Pressable / Reanimated Container] (scale: pressed ? 0.97 : 1.0)
  ├── [Layer 4: Outer Glow Shadow] (Android elevation / Skia drop shadow)
  ├── [Layer 1: Base LinearGradient] (colors: ['#A4F924', '#92F702', '#75CE00'])
  │     ├── [Layer 2: Top Gloss LinearGradient] (height: 45%, borderBottomRadius: 50%)
  │     ├── [Layer 3: 1px Light Inner Border] (borderColor: 'rgba(255,255,255,0.35)')
  │     ├── [Layer 5 & 6: Moving Shimmer Bar] (Reanimated translateX: -120% -> 220%)
  │     └── [Content Container: Icon + Text]
```

### TypeScript Component Spec & Props API:
```typescript
export interface GlossButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  enableIdleShimmer?: boolean; // defaults to true for primary variant
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}
```

---

## 3. Ambient Mesh Background Component (`MeshBackground.tsx`)

On high-end devices, use Skia for hardware-accelerated radial glows:

```tsx
import { Canvas, Circle, RadialGradient, vec } from '@shopify/react-native-skia';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const MeshBackground: React.FC<{ variant: keyof typeof gradients.screenMesh }> = ({ variant }) => {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Canvas style={{ flex: 1 }}>
        <Circle cx={width * 0.85} cy={height * 0.15} r={340}>
          <RadialGradient
            c={vec(width * 0.85, height * 0.15)}
            r={340}
            colors={['rgba(146, 247, 2, 0.18)', 'transparent']}
          />
        </Circle>
        <Circle cx={width * 0.15} cy={height * 0.60} r={300}>
          <RadialGradient
            c={vec(width * 0.15, height * 0.60)}
            r={300}
            colors={['rgba(11, 248, 7, 0.12)', 'transparent']}
          />
        </Circle>
      </Canvas>
    </View>
  );
};
```

---

## 4. Performance Flags & Cheaper Fallbacks for Budget Android

Low-end Android devices (MediaTek Helio G-series, Snapdragon 680, 3GB–4GB RAM) struggle with stacking multiple real-time Gaussian blurs:

1. **`BlurView` Fallback:**  
   - *Expensive:* Stacking multiple nested `BlurView` instances with intensity > 40.  
   - *Cheap Fallback:* On Android devices where `Platform.OS === 'android' && Device.totalMemory < 4 * 1024 * 1024 * 1024`, replace `BlurView` with a semi-opaque solid color: `backgroundColor: 'rgba(15, 31, 38, 0.92)'`.
2. **Radial Glow Mesh Fallback:**  
   - *Expensive:* Continuous Skia shader updates.  
   - *Cheap Fallback:* Use a pre-baked static PNG asset (`assets/images/mesh-glow.png`) scaled to cover the background, or an SVG gradient with opacity.
3. **Button Idle Shimmer Throttling:**  
   - Deactivate the continuous 4-second idle loop on battery saver mode (`expo-battery`). Keep the light sweep strictly on user press (`onPressIn`).

---

## 5. Rendering & Animating 3D-Rendered Mascot PNGs (`expo-image` + Reanimated)

> [!IMPORTANT]
> **Format Decision:** Mascots are **NOT** vector SVG or Lottie. The final mascot assets are **3D-rendered-style PNG images with transparent backgrounds**. Any earlier SVG mascots were concept sketches only and are strictly excluded from the production mobile app.
>
> In production React Native code, mascots are rendered with **`expo-image`** for instant hardware-accelerated texture caching, and animated directly in UI thread code using **`react-native-reanimated`**. This approach achieves silky 60fps animations (float, scale, glow pulse) with zero JS thread contention and zero SVG DOM parsing overhead.

### Production React Native Mascot Component (`ZukeMascot.tsx`):
```tsx
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export type MascotPose =
  | 'welcome'
  | 'uploading'
  | 'thinking'
  | 'listening'
  | 'success'
  | 'error'
  | 'empty'
  | 'paywall'
  | 'offline';

const MASCOT_ASSETS: Record<MascotPose, any> = {
  welcome: require('../../assets/mascot/mascot-welcome.png'),
  uploading: require('../../assets/mascot/mascot-uploading.png'),
  thinking: require('../../assets/mascot/mascot-thinking.png'),
  listening: require('../../assets/mascot/mascot-listening.png'),
  success: require('../../assets/mascot/mascot-success.png'),
  error: require('../../assets/mascot/mascot-error.png'),
  empty: require('../../assets/mascot/mascot-empty.png'),
  paywall: require('../../assets/mascot/mascot-paywall.png'),
  offline: require('../../assets/mascot/mascot-offline.png'),
};

interface ZukeMascotProps {
  pose: MascotPose;
  size?: number; // e.g. 160, 200
  enableFloat?: boolean;
  enablePulse?: boolean;
}

export const ZukeMascot: React.FC<ZukeMascotProps> = ({
  pose,
  size = 160,
  enableFloat = true,
  enablePulse = true,
}) => {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.35);

  useEffect(() => {
    if (enableFloat) {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
    }

    if (enablePulse) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.025, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
          withTiming(1.0, { duration: 2200, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.75, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.35, { duration: 1800, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
    }
  }, [enableFloat, enablePulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Ambient Neon Backlight Halo */}
      <Animated.View
        style={[
          styles.glowHalo,
          { width: size * 0.8, height: size * 0.8, borderRadius: (size * 0.8) / 2 },
          glowStyle,
        ]}
      />
      {/* 3D-Rendered Mascot PNG Image */}
      <Animated.View style={animatedStyle}>
        <Image
          source={MASCOT_ASSETS[pose]}
          style={{ width: size, height: size }}
          contentFit="contain"
          priority="high"
          cachePolicy="memory-disk"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowHalo: {
    position: 'absolute',
    backgroundColor: '#92F702',
    filter: 'blur(24px)', // On Android: replaced with semi-transparent circle or Skia
  },
});
```

