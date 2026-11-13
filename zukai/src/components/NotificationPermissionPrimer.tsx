/**
 * ZUKAI — Notification Permission Primer
 *
 * Shows a one-time modal the first time the user opens the Player,
 * prompting them to grant notification permission.
 *
 * Usage:
 *   const primerProps = useNotificationPrimerVisible();
 *   <NotificationPermissionPrimer {...primerProps} />
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bell } from 'lucide-react-native';
import { GlassCard } from './GlassCard';
import { Text } from './Text';
import { ShinyButton } from './ShinyButton';
import { Mascot } from './Mascot';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMER_SHOWN_KEY = '@zukai_notif_primer_shown';
const SHOW_DELAY_MS = 1500;

const C = {
  brandHero: '#92F702',
  canvasBase: '#09161B',
  textPrimary: '#F8F9FA',
  textSecondary: '#B5C4CC',
  glassBorder: 'rgba(255,255,255,0.14)',
  overlay: 'rgba(5, 13, 16, 0.88)',
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface NotificationPermissionPrimerProps {
  visible: boolean;
  onAllow: () => void;
  onDismiss: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationPermissionPrimer({
  visible,
  onAllow,
  onDismiss,
}: NotificationPermissionPrimerProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={s.overlay}>
        <GlassCard style={s.card}>
          {/* Bell icon */}
          <View style={s.bellWrap}>
            <Bell size={28} color={C.brandHero} strokeWidth={2} />
          </View>

          {/* Mascot */}
          <Mascot pose="listening" size={110} animated />

          {/* Copy */}
          <Text variant="title3" rawColor={C.textPrimary} style={s.title}>
            Stay in the loop
          </Text>
          <Text variant="body" rawColor={C.textSecondary} style={s.body}>
            Get notified when your audio explanation is ready to listen.
          </Text>

          {/* CTA buttons */}
          <ShinyButton
            label="Allow Notifications"
            variant="primary"
            size="md"
            fullWidth
            onPress={onAllow}
          />
          <Pressable onPress={onDismiss} style={s.dismissBtn} hitSlop={12}>
            <Text variant="subhead" rawColor={C.textSecondary}>Not now</Text>
          </Pressable>
        </GlassCard>
      </View>
    </Modal>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface NotificationPrimerControls {
  visible: boolean;
  onAllow: () => void;
  onDismiss: () => void;
}

export function useNotificationPrimerVisible(): NotificationPrimerControls {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    AsyncStorage.getItem(PRIMER_SHOWN_KEY)
      .then((value) => {
        if (cancelled || value !== null) return;
        timer = setTimeout(() => {
          if (!cancelled) setVisible(true);
        }, SHOW_DELAY_MS);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (timer !== null) clearTimeout(timer);
    };
  }, []);

  const markShown = useCallback(async () => {
    try {
      await AsyncStorage.setItem(PRIMER_SHOWN_KEY, 'true');
    } catch {}
  }, []);

  const onAllow = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        await PermissionsAndroid.request(
          'android.permission.POST_NOTIFICATIONS',
          {
            title: 'Notifications',
            message: 'Get notified when your audio is ready',
            buttonPositive: 'Allow',
          },
        );
      } catch {}
    }
    await markShown();
    setVisible(false);
  }, [markShown]);

  const onDismiss = useCallback(async () => {
    await markShown();
    setVisible(false);
  }, [markShown]);

  return { visible, onAllow, onDismiss };
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: C.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  bellWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(146,247,2,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(146,247,2,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 4,
  },
  dismissBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
});
