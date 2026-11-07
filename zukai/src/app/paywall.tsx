/**
 * ZUKAI — Paywall / Upgrade Screen
 */
import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, Crown } from 'lucide-react-native';
import { MeshBackground } from '../components/MeshBackground';
import { GlassCard } from '../components/GlassCard';
import { Text } from '../components/Text';
import { ShinyButton } from '../components/ShinyButton';

const C = {
  brandHero: '#92F702', canvasSurfaceRaised: '#132830', canvasSurfaceHighlight: '#18333D',
  textPrimary: '#F8F9FA', textSecondary: '#B5C4CC', textTertiary: '#6B828F', textInverse: '#09161B',
  glassBorder: 'rgba(255,255,255,0.14)', glassBorderActive: 'rgba(146,247,2,0.45)',
};
const FEATURES = [
  'Unlimited document uploads',
  'Priority AI processing',
  'Download audio for offline',
  'Hinglish explanations',
];

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly');

  return (
    <View style={s.root}>
      <MeshBackground variant="paywall" />
      <Pressable style={[s.closeBtn, { top: insets.top + 12 }]} onPress={() => router.back()}>
        <X size={22} color={C.textSecondary} strokeWidth={2} />
      </Pressable>

      <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        <Crown size={48} color={C.brandHero} strokeWidth={1.5} />
        <Text variant="title1" rawColor={C.textPrimary} style={s.title}>Go Pro</Text>
        <Text variant="body" rawColor={C.textSecondary} style={s.sub}>Unlock unlimited learning</Text>

        <Image source={require('../assets/mascot/_base.png')} style={s.mascot} resizeMode="contain" />

        {/* Features */}
        <View style={s.featuresWrap}>
          {FEATURES.map((f) => (
            <GlassCard key={f} style={s.featureRow}>
              <View style={s.checkCircle}><Check size={14} color={C.textInverse} strokeWidth={2.5} /></View>
              <Text variant="subhead" rawColor={C.textPrimary} style={{ flex: 1 }}>{f}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Plan Toggle */}
        <View style={s.planToggle}>
          {(['monthly', 'yearly'] as const).map((p) => (
            <Pressable key={p} onPress={() => setPlan(p)}
              style={[s.planPill, plan === p && s.planPillActive]}>
              <Text variant="callout" rawColor={plan === p ? C.textInverse : C.textSecondary} style={{ fontWeight: '600' }}>
                {p === 'monthly' ? 'Monthly' : 'Yearly (Save 40%)'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Price */}
        <GlassCard style={s.priceCard}>
          <Text variant="title1" rawColor={C.textPrimary} style={s.price}>
            {plan === 'monthly' ? '₹499' : '₹299'} <Text variant="subhead" rawColor={C.textSecondary}>/ month</Text>
          </Text>
          <Text variant="footnote" rawColor={C.textTertiary}>
            {plan === 'yearly' ? 'Billed as ₹3,588/year • Cancel anytime' : 'Billed monthly • Cancel anytime'}
          </Text>
          {plan === 'yearly' && (
            <Text variant="footnote" rawColor={C.textTertiary} style={s.strikethrough}>₹5,988/year</Text>
          )}
        </GlassCard>

        <ShinyButton label="Start Free Trial" variant="primary" size="lg" fullWidth onPress={() => router.back()} />
        <Text variant="footnote" rawColor={C.textTertiary} style={s.trialNote}>7-day free trial • No credit card required</Text>
        <Pressable onPress={() => {}}>
          <Text variant="subhead" rawColor={C.brandHero} style={{ fontWeight: '600', textAlign: 'center' }}>Restore Purchase</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050D10' },
  closeBtn: { position: 'absolute', right: 20, zIndex: 10, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 24, alignItems: 'center', gap: 16 },
  title: { textAlign: 'center' }, sub: { textAlign: 'center' },
  mascot: { width: 120, height: 120 },
  featuresWrap: { width: '100%', gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, gap: 12 },
  checkCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.brandHero, alignItems: 'center', justifyContent: 'center' },
  planToggle: { flexDirection: 'row', backgroundColor: C.canvasSurfaceRaised, borderRadius: 14, padding: 4, gap: 4 },
  planPill: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center' },
  planPillActive: { backgroundColor: C.brandHero },
  priceCard: { width: '100%', padding: 20, borderRadius: 20, alignItems: 'center', gap: 6, borderColor: C.glassBorderActive },
  price: { textAlign: 'center' },
  strikethrough: { textDecorationLine: 'line-through' },
  trialNote: { textAlign: 'center' },
});

