/**
 * ZUKAI BOTTOM TABS LAYOUT
 * Glass-pill floating tab bar matching the reference mockup.
 */

import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { Tabs, usePathname, useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, BookOpen, Upload, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/Text';
import { useTheme } from '../../theme/ThemeProvider';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { GlobalUploadIndicator } from '../../components/GlobalUploadIndicator';
import { GlobalMiniPlayer } from '../../components/GlobalMiniPlayer';

// ─── Tab Item ───────────────────────────────────────────────────────────────

function TabItem({
  label,
  icon: Icon,
  active,
  onPress,
  isCenter = false,
}: {
  label: string;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  active: boolean;
  onPress: () => void;
  isCenter?: boolean;
}) {
  const { colors, motion } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(motion.scale.pressed, motion.spring.snappy);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, motion.spring.snappy);
  };

  if (isCenter) {
    return (
      <Animated.View style={animStyle}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          style={styles.centerButton}
          accessibilityRole="button"
          accessibilityLabel="Upload document"
        >
          <LinearGradient
            colors={['#A4F924', '#92F702', '#75CE00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.centerGradient}
          >
            <Icon size={24} color={colors.text.inverse} strokeWidth={2.5} />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.tabItem, animStyle]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={styles.tabPressable}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}
      >
        {active && (
          <View
            style={[styles.activeIndicator, { backgroundColor: colors.brand.hero }]}
          />
        )}
        <Icon
          size={22}
          color={active ? colors.brand.hero : colors.text.tertiary}
          strokeWidth={active ? 2.5 : 2}
        />
        <Text
          variant="caption"
          rawColor={active ? colors.brand.hero : colors.text.tertiary}
          style={styles.tabLabel}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Custom Tab Bar ──────────────────────────────────────────────────────────

function ZukaiTabBar({
  state,
  navigation,
}: {
  state: { index: number; routes: Array<{ name: string }> };
  navigation: { navigate: (name: string) => void };
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const TAB_CONFIG = [
    { name: 'home', label: 'Home', icon: Home },
    { name: 'library', label: 'Library', icon: BookOpen },
    { name: 'upload', label: 'Upload', icon: Upload, center: true },
    { name: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <View style={[styles.barWrapper, { paddingBottom: insets.bottom + 8 }]}>
      {/* Floating Glass Pill */}
      <View style={styles.barPill}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'rgba(13, 30, 36, 0.80)',
              borderRadius: 36,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.10)',
            },
          ]}
        />
        <View style={styles.barContent}>
          {TAB_CONFIG.map((tab, i) => {
            const isActive = state.routes[state.index]?.name === tab.name;
            return (
              <TabItem
                key={tab.name}
                label={tab.label}
                icon={tab.icon}
                active={isActive}
                onPress={() => router.push(`/(tabs)/${tab.name}` as any)}
                isCenter={tab.center}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── Tabs Layout ─────────────────────────────────────────────────────────────

export default function TabsLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <View style={{ flex: 1 }}>
        <Tabs
          tabBar={(props: any) => <ZukaiTabBar state={props.state} navigation={props.navigation} />}
          screenOptions={{ headerShown: false }}
        >
          <Tabs.Screen name="home" />
          <Tabs.Screen name="library" />
          <Tabs.Screen name="upload" />
          <Tabs.Screen name="settings" />
        </Tabs>
        <GlobalMiniPlayer />
        <GlobalUploadIndicator />
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  barWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  barPill: {
    width: '100%',
    borderRadius: 36,
    overflow: 'hidden',
  },
  barContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabPressable: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    top: -4,
    width: 20,
    height: 3,
    borderRadius: 2,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  centerButton: {
    marginHorizontal: 8,
  },
  centerGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#92F702',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
});

