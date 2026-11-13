/**
 * ZUKAI — Home Dashboard Screen
 * Connected to live Supabase data layer via TanStack Query hooks.
 * Displays stats, hero player, and recent documents.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  Play,
  ChevronRight,
  FileText,
  Pause,
  RefreshCw,
  Upload,
  BookOpen,
  Download,
  Star,
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { MeshBackground } from '../../components/MeshBackground';
import { GlassCard } from '../../components/GlassCard';
import { Text } from '../../components/Text';
import { Mascot } from '../../components/Mascot';
import { BrandLogo } from '../../components/BrandLogo';
import { EmptyState } from '../../components/EmptyState';
import { useLibrary } from '@/features/library/hooks/useLibrary';
import { useUsageSummary } from '@/features/usage/hooks/useUsageSummary';
import { useAuthStore } from '@/lib/authStore';
import { usePlaybackStore } from '@/features/playback/playbackStore';
import { supabase } from '@/lib/supabase';

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
  glassBorderActive: 'rgba(146,247,2,0.45)',
  success: '#00E676',
  warning: '#FFD600',
  error: '#FF5252',
};

function PulsingDot() {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.3, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1,
      false
    );
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.pulseDot, style]} />;
}

function StatusChip({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.statusChip, { borderColor: color + '55', backgroundColor: color + '20' }]}>
      <Text variant="caption" rawColor={color} style={styles.statusText}>{label}</Text>
    </View>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

interface QuickAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}

interface ActiveJob {
  id: string;
  status: string;
  created_at: string;
}

interface LearningStats {
  total_minutes: number;
  tracks_completed: number;
  streak_days: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  const { activeTrack, isPlaying: isStorePlaying, playTrack, togglePlayPause } = usePlaybackStore();

  const { data: libraryItems = [], isLoading: isLoadingLibrary, error: libraryError, refetch: refetchLibrary } = useLibrary();
  const { data: usageSummary, isLoading: isLoadingUsage } = useUsageSummary();

  const [learningStats, setLearningStats] = useState<LearningStats | null>(null);

  useEffect(() => {
    supabase.rpc('get_learning_stats').then(({ data }) => {
      if (data) setLearningStats(data as LearningStats);
    });
  }, []);

  const { data: activeJobs = [] } = useQuery<ActiveJob[]>({
    queryKey: ['active-jobs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('audio_jobs')
        .select('id, status, created_at')
        .not('status', 'in', '(ready,failed,canceled)')
        .order('created_at', { ascending: false });
      return (data ?? []) as ActiveJob[];
    },
    refetchInterval: 5000,
    staleTime: 0,
  });

  const greetingName = profile?.full_name ? profile.full_name.split(' ')[0] : 'there';
  const readyItems = libraryItems.filter((i) => i.track && i.document.status === 'ready');
  const activeHeroItem = readyItems[0] || libraryItems[0];
  const isHeroPlaying = Boolean(activeHeroItem?.track && activeTrack?.id === activeHeroItem.track.id && isStorePlaying);

  const quickActions: QuickAction[] = [
    {
      key: 'upload',
      label: 'Upload',
      icon: <Upload size={20} color={C.brandHero} strokeWidth={2} />,
      onPress: () => router.push('/(tabs)/upload'),
    },
    {
      key: 'library',
      label: 'Library',
      icon: <BookOpen size={20} color={C.brandHero} strokeWidth={2} />,
      onPress: () => router.push('/(tabs)/library'),
    },
    {
      key: 'downloads',
      label: 'Downloads',
      icon: <Download size={20} color={C.brandHero} strokeWidth={2} />,
      onPress: () =>
        Alert.alert('Downloads', 'Open the Library tab and tap the download icon on any track.'),
    },
    {
      key: 'favorites',
      label: 'Favorites',
      icon: <Star size={20} color={C.brandHero} strokeWidth={2} />,
      onPress: () =>
        Alert.alert('Favorites', 'Tap the star icon on any document to favorite it.'),
    },
  ];

  return (
    <View style={styles.root}>
      <MeshBackground variant="home" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Bar with BrandLogo & User Profile */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <BrandLogo size={40} showText={false} />
            <View style={{ marginLeft: 10 }}>
              <Text variant="caption" rawColor={C.textTertiary} style={styles.greetingCaption}>
                WELCOME BACK
              </Text>
              <Text variant="title2" rawColor={C.textPrimary} style={styles.greetingTitle}>
                {greetingName}
              </Text>
            </View>
          </View>
          <Pressable style={styles.bellBtn} onPress={() => router.push('/(tabs)/settings')}>
            <Bell size={20} color={C.textSecondary} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statBox}>
            <Text variant="monoCounter" rawColor={C.brandHero}>
              {usageSummary?.documents_count ?? libraryItems.length}
            </Text>
            <Text variant="caption" rawColor={C.textTertiary} style={{ marginTop: 4 }}>
              Documents
            </Text>
          </GlassCard>
          <GlassCard style={styles.statBox}>
            <Text variant="monoCounter" rawColor={C.brandHero}>
              {formatMinutes(learningStats?.total_minutes ?? 0)}
            </Text>
            <Text variant="caption" rawColor={C.textTertiary} style={{ marginTop: 4 }}>
              Listened
            </Text>
          </GlassCard>
          <GlassCard style={styles.statBox}>
            <Text variant="monoCounter" rawColor={C.brandHero}>
              {learningStats?.streak_days ?? 0}
            </Text>
            <Text variant="caption" rawColor={C.textTertiary} style={{ marginTop: 4 }}>
              Day Streak
            </Text>
          </GlassCard>
        </View>

        {/* Quick Actions Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsRow}
          style={styles.quickActionsScroll}
        >
          {quickActions.map((action) => (
            <Pressable key={action.key} style={styles.quickActionChip} onPress={action.onPress}>
              {action.icon}
              <Text variant="caption" rawColor={C.textSecondary} style={styles.quickActionLabel}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* In-Progress Jobs Banner */}
        {activeJobs.length > 0 && (
          <Pressable
            style={styles.jobsBanner}
            onPress={() => router.push(`/processing/${activeJobs[0].id}` as Parameters<typeof router.push>[0])}
          >
            <PulsingDot />
            <Text variant="subhead" rawColor={C.textPrimary} style={{ flex: 1, marginLeft: 8 }}>
              {`${activeJobs.length} explanation${activeJobs.length > 1 ? 's' : ''} generating…`}
            </Text>
            <ChevronRight size={16} color={C.textTertiary} />
          </Pressable>
        )}

        {/* Loading State */}
        {(isLoadingLibrary || isLoadingUsage) && (
          <GlassCard style={styles.loadingCard}>
            <ActivityIndicator size="small" color={C.brandHero} />
            <Text variant="subhead" rawColor={C.textSecondary} style={{ marginTop: 8 }}>
              Synchronizing your learning library...
            </Text>
          </GlassCard>
        )}

        {/* Error State */}
        {libraryError && (
          <GlassCard style={styles.errorCard}>
            <Text variant="headline" rawColor={C.error}>Unable to load library</Text>
            <Text variant="footnote" rawColor={C.textTertiary} style={{ marginTop: 4, marginBottom: 12 }}>
              {libraryError.message || 'Check your internet connection and try again.'}
            </Text>
            <Pressable onPress={() => refetchLibrary()} style={styles.retryBtn}>
              <RefreshCw size={14} color={C.brandHero} />
              <Text variant="caption" rawColor={C.brandHero}>Retry</Text>
            </Pressable>
          </GlassCard>
        )}

        {/* Hero Player (if any track is available) */}
        {!isLoadingLibrary && activeHeroItem && (
          <Pressable onPress={() => router.push('/player' as Parameters<typeof router.push>[0])}>
            <View style={styles.heroWrapper}>
              <LinearGradient
                colors={['rgba(19,40,48,0.92)', 'rgba(9,22,27,0.98)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <View style={styles.heroBorderAccent} />
                <View style={styles.heroBadge}>
                  <PulsingDot />
                  <Text variant="caption" rawColor={C.brandHero} style={styles.badgeText}>
                    {activeHeroItem.track ? 'READY TO LISTEN' : 'PROCESSING'}
                  </Text>
                </View>
                <Text variant="headline" rawColor={C.textPrimary} style={{ marginBottom: 4 }} numberOfLines={2}>
                  {activeHeroItem.document.title}
                </Text>
                <Text variant="footnote" rawColor={C.textSecondary} style={{ marginBottom: 14 }}>
                  {activeHeroItem.document.original_filename}
                </Text>
                <View style={styles.progressTrack}>
                  <LinearGradient
                    colors={[C.brandHero, C.brandVisor]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[
                      styles.progressFill,
                      {
                        width: activeHeroItem.track
                          ? `${Math.min(100, Math.round(((activeHeroItem.progress?.position_seconds ?? 0) / (activeHeroItem.track.duration_seconds || 1)) * 100))}%`
                          : '40%',
                      },
                    ]}
                  />
                </View>
                <View style={styles.heroControls}>
                  <Text variant="monoTime" rawColor={C.textTertiary}>
                    {activeHeroItem.track
                      ? `${formatDuration(Math.round(activeHeroItem.progress?.position_seconds ?? 0))} / ${formatDuration(activeHeroItem.track.duration_seconds)}`
                      : 'Converting to audio...'}
                  </Text>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      if (activeHeroItem.track) {
                        if (activeTrack?.id === activeHeroItem.track.id) {
                          togglePlayPause();
                        } else {
                          playTrack(activeHeroItem.track, activeHeroItem.document.title);
                        }
                      }
                    }}
                  >
                    <LinearGradient
                      colors={['#A4F924', '#92F702', '#75CE00']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={styles.playCircle}
                    >
                      {isHeroPlaying
                        ? <Pause size={18} color={C.textInverse} strokeWidth={2.5} />
                        : <Play size={18} color={C.textInverse} strokeWidth={2.5} />}
                    </LinearGradient>
                  </Pressable>
                </View>
              </LinearGradient>
            </View>
          </Pressable>
        )}

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text variant="title3" rawColor={C.textPrimary}>Recent Documents</Text>
          <Pressable onPress={() => router.push('/(tabs)/library')}>
            <Text variant="subhead" rawColor={C.brandHero}>See all</Text>
          </Pressable>
        </View>

        {/* Document List */}
        {!isLoadingLibrary && libraryItems.length > 0 && (
          libraryItems.slice(0, 5).map((item) => {
            const isReady = item.document.status === 'ready';
            const isFailed = item.document.status === 'failed';
            const statusLabel = isReady ? 'READY' : isFailed ? 'FAILED' : 'QUEUED';
            const statusColor = isReady ? C.success : isFailed ? C.error : C.warning;
            const fileSizeMb = (item.document.file_size_bytes / (1024 * 1024)).toFixed(1);
            const durationMin = item.track ? `${Math.round(item.track.duration_seconds / 60)} min` : `${item.document.page_count ?? 1} pages`;

            return (
              <Pressable
                key={item.document.id}
                onPress={() => {
                  if (item.track && isReady) {
                    playTrack(item.track, item.document.title);
                    router.push('/player' as Parameters<typeof router.push>[0]);
                  } else if (isFailed) {
                    router.push('/(tabs)/upload');
                  }
                }}
                style={styles.docPressable}
              >
                <GlassCard style={styles.docCard}>
                  <View style={styles.docIcon}>
                    <FileText size={20} color={C.brandHero} strokeWidth={2} />
                  </View>
                  <View style={styles.docCenter}>
                    <Text variant="headline" rawColor={C.textPrimary} numberOfLines={1} ellipsizeMode="tail">
                      {item.document.title}
                    </Text>
                    <Text variant="footnote" rawColor={C.textTertiary}>
                      {item.document.mime_type.includes('pdf') ? 'PDF' : 'DOCX'} • {fileSizeMb} MB • {durationMin}
                    </Text>
                  </View>
                  <View style={styles.docRight}>
                    <StatusChip label={statusLabel} color={statusColor} />
                    <ChevronRight size={16} color={C.textTertiary} />
                  </View>
                </GlassCard>
              </Pressable>
            );
          })
        )}

        {/* Empty State */}
        {!isLoadingLibrary && libraryItems.length === 0 && !libraryError && (
          <EmptyState
            pose="welcome"
            title="Your library is empty"
            message="Upload your first document (PDF or DOCX) to get an interactive audio explanation."
            actionLabel="Upload Document"
            onAction={() => router.push('/(tabs)/upload')}
          />
        )}

        {/* Mascot Footer */}
        {libraryItems.length > 0 && (
          <View style={styles.mascotArea}>
            <Mascot pose="listening" size={90} animated />
            <Text variant="caption" rawColor={C.textTertiary} style={{ textAlign: 'center' }}>
              Zuke is ready with your next audio breakdown!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09161B' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  topBarLeft: { flexDirection: 'row', alignItems: 'center' },
  greetingCaption: { letterSpacing: 1.2, fontWeight: '700', fontSize: 10 },
  greetingTitle: { marginTop: 1, fontWeight: '800' },
  bellBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1.2, borderColor: 'rgba(255, 255, 255, 0.12)', alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  statBox: { flex: 1, padding: 18, borderRadius: 20 },
  quickActionsScroll: { marginBottom: 12 },
  quickActionsRow: { gap: 8, paddingVertical: 4 },
  quickActionChip: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(19,40,48,0.80)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    minWidth: 72,
  },
  quickActionLabel: { fontSize: 11 },
  jobsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(19,40,48,0.90)',
    borderWidth: 1,
    borderColor: 'rgba(146,247,2,0.40)',
    marginBottom: 12,
  },
  loadingCard: { padding: 24, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
  errorCard: { padding: 16, borderRadius: 16, marginBottom: 20, borderColor: 'rgba(255,82,82,0.3)' },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroWrapper: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.glassBorderActive, marginBottom: 24, elevation: 8, shadowColor: C.brandHero, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16 },
  heroCard: { padding: 18, position: 'relative' },
  heroBorderAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: C.brandHero, borderTopLeftRadius: 20, borderBottomLeftRadius: 20 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  pulseDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.brandHero },
  badgeText: { fontSize: 10, letterSpacing: 1, fontWeight: '700' },
  progressTrack: { height: 4, backgroundColor: C.canvasSurfaceHighlight, borderRadius: 2, marginBottom: 14, overflow: 'hidden' },
  progressFill: { height: 4, minWidth: '10%', borderRadius: 2 },
  heroControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  docPressable: { marginBottom: 10 },
  docCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, gap: 12 },
  docIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.canvasSurfaceRaised, alignItems: 'center', justifyContent: 'center' },
  docCenter: { flex: 1, gap: 2 },
  docRight: { alignItems: 'flex-end', gap: 6 },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  mascotArea: { alignItems: 'center', marginTop: 24, gap: 8 },
});
