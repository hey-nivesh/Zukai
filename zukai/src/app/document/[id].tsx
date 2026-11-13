/**
 * ZUKAI — Document Detail Screen [id]
 * Metadata grid, episode list, play button, and document actions.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MoreVertical, Play, Share2, Trash2, Headphones } from 'lucide-react-native';
import { MeshBackground } from '../../components/MeshBackground';
import { GlassCard } from '../../components/GlassCard';
import { Text } from '../../components/Text';
import { ShinyButton } from '../../components/ShinyButton';
import { AudioFeedbackCard } from '../../components/AudioFeedbackCard';
import { useDocument, useSoftDeleteDocument } from '@/features/documents/hooks/useDocuments';
import { usePlaybackStore } from '@/features/playback/playbackStore';
import { fetchTracksByDocumentId, fetchChapters, AudioTrackRow, ChapterRow } from '@/features/tracks/api/tracksApi';
import { useAuthStore } from '@/lib/authStore';

const C = {
  brandHero: '#92F702',
  brandVisor: '#0BF807',
  canvasSurfaceRaised: '#132830',
  canvasSurfaceHighlight: '#18333D',
  textPrimary: '#F8F9FA',
  textSecondary: '#B5C4CC',
  textTertiary: '#6B828F',
  textInverse: '#09161B',
  glassBorder: 'rgba(255,255,255,0.14)',
  glassBorderActive: 'rgba(146,247,2,0.45)',
  error: '#FF3D71',
};

function formatSeconds(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function DocumentDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);

  const { data: doc, isLoading: isDocLoading } = useDocument(id || '');
  const deleteMutation = useSoftDeleteDocument();
  const { playTrack } = usePlaybackStore();

  const [tracks, setTracks] = useState<AudioTrackRow[]>([]);
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setIsLoadingTracks(true);
    fetchTracksByDocumentId(id)
      .then(async (fetchedTracks) => {
        if (!isMounted) return;
        setTracks(fetchedTracks);
        if (fetchedTracks.length > 0) {
          const ch = await fetchChapters(fetchedTracks[0].id);
          if (isMounted) setChapters(ch);
        }
      })
      .catch((err) => console.warn('Failed to load tracks for doc:', err?.message))
      .finally(() => {
        if (isMounted) setIsLoadingTracks(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const activeTrack = tracks[0] || null;

  const handlePlayFull = async () => {
    if (!activeTrack) return;
    try {
      setIsPlaying(true);
      await playTrack(activeTrack, doc?.title || 'Audio Explanation');
      router.push('/player' as any);
    } catch (err: any) {
      console.warn('Playback error:', err?.message);
      router.push('/player' as any);
    } finally {
      setIsPlaying(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      'Delete Document',
      'Are you sure you want to remove this document and its audio?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(id);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={s.root}>
      <MeshBackground variant="library" />

      {/* Top Bar */}
      <View style={[s.topBar, { paddingTop: insets.top + 12 }]}>
        <Pressable style={s.navBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color={C.textSecondary} strokeWidth={2} />
          <Text variant="subhead" rawColor={C.textSecondary}>Library</Text>
        </Pressable>
        <Text variant="headline" rawColor={C.textPrimary}>Document Details</Text>
        <Pressable style={s.iconBtn}>
          <MoreVertical size={20} color={C.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Tag & Title */}
        <View style={s.headerBox}>
          <Text variant="caption" rawColor={C.brandHero} style={s.badge}>
            {doc?.status === 'ready' ? 'PROCESSED ARCHIVE' : doc?.status === 'failed' ? 'FAILED' : 'PROCESSING'}
          </Text>
          <Text variant="title2" rawColor={C.textPrimary} style={s.docTitle}>
            {doc?.title || 'Loading document...'}
          </Text>
          <Text variant="footnote" rawColor={C.textSecondary} style={s.docSub}>
            {doc?.created_at ? `Ingested ${new Date(doc.created_at).toLocaleDateString()} • Personal Workspace` : 'Workspace Document'}
          </Text>
        </View>

        {/* Metadata Grid */}
        <View style={s.metaGrid}>
          <GlassCard style={s.metaBox}>
            <Text variant="caption" rawColor={C.textTertiary}>Pages / Words</Text>
            <Text variant="monoTime" rawColor={C.textPrimary} style={s.metaVal}>
              {doc?.page_count ?? 1} pgs • {doc?.word_count ? `${Math.round(doc.word_count / 100) / 10}k` : '—'} words
            </Text>
          </GlassCard>
          <GlassCard style={s.metaBox}>
            <Text variant="caption" rawColor={C.textTertiary}>Synthesized Audio</Text>
            <Text variant="monoTime" rawColor={C.brandHero} style={s.metaVal}>
              {activeTrack ? `${formatSeconds(activeTrack.duration_seconds)} (${chapters.length} Chapters)` : 'Pending'}
            </Text>
          </GlassCard>
          <GlassCard style={s.metaBox}>
            <Text variant="caption" rawColor={C.textTertiary}>Language</Text>
            <Text variant="subhead" rawColor={C.textPrimary} style={s.metaVal}>
              {activeTrack?.job_id ? 'Synthesized' : 'Auto-detected'}
            </Text>
          </GlassCard>
          <GlassCard style={s.metaBox}>
            <Text variant="caption" rawColor={C.textTertiary}>Status</Text>
            <Text variant="subhead" rawColor={C.textPrimary} style={s.metaVal}>
              {doc?.status ? doc.status.toUpperCase() : 'QUEUED'}
            </Text>
          </GlassCard>
        </View>

        {/* Primary Play Action */}
        {activeTrack && (
          <ShinyButton
            label={isPlaying ? 'Starting Audio...' : 'Listen to Full Audio'}
            variant="primary"
            size="lg"
            fullWidth
            loading={isPlaying}
            icon={<Headphones size={20} color={C.textInverse} strokeWidth={2.5} />}
            onPress={handlePlayFull}
            style={s.playBtn}
          />
        )}

        {/* Episodes Section */}
        <View style={s.sectionHeader}>
          <Text variant="title3" rawColor={C.textPrimary}>Audio Chapters</Text>
          <Text variant="caption" rawColor={C.textTertiary}>
            {chapters.length > 0 ? `${chapters.length} Chapters` : 'No Chapters Yet'}
          </Text>
        </View>

        {chapters.length > 0 ? (
          chapters.map((ch, i) => (
            <Pressable key={ch.id} onPress={handlePlayFull}>
              <GlassCard style={s.episodeCard}>
                <View style={s.epLeft}>
                  <View style={s.epIndex}>
                    <Text variant="monoTime" rawColor={C.brandHero}>{i + 1}</Text>
                  </View>
                  <View style={s.epInfo}>
                    <Text variant="subhead" rawColor={C.textPrimary} style={{ fontWeight: '600' }}>
                      {ch.title}
                    </Text>
                    <Text variant="footnote" rawColor={C.textTertiary}>
                      {formatSeconds(Math.max(0, (ch.end_seconds || 0) - (ch.start_seconds || 0)))}
                    </Text>
                  </View>
                </View>
                <View style={s.playCircleSmall}>
                  <Play size={14} color={C.brandHero} fill={C.brandHero} />
                </View>
              </GlassCard>
            </Pressable>
          ))
        ) : (
          <GlassCard style={[s.episodeCard, { justifyContent: 'center', paddingVertical: 18 }]}>
            <Text variant="footnote" rawColor={C.textTertiary} style={{ textAlign: 'center' }}>
              {doc?.status === 'ready' ? 'No audio chapters recorded' : 'Audio generation in progress...'}
            </Text>
          </GlassCard>
        )}

        {/* Audio Feedback Section */}
        {activeTrack && (
          <View style={{ marginTop: 12, marginBottom: 12 }}>
            <AudioFeedbackCard
              trackId={activeTrack.id}
              userId={user?.id}
            />
          </View>
        )}

        {/* Action Buttons */}
        <View style={s.actionsRow}>
          <ShinyButton
            label="Share Audio"
            variant="secondary"
            size="md"
            icon={<Share2 size={16} color={C.textPrimary} />}
            onPress={() => {}}
            style={{ flex: 1 }}
          />
          <ShinyButton
            label="Delete"
            variant="destructive"
            size="md"
            icon={<Trash2 size={16} color="#fff" />}
            onPress={handleDelete}
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09161B' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },
  headerBox: { marginBottom: 20 },
  badge: { letterSpacing: 1, fontWeight: '800', marginBottom: 6 },
  docTitle: { marginBottom: 4 },
  docSub: {},
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  metaBox: {
    width: '48%',
    padding: 12,
    borderRadius: 14,
    gap: 4,
  },
  metaVal: { marginTop: 2, fontWeight: '700' },
  playBtn: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  episodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  epLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  epIndex: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.canvasSurfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epInfo: { flex: 1, gap: 2 },
  playCircleSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(146, 247, 2, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(146, 247, 2, 0.40)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
});

