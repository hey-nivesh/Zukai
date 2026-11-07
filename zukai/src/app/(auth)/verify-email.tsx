/**
 * ZUKAI — Verify Email Screen
 * Explains email confirmation, displays Zuke mascot, with 60s cooldown resend action.
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react-native';
import { MeshBackground } from '../../components/MeshBackground';
import { GlassCard } from '../../components/GlassCard';
import { Text } from '../../components/Text';
import { ShinyButton } from '../../components/ShinyButton';
import { Mascot } from '../../components/Mascot';
import { useAuth } from '../../components/AuthProvider';

const C = {
  brandHero: '#92F702',
  textPrimary: '#F8F9FA',
  textSecondary: '#B5C4CC',
  textTertiary: '#6B828F',
  textInverse: '#09161B',
  success: '#00E676',
  error: '#FF3D71',
};

const COOLDOWN_SECONDS = 60;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const targetEmail = auth.pendingVerificationEmail || auth.user?.email || 'your email';

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((c) => c - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setResendStatus(null);

    const result = await auth.resendVerificationEmail(targetEmail);
    setIsResending(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResendStatus('Verification link resent successfully!');
      setCooldown(COOLDOWN_SECONDS);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setResendStatus(result.error || 'Failed to resend email');
    }
  };

  return (
    <View style={s.root}>
      <MeshBackground variant="onboarding" />
      <ScrollView
        contentContainerStyle={[
          s.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Mascot */}
        <Mascot pose="welcome" size={150} animated />

        {/* Card */}
        <GlassCard style={s.card}>
          <View style={s.iconCircle}>
            <Mail size={32} color={C.brandHero} strokeWidth={2} />
          </View>

          <Text variant="title2" rawColor={C.textPrimary} style={s.title}>
            Check Your Email
          </Text>

          <Text variant="body" rawColor={C.textSecondary} style={s.body}>
            We sent a verification link to:
          </Text>
          <Text variant="headline" rawColor={C.brandHero} style={s.emailHighlight}>
            {targetEmail}
          </Text>

          <Text variant="footnote" rawColor={C.textTertiary} style={s.instructions}>
            Click the link inside to verify your account and start listening. If you don't see it, check your spam or junk folder.
          </Text>

          {/* Feedback message */}
          {resendStatus && (
            <View style={s.statusRow}>
              <CheckCircle size={16} color={C.success} strokeWidth={2} />
              <Text variant="footnote" rawColor={C.success}>
                {resendStatus}
              </Text>
            </View>
          )}

          {/* Resend button */}
          <ShinyButton
            label={
              cooldown > 0
                ? `Resend in ${cooldown}s`
                : 'Resend Verification Email'
            }
            variant="primary"
            size="lg"
            fullWidth
            loading={isResending}
            disabled={cooldown > 0 || isResending}
            icon={<RefreshCw size={18} color={C.textInverse} strokeWidth={2.5} />}
            onPress={handleResend}
            style={s.resendBtn}
          />

          {/* Back to sign in */}
          <ShinyButton
            label="Back to Sign In"
            variant="secondary"
            size="md"
            fullWidth
            icon={<ArrowLeft size={16} color={C.textPrimary} />}
            onPress={async () => {
              await auth.signOut();
              router.replace('/(auth)/sign-in' as any);
            }}
          />
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09161B' },
  content: { paddingHorizontal: 24, alignItems: 'center', gap: 16 },
  card: { width: '100%', padding: 24, borderRadius: 24, alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(146, 247, 2, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(146, 247, 2, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { textAlign: 'center' },
  body: { textAlign: 'center' },
  emailHighlight: { textAlign: 'center', letterSpacing: 0.2 },
  instructions: { textAlign: 'center', lineHeight: 20, marginVertical: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resendBtn: { marginTop: 8 },
});

