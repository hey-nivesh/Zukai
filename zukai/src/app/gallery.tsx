/**
 * ZUKAI — Component Gallery (Dev-Only)
 * Interactive visual catalog of every component, variant, and state.
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Zap, Sparkles, AlertTriangle } from 'lucide-react-native';
import { MeshBackground } from '../components/MeshBackground';
import { GlassCard } from '../components/GlassCard';
import { Text } from '../components/Text';
import { ShinyButton } from '../components/ShinyButton';
import { Waveform } from '../components/Waveform';
import { LanguageToggle, Language } from '../components/LanguageToggle';
import { EmptyState } from '../components/EmptyState';
import { Mascot } from '../components/Mascot';

const C = {
  brandHero: '#92F702',
  canvasSurfaceRaised: '#132830',
  textPrimary: '#F8F9FA',
  textSecondary: '#B5C4CC',
  textTertiary: '#6B828F',
  textInverse: '#09161B',
  divider: 'rgba(255,255,255,0.08)',
};

export default function GalleryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [lang, setLang] = useState<Language>('english');
  const [loadingBtn, setLoadingBtn] = useState(false);

  return (
    <View style={s.root}>
      <MeshBackground variant="home" />

      {/* Top Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={C.textSecondary} />
        </Pressable>
        <Text variant="headline" rawColor={C.textPrimary}>Component Gallery</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. TYPOGRAPHY ── */}
        <Text variant="title3" rawColor={C.brandHero} style={s.sectionTitle}>1. Typography Tokens</Text>
        <GlassCard style={s.card}>
          <Text variant="displayXl" rawColor={C.textPrimary}>Display XL (48pt)</Text>
          <Text variant="display" rawColor={C.textPrimary}>Display (40pt)</Text>
          <Text variant="title1" rawColor={C.textPrimary}>Title 1 (32pt)</Text>
          <Text variant="title2" rawColor={C.textPrimary}>Title 2 (28pt)</Text>
          <Text variant="title3" rawColor={C.textPrimary}>Title 3 (22pt)</Text>
          <Text variant="headline" rawColor={C.textPrimary}>Headline (17pt SemiBold)</Text>
          <Text variant="body" rawColor={C.textSecondary}>Body (17pt Regular) - Clean readable text for transcripts.</Text>
          <Text variant="callout" rawColor={C.brandHero}>Callout (16pt Medium)</Text>
          <Text variant="subhead" rawColor={C.textSecondary}>Subhead (15pt Regular)</Text>
          <Text variant="footnote" rawColor={C.textTertiary}>Footnote (13pt Regular)</Text>
          <Text variant="caption" rawColor={C.brandHero}>CAPTION (12pt Medium)</Text>
          <Text variant="monoCounter" rawColor={C.brandHero}>MonoCounter: 04:18.92</Text>
          <Text variant="monoTime" rawColor={C.textTertiary}>MonoTime: 12:45 / 30:00</Text>
        </GlassCard>

        {/* ── 2. SHINY BUTTONS ── */}
        <Text variant="title3" rawColor={C.brandHero} style={s.sectionTitle}>2. ShinyButton Engine</Text>
        <GlassCard style={s.card}>
          <ShinyButton
            label="Primary CTA (Large + Shimmer)"
            variant="primary"
            size="lg"
            fullWidth
            icon={<Zap size={20} color={C.textInverse} />}
            onPress={() => setLoadingBtn((l) => !l)}
          />

          <ShinyButton
            label="Secondary Glass Button"
            variant="secondary"
            size="md"
            fullWidth
            icon={<Sparkles size={18} color={C.textPrimary} />}
            onPress={() => {}}
          />

          <ShinyButton
            label="Destructive Button"
            variant="destructive"
            size="md"
            fullWidth
            icon={<AlertTriangle size={18} color="#fff" />}
            onPress={() => {}}
          />

          <View style={s.row}>
            <ShinyButton label="Small" variant="primary" size="sm" onPress={() => {}} />
            <ShinyButton label="Disabled" variant="primary" size="sm" disabled onPress={() => {}} />
            <ShinyButton label="Loading" variant="primary" size="sm" loading onPress={() => {}} />
          </View>
        </GlassCard>

        {/* ── 3. GLASSCARDS ── */}
        <Text variant="title3" rawColor={C.brandHero} style={s.sectionTitle}>3. GlassCard Surfaces</Text>
        <GlassCard style={s.card}>
          <Text variant="headline" rawColor={C.textPrimary}>Standard Frosted Glass</Text>
          <Text variant="footnote" rawColor={C.textSecondary}>
            Backdrop blur + 1px subtle light stroke + dark translucent fill.
          </Text>
        </GlassCard>

        <GlassCard glow style={s.card}>
          <Text variant="headline" rawColor={C.brandHero}>Active Glow GlassCard</Text>
          <Text variant="footnote" rawColor={C.textSecondary}>
            Features neon volt green rim lighting for selected / active states.
          </Text>
        </GlassCard>

        {/* ── 4. WAVEFORM & CONTROLS ── */}
        <Text variant="title3" rawColor={C.brandHero} style={s.sectionTitle}>4. Interactive Audio Waveform</Text>
        <GlassCard style={s.card}>
          <Waveform barCount={28} height={40} active />
        </GlassCard>

        {/* ── 5. LANGUAGE TOGGLE ── */}
        <Text variant="title3" rawColor={C.brandHero} style={s.sectionTitle}>5. Spring Language Toggle</Text>
        <View style={{ alignItems: 'center', marginVertical: 8 }}>
          <LanguageToggle value={lang} onChange={setLang} />
        </View>

        {/* ── 6. MASCOT & EMPTY STATE ── */}
        <Text variant="title3" rawColor={C.brandHero} style={s.sectionTitle}>6. Zuke 3D Mascot Engine</Text>
        <View style={{ alignItems: 'center', marginVertical: 12 }}>
          <Mascot pose="base" size={160} animated />
        </View>

        <EmptyState
          pose="empty"
          title="No Audio Tracks Found"
          message="Upload your first document to see Zuke convert it into chapter-wise audio lessons."
          actionLabel="Upload Now"
          onAction={() => router.push('/(tabs)/upload')}
        />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09161B' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  sectionTitle: { marginTop: 12 },
  card: { padding: 18, borderRadius: 20, gap: 12 },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
});

