/**
 * ZUKAI LANGUAGE SELECTION SCREEN (Phase 3 Real Logic)
 * Persists preferred_language to profile and marks onboarding_completed.
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Text } from '../../components/Text';
import { Mascot } from '../../components/Mascot';
import { LanguageToggle, Language } from '../../components/LanguageToggle';
import { ShinyButton } from '../../components/ShinyButton';
import { GlassCard } from '../../components/GlassCard';
import { useAuth } from '../../components/AuthProvider';

export default function LanguageScreen() {
  const router = useRouter();
  const auth = useAuth();
  const [lang, setLang] = useState<Language>(auth.profile?.preferred_language || 'english');
  const [isSaving, setIsSaving] = useState(false);

  const handleFinish = async () => {
    setIsSaving(true);
    await auth.updateLanguage(lang);
    await auth.completeOnboarding();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSaving(false);
    router.replace('/(tabs)/home' as any);
  };

  return (
    <ScreenContainer meshVariant="onboarding">
      <View style={styles.container}>
        <Mascot pose="welcome" size={160} animated />

        <Text variant="title2" color="primary" style={styles.title}>
          How should Zuke explain things?
        </Text>

        <GlassCard style={styles.card}>
          <Text variant="subhead" color="secondary" style={styles.cardBody}>
            Choose your preferred explanation language. You can change this anytime per document.
          </Text>
          <View style={styles.toggleRow}>
            <LanguageToggle value={lang} onChange={setLang} />
          </View>
          <Text variant="caption" color="tertiary" style={styles.hint}>
            {lang === 'hinglish'
              ? '🇮🇳 Mix of Hindi & English — natural for South Asian learners'
              : '🌍 Clean, modern English with simple analogies'}
          </Text>
        </GlassCard>

        <ShinyButton
          label="Start Learning"
          variant="primary"
          size="lg"
          fullWidth
          loading={isSaving}
          disabled={isSaving}
          onPress={handleFinish}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 28,
    paddingBottom: 48,
  },
  title: {
    textAlign: 'center',
  },
  card: {
    alignSelf: 'stretch',
    gap: 16,
  },
  cardBody: {
    textAlign: 'center',
  },
  toggleRow: {
    alignItems: 'center',
  },
  hint: {
    textAlign: 'center',
  },
});
