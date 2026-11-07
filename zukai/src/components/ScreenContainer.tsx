/**
 * ZUKAI SCREEN CONTAINER
 * Wraps every screen: handles safe area, background mesh, and optional scroll.
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MeshBackground } from './MeshBackground';
import { useTheme } from '../theme/ThemeProvider';

type MeshVariant = Parameters<typeof MeshBackground>[0]['variant'];

export interface ScreenContainerProps {
  children: React.ReactNode;
  meshVariant?: MeshVariant;
  scrollable?: boolean;
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
}

export function ScreenContainer({
  children,
  meshVariant = 'home',
  scrollable = false,
  edges = ['top', 'bottom'],
}: ScreenContainerProps) {
  const { colors, spacing } = useTheme();

  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.fill}>{children}</View>
  );

  return (
    <View style={[styles.fill, { backgroundColor: colors.canvas.base }]}>
      <MeshBackground variant={meshVariant} />
      <SafeAreaView style={styles.fill} edges={edges}>
        {content}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { flexGrow: 1 },
});

