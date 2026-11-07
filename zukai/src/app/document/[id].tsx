/**
 * ZUKAI — Document Detail Screen [id]
 * Metadata grid, episode list, play button, and document actions.
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MoreVertical, Play, Share2, Trash2, Headphones } from 'lucide-react-native';
import { MeshBackground } from '../../components/MeshBackground';
import { GlassCard } from '../../components/GlassCard';
import { Text } from '../../components/Text';
import { ShinyButton } from '../../components/ShinyButton';

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

const EPISODES = [
  { id: '1', title: 'Chapter 1: Autonomous Foundations', duration: '5:42', completed: true },
  { id: '2', title: 'Chapter 2: Sensor Fusion & Perception', duration: '6:15', completed: false },
  { id: '3', title: 'Chapter 3: Planning & Safety Constraints', duration: '4:20', completed: false },
];

export default function DocumentDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

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
            PROCESSED ARCHIVE
          </Text>
          <Text variant="title2" rawColor={C.textPrimary} style={s.docTitle}>
            Autonomous Systems Overview.pdf
          </Text>
          <Text variant="footnote" rawColor={C.textSecondary} style={s.docSub}>
            Ingested Nov 6, 2026 • Personal Workspace
          </Text>
        </View>

        {/* Metadata Grid */}
        <View style={s.metaGrid}>
          <GlassCard style={s.metaBox}>
            <Text variant="caption" rawColor={C.textTertiary}>Pages / Words</Text>
            <Text variant="monoTime" rawColor={C.textPrimary} style={s.metaVal}>18 pgs • 5.4k words</Text>
          </GlassCard>
          <GlassCard style={s.metaBox}>
            <Text variant="caption" rawColor={C.textTertiary}>Synthesized Audio</Text>
            <Text variant="monoTime" rawColor={C.brandHero} style={s.metaVal}>16:17 (3 Episodes)</Text>
          </GlassCard>
          <GlassCard style={s.metaBox}>
            <Text variant="caption" rawColor={C.textTertiary}>Language</Text>
            <Text variant="subhead" rawColor={C.textPrimary} style={s.metaVal}>Hinglish</Text>
          </GlassCard>
          <GlassCard style={s.metaBox}>
            <Text variant="caption" rawColor={C.textTertiary}>Depth Mode</Text>
            <Text variant="subhead" rawColor={C.textPrimary} style={s.metaVal}>Standard (Analogies)</Text>
          </GlassCard>
        </View>

        {/* Primary Play Action */}
        <ShinyButton
          label="Listen to Full Audio"
          variant="primary"
          size="lg"
          fullWidth
          icon={<Headphones size={20} color={C.textInverse} strokeWidth={2.5} />}
          onPress={() => router.push('/player')}
          style={s.playBtn}
        />

        {/* Episodes Section */}
        <View style={s.sectionHeader}>
          <Text variant="title3" rawColor={C.textPrimary}>Audio Chapters</Text>
          <Text variant="caption" rawColor={C.textTertiary}>3 Tracks</Text>
        </View>

        {EPISODES.map((ep, i) => (
          <Pressable key={ep.id} onPress={() => router.push('/player')}>
            <GlassCard style={s.episodeCard}>
              <View style={s.epLeft}>
                <View style={s.epIndex}>
                  <Text variant="monoTime" rawColor={C.brandHero}>{i + 1}</Text>
                </View>
                <View style={s.epInfo}>
                  <Text variant="subhead" rawColor={C.textPrimary} style={{ fontWeight: '600' }}>
                    {ep.title}
                  </Text>
                  <Text variant="footnote" rawColor={C.textTertiary}>Duration: {ep.duration}</Text>
                </View>
              </View>
              <View style={s.playCircleSmall}>
                <Play size={14} color={C.brandHero} fill={C.brandHero} />
              </View>
            </GlassCard>
          </Pressable>
        ))}

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
            onPress={() => router.back()}
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

