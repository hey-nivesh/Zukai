/**
 * ZUKAI EMPTY STATE
 * Rendered when lists or screens have no content.
 * Shows a mascot pose + title + message + optional CTA button.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Mascot } from './Mascot';
import { Text } from './Text';
import { ShinyButton } from './ShinyButton';
import type { MascotPose } from '../assets/mascot/index';

export interface EmptyStateProps {
  pose?: MascotPose;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  pose = 'empty',
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Mascot pose={pose} size={180} animated />
      <View style={styles.textGroup}>
        <Text variant="title3" color="primary" style={styles.title}>
          {title}
        </Text>
        <Text variant="subhead" color="secondary" style={styles.message}>
          {message}
        </Text>
      </View>
      {actionLabel && onAction && (
        <ShinyButton
          label={actionLabel}
          variant="primary"
          size="md"
          onPress={onAction}
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 24,
  },
  textGroup: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    maxWidth: 280,
  },
  button: {
    marginTop: 8,
  },
});

