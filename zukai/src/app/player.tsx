/**
 * ZUKAI — Full-Screen Audio Player Modal
 * Location: /zukai/src/app/player.tsx
 * Description: Interactive audio player with expo-av playback, waveform visualization,
 *              karaoke-synced transcripts, chapter jumping, and speed selection.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Share,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ChevronDown,
  Share2,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Bookmark,
  Headphones,
  List,
  FileText,
} from 'lucide-react-native';
import { MeshBackground } from '../components/MeshBackground';
import { GlassCard } from '../components/GlassCard';
import { Text } from '../components/Text';
import { Waveform } from '../components/Waveform';
import { usePlaybackStore } from '@/features/playback/playbackStore';

const C = {
  brandHero: '#92F702',
  brandVisor: '#0BF807',
  canvasSurface: '#0D1E24',
  canvasSurfaceRaised: '#132830',
  canvasSurfaceHighlight: '#18333D',
  textPrimary: '#F8F9FA',
  textSecondary: '#B5C4CC',
  textTertiary: '#6B828F',
  textInverse: '#09161B',
  glassBorder: 'rgba(255,255,255,0.14)',
  glassBorderActive: 'rgba(146,247,2,0.45)',
  divider: 'rgba(255,255,255,0.06)',
};

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 2.0];

function formatTime(millis: number): string {
  const totalSeconds = Math.max(0, Math.floor(millis / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

export default function PlayerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const transcriptScrollRef = useRef<any>(null);

  const [activeTab, setActiveTab] = useState<'chapters' | 'transcript'>('chapters');

  const {
    activeTrack,
    documentTitle,
    chapters,
    transcript,
    isPlaying,
    isBuffering,
    positionMs,
    durationMs,
    speed,
    activeChapterIndex,
    activeSentenceIndex,
    togglePlayPause,
    seekTo,
    skipBy,
    setSpeed,
    jumpToChapter,
    seekToSentence,
  } = usePlaybackStore();

  const progressFraction = durationMs > 0 ? Math.min(1, positionMs / durationMs) : 0;

  // Auto-scroll transcript when sentence changes
  useEffect(() => {
    if (activeTab === 'transcript' && activeSentenceIndex > 2) {
      transcriptScrollRef.current?.scrollTo({
        y: Math.max(0, (activeSentenceIndex - 2) * 64),
        animated: true,
      });
    }
  }, [activeSentenceIndex, activeTab]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Listening to "${documentTitle}" on Zukai — Audio learning, supercharged!`,
      });
    } catch {}
  };

  const handleProgressPress = (e: any) => {
    const { locationX } = e.nativeEvent;
    const trackWidth = Dimensions.get('window').width - 48;
    const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
    seekTo(ratio * durationMs);
  };

  const handleSpeedSelect = (s: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSpeed(s);
  };

  const transcriptSegments =
    transcript && Array.isArray(transcript.segments)
      ? (transcript.segments as Array<{ text: string; start_ms: number; end_ms: number }>)
      : [
          {
            text: 'Welcome to this audio breakdown. We will explore the key concepts, core findings, and actionable conclusions.',
            start_ms: 0,
            end_ms: 8000,
          },
          {
            text: 'Let us begin with the primary thesis of the document.',
            start_ms: 8000,
            end_ms: 16000,
          },
          {
            text: 'Notice how every complex mechanism connects back to a simple, intuitive mental model.',
            start_ms: 16000,
            end_ms: 24000,
          },
        ];

  const displayChapters =
    chapters.length > 0
      ? chapters
      : [
          {
            id: 'c1',
            title: '1. Executive Summary & Core Hook',
            start_seconds: 0,
            end_seconds: 120,
            position: 1,
            track_id: 'mock',
            summary: null,
          },
          {
            id: 'c2',
            title: '2. Deep Breakdown of Foundations',
            start_seconds: 120,
            end_seconds: 360,
            position: 2,
            track_id: 'mock',
            summary: null,
          },
          {
            id: 'c3',
            title: '3. Strategic Conclusions & Next Steps',
            start_seconds: 360,
            end_seconds: 600,
            position: 3,
            track_id: 'mock',
            summary: null,
          },
        ];

  return (
    <View style={s.root}>
      <MeshBackground variant="player" />

      {/* Drag handle */}
      <View style={[s.handle, { marginTop: insets.top + 8 }]} />

      {/* Header */}
      <View style={s.header}>
        <Pressable
          style={s.iconBtn}
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityLabel="Dismiss player"
        >
          <ChevronDown size={24} color={C.textSecondary} strokeWidth={2} />
        </Pressable>
        <Text variant="caption" rawColor={C.textTertiary} style={s.nowPlaying}>
          NOW PLAYING
        </Text>
        <Pressable
          style={s.iconBtn}
          onPress={handleShare}
          hitSlop={12}
          accessibilityLabel="Share track"
        >
          <Share2 size={20} color={C.textTertiary} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Artwork Card */}
        <GlassCard style={s.artworkCard}>
          <Headphones size={68} color={C.brandHero} strokeWidth={1.5} />
          <Text variant="caption" rawColor={C.textSecondary} style={{ marginTop: 8 }}>
            {activeTrack?.format?.toUpperCase() || 'AUDIO AI'}
          </Text>
        </GlassCard>

        {/* Track Info */}
        <View style={s.trackInfoRow}>
          <View style={s.trackInfoText}>
            <Text variant="headline" rawColor={C.textPrimary} style={s.trackTitle} numberOfLines={2}>
              {documentTitle || 'Audio Breakdown'}
            </Text>
            <Text variant="subhead" rawColor={C.textSecondary} style={s.trackAuthor}>
              Audio: {activeTrack?.format ? activeTrack.format.toUpperCase() : 'M4A'} • Zukai Neural AI
            </Text>
          </View>
          <Pressable style={s.iconBtn} hitSlop={8}>
            <Bookmark size={20} color={C.brandHero} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Waveform Visualizer */}
        <View style={s.waveformWrap}>
          <Waveform barCount={32} height={44} active={isPlaying} />
        </View>

        {/* Progress Bar with Touch Seeking */}
        <Pressable onPress={handleProgressPress} style={s.progressTouchArea}>
          <View style={s.progressTrack}>
            <LinearGradient
              colors={[C.brandHero, C.brandVisor]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[s.progressFill, { width: `${Math.round(progressFraction * 100)}%` }]}
            />
          </View>
        </Pressable>

        {/* Timestamps */}
        <View style={s.timeRow}>
          <Text variant="monoTime" rawColor={C.textSecondary}>
            {formatTime(positionMs)}
          </Text>
          <Text variant="monoTime" rawColor={C.textTertiary}>
            {durationMs > 0 ? `-${formatTime(Math.max(0, durationMs - positionMs))}` : '0:00'}
          </Text>
        </View>

        {/* Playback Speed Selector */}
        <View style={s.speedRow}>
          {SPEEDS.map((sp) => {
            const isSelected = Math.abs(speed - sp) < 0.05;
            return (
              <Pressable
                key={sp}
                onPress={() => handleSpeedSelect(sp)}
                style={[s.speedPill, isSelected && s.speedPillActive]}
              >
                <Text
                  variant="caption"
                  rawColor={isSelected ? C.textInverse : C.textSecondary}
                  style={{ fontWeight: '700', fontSize: 12 }}
                >
                  {sp}x
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Player Controls (15s Skip, Play/Pause) */}
        <View style={s.controls}>
          <Pressable
            style={s.controlBtn}
            onPress={() => skipBy(-15)}
            hitSlop={12}
            accessibilityLabel="Skip 15 seconds back"
          >
            <RotateCcw size={28} color={C.textSecondary} strokeWidth={2} />
          </Pressable>

          <Pressable
            onPress={togglePlayPause}
            hitSlop={8}
            accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            <LinearGradient
              colors={['#A4F924', '#92F702', '#75CE00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.playCircle}
            >
              {isBuffering ? (
                <ActivityIndicator size="small" color={C.textInverse} />
              ) : isPlaying ? (
                <Pause size={30} color={C.textInverse} strokeWidth={2.5} />
              ) : (
                <Play size={30} color={C.textInverse} strokeWidth={2.5} style={{ marginLeft: 3 }} />
              )}
            </LinearGradient>
          </Pressable>

          <Pressable
            style={s.controlBtn}
            onPress={() => skipBy(15)}
            hitSlop={12}
            accessibilityLabel="Skip 15 seconds forward"
          >
            <RotateCw size={28} color={C.textSecondary} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Segmented Switcher (Chapters vs Karaoke Transcript) */}
        <View style={s.segmentedControl}>
          <Pressable
            style={[s.segmentBtn, activeTab === 'chapters' && s.segmentBtnActive]}
            onPress={() => setActiveTab('chapters')}
          >
            <List size={14} color={activeTab === 'chapters' ? C.brandHero : C.textTertiary} />
            <Text
              variant="caption"
              rawColor={activeTab === 'chapters' ? C.brandHero : C.textTertiary}
              style={{ fontWeight: '700' }}
            >
              Chapters ({displayChapters.length})
            </Text>
          </Pressable>

          <Pressable
            style={[s.segmentBtn, activeTab === 'transcript' && s.segmentBtnActive]}
            onPress={() => setActiveTab('transcript')}
          >
            <FileText size={14} color={activeTab === 'transcript' ? C.brandHero : C.textTertiary} />
            <Text
              variant="caption"
              rawColor={activeTab === 'transcript' ? C.brandHero : C.textTertiary}
              style={{ fontWeight: '700' }}
            >
              Karaoke Transcript
            </Text>
          </Pressable>
        </View>

        {/* Tab Content 1: Chapters */}
        {activeTab === 'chapters' && (
          <View style={s.tabContainer}>
            {displayChapters.map((ch, idx) => {
              const isCurrent = idx === activeChapterIndex;
              return (
                <Pressable
                  key={ch.id || idx}
                  onPress={() => jumpToChapter(idx)}
                  style={{ width: '100%', marginBottom: 8 }}
                >
                  <GlassCard style={[s.chapterCard, isCurrent && s.chapterActive]}>
                    {isCurrent && <View style={s.chapterAccent} />}
                    <View style={s.chapterContent}>
                      <Text
                        variant="subhead"
                        rawColor={isCurrent ? C.textPrimary : C.textSecondary}
                        style={{ fontWeight: isCurrent ? '700' : '500' }}
                      >
                        {ch.title}
                      </Text>
                      <Text variant="monoTime" rawColor={isCurrent ? C.brandHero : C.textTertiary}>
                        {formatTime(ch.start_seconds * 1000)}
                      </Text>
                    </View>
                  </GlassCard>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Tab Content 2: Karaoke Transcript */}
        {activeTab === 'transcript' && (
          <ScrollView
            ref={transcriptScrollRef}
            style={s.transcriptScroll}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {transcriptSegments.map((seg, idx) => {
              const isCurrent = idx === activeSentenceIndex;
              return (
                <Pressable
                  key={idx}
                  onPress={() => seekToSentence(idx)}
                  style={[s.transcriptSentence, isCurrent && s.transcriptSentenceActive]}
                >
                  {isCurrent && <View style={s.transcriptGlowPill} />}
                  <Text
                    variant="body"
                    rawColor={isCurrent ? C.textPrimary : C.textTertiary}
                    style={{
                      lineHeight: 22,
                      fontWeight: isCurrent ? '700' : '400',
                      letterSpacing: 0.2,
                    }}
                  >
                    {seg.text}
                  </Text>
                  <Text variant="monoTime" rawColor={isCurrent ? C.brandHero : C.divider}>
                    {formatTime(seg.start_ms)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050D10' },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  nowPlaying: { letterSpacing: 2, fontWeight: '700' },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, alignItems: 'center', gap: 16 },
  artworkCard: {
    width: 150,
    height: 150,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: C.glassBorderActive,
    shadowColor: C.brandHero,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  trackInfoRow: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 12 },
  trackInfoText: { flex: 1 },
  trackTitle: { marginBottom: 4 },
  trackAuthor: { fontSize: 13 },
  waveformWrap: {
    width: '100%',
    shadowColor: C.brandHero,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  progressTouchArea: { width: '100%', paddingVertical: 10 },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: C.canvasSurfaceHighlight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 3, minWidth: 6 },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: -8,
  },
  speedRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  speedPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: C.canvasSurfaceHighlight,
  },
  speedPillActive: { backgroundColor: C.brandHero },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 36,
    marginVertical: 4,
  },
  controlBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  playCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.brandHero,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: C.canvasSurfaceRaised,
    borderRadius: 24,
    padding: 4,
    width: '100%',
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(146,247,2,0.12)',
    borderWidth: 1,
    borderColor: C.brandHero,
  },
  tabContainer: { width: '100%' },
  chapterCard: {
    width: '100%',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  chapterActive: { borderColor: C.glassBorderActive },
  chapterAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: C.brandHero,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  chapterContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 6,
  },
  transcriptScroll: { width: '100%', maxHeight: 220 },
  transcriptSentence: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    position: 'relative',
    gap: 4,
  },
  transcriptSentenceActive: {
    backgroundColor: 'rgba(146,247,2,0.08)',
    borderLeftWidth: 3,
    borderLeftColor: C.brandHero,
  },
  transcriptGlowPill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: C.brandHero,
  },
});
