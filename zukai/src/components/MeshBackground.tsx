/**
 * ZUKAI MESH BACKGROUND
 * Renders rich ambient radial glows + dark obsidian cyber base.
 * Provides authentic 3D spatial lighting and contrast across all screens.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import type { BackgroundMeshRecipe } from '../theme/tokens/gradients';

const { width, height } = Dimensions.get('window');

type MeshVariant = keyof ReturnType<typeof useTheme>['gradients']['screenMesh'];

interface MeshBackgroundProps {
  variant: MeshVariant;
  static?: boolean;
}

export function MeshBackground({ variant }: MeshBackgroundProps) {
  const { gradients } = useTheme();
  const recipe = (gradients.screenMesh[variant] || gradients.screenMesh.home) as BackgroundMeshRecipe;
  const baseColor = recipe.baseColor || '#071216';

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: baseColor }]} pointerEvents="none">
      {/* 1. Base Atmospheric Diagonal Gradient */}
      <LinearGradient
        colors={['rgba(13, 31, 38, 0.95)', baseColor, '#03080A']}
        locations={[0, 0.55, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 2. Top-Right Neon Volt Aura (3D key light) */}
      <View
        style={[
          s.glowOrb,
          {
            top: -height * 0.12,
            right: -width * 0.2,
            width: width * 0.9,
            height: width * 0.9,
            borderRadius: width * 0.45,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(146, 247, 2, 0.22)', 'rgba(11, 248, 7, 0.08)', 'transparent']}
          locations={[0, 0.45, 1]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* 3. Mid-Left Cyber Cyan / Teal Ambient (3D fill light) */}
      <View
        style={[
          s.glowOrb,
          {
            top: height * 0.38,
            left: -width * 0.3,
            width: width * 0.85,
            height: width * 0.85,
            borderRadius: width * 0.425,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(0, 176, 255, 0.14)', 'rgba(0, 230, 118, 0.05)', 'transparent']}
          locations={[0, 0.5, 1]}
          start={{ x: 0.4, y: 0.4 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* 4. Bottom Center Subtle Warm Tech Glow */}
      <View
        style={[
          s.glowOrb,
          {
            bottom: -height * 0.15,
            alignSelf: 'center',
            width: width * 1.1,
            height: height * 0.35,
            borderRadius: width * 0.55,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(146, 247, 2, 0.07)', 'rgba(15, 31, 38, 0.4)', 'transparent']}
          locations={[0, 0.4, 1]}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  glowOrb: {
    position: 'absolute',
    overflow: 'hidden',
  },
});
