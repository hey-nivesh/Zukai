/**
 * ZUKAI GLOBAL MINI PLAYER
 * Location: /zukai/src/components/GlobalMiniPlayer.tsx
 * Description: Floating glassmorphic mini-player anchored above the bottom tab bar.
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, Headphones, X } from 'lucide-react-native';
import { Text } from './Text';
import { Waveform } from './Waveform';
import { usePlaybackStore } from '@/features/playback/playbackStore';

const C = {
  brandHero: '#92F702',
  brandVisor: '#0BF807',
  canvasSurfaceRaised: '#132830',
  textPrimary: '#F8F9FA',
  textSecondary: '#B5C4CC',
  textTertiary: '#6B828F',
  textInverse: '#09161B',
  glassBorder: 'rgba(255,255,255,0.12)',
  glassBorderActive: 'rgba(146,247,2,0.40)',
};

export function GlobalMiniPlayer() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const { activeTrack, documentTitle, isPlaying, positionMs, durationMs, togglePlayPause, stop } =
    usePlaybackStore();

  // Hide if no active track or already on full player screen
  if (!activeTrack || pathname === '/player') {
    return null;
  }

  const progressFraction = durationMs > 0 ? Math.min(1, positionMs / durationMs) : 0;

  return (
    <View style={[styles.container, { bottom: insets.bottom + 68 }]}>
      <Pressable
        onPress={() => router.push('/player' as any)}
        style={styles.cardPressable}
        accessibilityLabel={`Mini player: ${documentTitle}`}
      >
        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.glassFill} />

        {/* Top Slim Progress Accent */}
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[C.brandHero, C.brandVisor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${Math.round(progressFraction * 100)}%` }]}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <Headphones size={18} color={C.brandHero} strokeWidth={2} />
          </View>

          <View style={styles.textWrap}>
            <Text variant="caption" rawColor={C.textPrimary} numberOfLines={1} style={{ fontWeight: '700' }}>
              {documentTitle}
            </Text>
            <Text variant="caption" rawColor={C.textTertiary} numberOfLines={1}>
              {isPlaying ? 'Playing • Zukai Audio' : 'Paused'}
            </Text>
          </View>

          <View style={styles.waveformWrap}>
            <Waveform barCount={10} height={18} active={isPlaying} />
          </View>

          {/* Play/Pause Toggle */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            style={styles.playBtn}
            hitSlop={8}
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={16} color={C.textInverse} strokeWidth={2.5} />
            ) : (
              <Play size={16} color={C.textInverse} strokeWidth={2.5} style={{ marginLeft: 2 }} />
            )}
          </Pressable>

          {/* Close / Dismiss */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              stop();
            }}
            style={styles.closeBtn}
            hitSlop={8}
            accessibilityLabel="Close mini player"
          >
            <X size={16} color={C.textTertiary} />
          </Pressable>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 90,
  },
  cardPressable: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.glassBorderActive,
    shadowColor: C.brandHero,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  glassFill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(13, 30, 36, 0.88)',
  },
  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: '100%',
  },
  progressFill: {
    height: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.canvasSurfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 1,
  },
  waveformWrap: {
    marginHorizontal: 4,
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.brandHero,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 6,
  },
});
