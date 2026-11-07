/**
 * ZUKAI GLOBAL UPLOAD INDICATOR
 * Location: /zukai/src/components/GlobalUploadIndicator.tsx
 * Description: Floating glass progress pill mounted above bottom navigation bar
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, X, CheckCircle, AlertCircle, UploadCloud } from 'lucide-react-native';
import { GlassCard } from './GlassCard';
import { Text } from './Text';
import { useUploadStore } from '@/features/upload/uploadManager';

const C = {
  brandHero: '#92F702',
  brandVisor: '#0BF807',
  canvasSurfaceRaised: '#132830',
  textPrimary: '#F8F9FA',
  textSecondary: '#B5C4CC',
  textTertiary: '#6B828F',
  success: '#00E676',
  error: '#FF5252',
  warning: '#FFD600',
  glassBorder: 'rgba(146,247,2,0.3)',
};

export function GlobalUploadIndicator() {
  const insets = useSafeAreaInsets();
  const {
    status,
    progress,
    file,
    errorMessage,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    clearUpload,
  } = useUploadStore();

  // Only render if there is active activity
  if (status === 'idle') return null;

  const isUploading = status === 'uploading' || status === 'preparing' || status === 'completing';
  const isPaused = status === 'paused';
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';

  const speedKbps = Math.round(progress.speedBytesPerSec / 1024);
  const statusLabel = isPreparing(status)
    ? 'Preparing upload...'
    : isPaused
    ? 'Upload paused'
    : isCompleted
    ? 'Upload completed!'
    : isFailed
    ? 'Upload failed'
    : `${progress.percent}% (${speedKbps} KB/s)`;

  function isPreparing(s: string) {
    return s === 'preparing' || s === 'completing';
  }

  return (
    <View style={[styles.floatingContainer, { bottom: insets.bottom + 68 }]}>
      <GlassCard style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.iconContainer}>
            {isCompleted ? (
              <CheckCircle size={18} color={C.success} />
            ) : isFailed ? (
              <AlertCircle size={18} color={C.error} />
            ) : (
              <UploadCloud size={18} color={C.brandHero} />
            )}
          </View>

          <View style={styles.infoCol}>
            <Text variant="headline" rawColor={C.textPrimary} numberOfLines={1}>
              {file?.name || 'Document Upload'}
            </Text>
            <Text variant="caption" rawColor={isFailed ? C.error : C.textTertiary}>
              {errorMessage || statusLabel}
            </Text>
          </View>

          <View style={styles.actionsRow}>
            {isUploading && (
              <Pressable onPress={pauseUpload} hitSlop={8} style={styles.actionBtn}>
                <Pause size={14} color={C.textSecondary} />
              </Pressable>
            )}

            {isPaused && (
              <Pressable onPress={resumeUpload} hitSlop={8} style={styles.actionBtn}>
                <Play size={14} color={C.brandHero} />
              </Pressable>
            )}

            {(isFailed || isCompleted) && (
              <Pressable onPress={clearUpload} hitSlop={8} style={styles.actionBtn}>
                <X size={14} color={C.textTertiary} />
              </Pressable>
            )}

            {(isUploading || isPaused) && (
              <Pressable onPress={cancelUpload} hitSlop={8} style={styles.actionBtn}>
                <X size={14} color={C.textTertiary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Progress Bar */}
        {(isUploading || isPaused) && (
          <View style={styles.track}>
            <LinearGradient
              colors={[C.brandHero, C.brandVisor]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.fill, { width: `${progress.percent}%` }]}
            />
          </View>
        )}
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  card: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.glassBorder,
    shadowColor: C.brandHero,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.canvasSurfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    gap: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  track: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 1.5,
    marginTop: 8,
    overflow: 'hidden',
  },
  fill: {
    height: 3,
    borderRadius: 1.5,
  },
});

