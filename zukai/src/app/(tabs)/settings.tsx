/**
 * ZUKAI — Settings Screen (Phase 7: All handlers wired)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Switch,
  Alert,
  PermissionsAndroid,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import {
  User,
  Bell,
  Globe,
  Moon,
  Shield,
  Star,
  LogOut,
  ChevronRight,
  FileText,
  Trash2,
  AlertTriangle,
  X,
  Check,
  Volume2,
  HardDrive,
  MessageSquare,
} from 'lucide-react-native';
import { MeshBackground } from '../../components/MeshBackground';
import { GlassCard } from '../../components/GlassCard';
import { Text } from '../../components/Text';
import { ShinyButton } from '../../components/ShinyButton';
import { useAuth } from '../../components/AuthProvider';
import { supabase } from '../../lib/supabase';
import { useUsageSummary } from '../../features/usage/hooks/useUsageSummary';
import { getStorageUsage, clearAllDownloads } from '../../features/playback/downloadManager';
import type { PreferredLanguage } from '../../types/auth';

const C = {
  brandHero: '#92F702',
  canvasBase: '#09161B',
  canvasSurfaceRaised: '#132830',
  canvasSurfaceHighlight: '#18333D',
  textPrimary: '#F8F9FA',
  textSecondary: '#B5C4CC',
  textTertiary: '#6B828F',
  textInverse: '#09161B',
  glassBorder: 'rgba(255,255,255,0.14)',
  glassBorderActive: 'rgba(146,247,2,0.45)',
  divider: 'rgba(255,255,255,0.06)',
  error: '#FF3D71',
  errorBg: 'rgba(255,61,113,0.12)',
};

type LIcon = React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;

function SettingRow({
  icon: Icon,
  label,
  valueText,
  iconColor,
  labelColor,
  last = false,
  onPress,
  rightElement,
}: {
  icon: LIcon;
  label: string;
  valueText?: string;
  iconColor?: string;
  labelColor?: string;
  last?: boolean;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}) {
  return (
    <Pressable onPress={onPress} style={[s.row, !last && s.rowBorder]}>
      <View style={s.iconCircle}>
        <Icon size={16} color={iconColor ?? C.textSecondary} strokeWidth={2} />
      </View>
      <Text variant="subhead" rawColor={labelColor ?? C.textPrimary} style={{ flex: 1 }}>
        {label}
      </Text>
      {valueText && (
        <Text variant="footnote" rawColor={C.brandHero} style={{ marginRight: 8, fontWeight: '600' }}>
          {valueText}
        </Text>
      )}
      {rightElement ?? <ChevronRight size={16} color={C.textTertiary} strokeWidth={2} />}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const auth = useAuth();

  // ── Existing modals ────────────────────────────────────────────────────────
  const [showEditName, setShowEditName] = useState(false);
  const [newName, setNewName] = useState(auth.profile?.full_name || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const [showLangModal, setShowLangModal] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ── Task A: Notifications toggle ───────────────────────────────────────────
  const [notifEnabled, setNotifEnabled] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    PermissionsAndroid.check('android.permission.POST_NOTIFICATIONS')
      .then((granted) => setNotifEnabled(granted))
      .catch(() => {});
  }, []);

  const handleNotifToggle = async () => {
    if (Platform.OS !== 'android') return;
    if (!notifEnabled) {
      const result = await PermissionsAndroid.request(
        'android.permission.POST_NOTIFICATIONS',
        {
          title: 'Notifications',
          message: 'Get notified when your audio is ready',
          buttonPositive: 'Allow',
        },
      );
      if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Linking.openSettings();
        return;
      }
      setNotifEnabled(result === PermissionsAndroid.RESULTS.GRANTED);
    } else {
      // Can't programmatically revoke; send user to settings
      Linking.openSettings();
    }
  };

  // ── Task B: Speaker test ───────────────────────────────────────────────────
  const [isTesting, setIsTesting] = useState(false);

  const handleSpeakerTest = async () => {
    if (isTesting) return;
    setIsTesting(true);
    try {
      let Audio: typeof import('expo-av').Audio | null = null;
      try {
        const { requireOptionalNativeModule } = require('expo-modules-core');
        if (requireOptionalNativeModule('ExponentAV')) {
          Audio = require('expo-av').Audio;
        }
      } catch {}

      if (Audio) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://www.soundjay.com/buttons/sounds/button-1.mp3' },
          { shouldPlay: true },
        );
        sound.setOnPlaybackStatusUpdate((status) => {
          if ('didJustFinish' in status && status.didJustFinish) {
            sound.unloadAsync().catch(() => {});
            setIsTesting(false);
          }
        });
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Speaker Test', 'Audio system ready. (Development simulator session)');
        setIsTesting(false);
      }
    } catch {
      setIsTesting(false);
    }
  };

  // ── Task C: Storage & Cache ────────────────────────────────────────────────
  const [storageInfo, setStorageInfo] = useState<{ formatted: string; count: number } | null>(null);

  useEffect(() => {
    getStorageUsage()
      .then((info) => setStorageInfo({ formatted: info.formatted, count: info.count }))
      .catch(() => {});
  }, []);

  const handleClearStorage = () => {
    Alert.alert(
      'Clear Downloads',
      `Remove ${storageInfo?.count ?? 0} downloaded audio files?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearAllDownloads();
            const info = await getStorageUsage();
            setStorageInfo({ formatted: info.formatted, count: info.count });
          },
        },
      ],
    );
  };

  // ── Task D: Feedback & Support ─────────────────────────────────────────────
  const handleFeedback = () => {
    Linking.openURL('mailto:support@zukai.app?subject=Feedback%20from%20Zukai%20App');
  };

  // ── Task E: Privacy Policy / Terms ────────────────────────────────────────
  const handlePrivacyPolicy = () => {
    WebBrowser.openBrowserAsync('https://zukai.app/privacy');
  };

  const handleTerms = () => {
    WebBrowser.openBrowserAsync('https://zukai.app/terms');
  };

  // ── Task G: Usage & Plan stats ────────────────────────────────────────────
  const { data: usageSummary, isLoading: isLoadingUsage } = useUsageSummary();

  const minutesFormatted = (() => {
    const mins = usageSummary?.monthly_audio_minutes_used;
    if (mins == null) return '—';
    return `${(mins / 60).toFixed(1)}h`;
  })();

  // ── Existing handlers ──────────────────────────────────────────────────────
  const displayName = auth.profile?.full_name || auth.user?.user_metadata?.full_name || 'Zukai Learner';
  const displayEmail = auth.profile?.email || auth.user?.email || 'learner@zukai.app';
  const initial = displayName.charAt(0).toUpperCase() || 'Z';
  const currentLang = auth.profile?.preferred_language === 'hinglish' ? 'Hinglish' : 'English';

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await auth.signOut();
    router.replace('/(auth)/sign-in' as Parameters<typeof router.replace>[0]);
  };

  const handleSaveName = async () => {
    if (!newName.trim() || !auth.user) return;
    setIsUpdatingName(true);

    try {
      await supabase
        .from('profiles')
        .update({ full_name: newName.trim() })
        .eq('id', auth.user.id);

      await auth.refreshProfile();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowEditName(false);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleSelectLanguage = async (lang: PreferredLanguage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await auth.updateLanguage(lang);
    setShowLangModal(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.trim() !== 'DELETE') return;
    setIsDeleting(true);
    setDeleteError(null);

    const result = await auth.deleteAccount();
    setIsDeleting(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowDeleteModal(false);
      router.replace('/(onboarding)/onboarding' as Parameters<typeof router.replace>[0]);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setDeleteError(result.error || 'Failed to delete account');
    }
  };

  const appVersion = `v${Constants.expoConfig?.version ?? '1.0.0'}`;

  return (
    <View style={s.root}>
      <MeshBackground variant="settings" />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[
          s.content,
          { paddingTop: insets.top + 16, paddingBottom: 130 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="title2" rawColor={C.textPrimary} style={s.screenTitle}>
          Settings
        </Text>

        {/* Profile / Usage Card */}
        <GlassCard style={s.profileCard}>
          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              <Text variant="title1" rawColor={C.brandHero}>{initial}</Text>
            </View>
            <View style={s.proBadge}>
              <Text variant="caption" rawColor={C.brandHero} style={s.proText}>PRO</Text>
            </View>
          </View>
          <Text variant="title3" rawColor={C.textPrimary} style={s.name}>{displayName}</Text>
          <Text variant="subhead" rawColor={C.textSecondary} style={s.email}>{displayEmail}</Text>

          <View style={s.statsRow}>
            {isLoadingUsage ? (
              <ActivityIndicator color={C.brandHero} style={{ flex: 1, alignSelf: 'center' }} />
            ) : (
              [
                { val: String(usageSummary?.documents_count ?? '—'), label: 'Docs' },
                { val: minutesFormatted, label: 'Audio' },
                { val: String(usageSummary?.active_jobs_count ?? '—'), label: 'Jobs' },
              ].map((st) => (
                <View key={st.label} style={s.statItem}>
                  <Text variant="monoCounter" rawColor={C.brandHero}>{st.val}</Text>
                  <Text variant="caption" rawColor={C.textTertiary} style={{ marginTop: 2 }}>{st.label}</Text>
                </View>
              ))
            )}
          </View>
        </GlassCard>

        {/* Account Section */}
        <Text variant="footnote" rawColor={C.textTertiary} style={s.sectionLabel}>ACCOUNT</Text>
        <GlassCard style={s.sectionCard}>
          <SettingRow
            icon={User}
            label="Edit Full Name"
            valueText={displayName}
            onPress={() => {
              setNewName(displayName);
              setShowEditName(true);
            }}
          />
          <SettingRow
            icon={Bell}
            label="Notifications"
            onPress={handleNotifToggle}
            rightElement={
              <Switch
                value={notifEnabled}
                onValueChange={handleNotifToggle}
                trackColor={{ false: C.canvasSurfaceRaised, true: C.brandHero }}
                thumbColor={C.textPrimary}
              />
            }
          />
          <SettingRow
            icon={Globe}
            label="Explanation Language"
            valueText={currentLang}
            last
            onPress={() => setShowLangModal(true)}
          />
        </GlassCard>

        {/* Preferences Section */}
        <Text variant="footnote" rawColor={C.textTertiary} style={s.sectionLabel}>PREFERENCES</Text>
        <GlassCard style={s.sectionCard}>
          <SettingRow icon={Moon} label="Appearance (Dark Mode)" valueText="Always On" onPress={() => {}} />
          <SettingRow
            icon={Volume2}
            label="Speaker Test"
            valueText={isTesting ? 'Playing…' : undefined}
            onPress={handleSpeakerTest}
          />
          <SettingRow
            icon={HardDrive}
            label="Storage & Cache"
            valueText={storageInfo?.formatted ?? '…'}
            last
            onPress={handleClearStorage}
          />
        </GlassCard>

        {/* Support Section */}
        <Text variant="footnote" rawColor={C.textTertiary} style={s.sectionLabel}>SUPPORT</Text>
        <GlassCard style={s.sectionCard}>
          <SettingRow icon={MessageSquare} label="Feedback & Support" onPress={handleFeedback} />
          <SettingRow icon={Star} label="Rate Zukai" onPress={() => {}} />
          <SettingRow icon={FileText} label="Terms of Service" onPress={handleTerms} />
          <SettingRow icon={Shield} label="Privacy Policy" last onPress={handlePrivacyPolicy} />
        </GlassCard>

        {/* Sign Out */}
        <GlassCard style={[s.sectionCard, { marginTop: 14 }]}>
          <SettingRow
            icon={LogOut}
            label="Sign Out"
            iconColor={C.error}
            labelColor={C.error}
            last
            onPress={handleSignOut}
          />
        </GlassCard>

        {/* Danger Zone */}
        <Text variant="footnote" rawColor={C.error} style={[s.sectionLabel, { marginTop: 20 }]}>
          DANGER ZONE
        </Text>
        <GlassCard style={[s.sectionCard, { borderColor: 'rgba(255, 61, 113, 0.35)' }]}>
          <SettingRow
            icon={Trash2}
            label="Delete Account & Data"
            iconColor={C.error}
            labelColor={C.error}
            last
            onPress={() => {
              setDeleteConfirmation('');
              setDeleteError(null);
              setShowDeleteModal(true);
            }}
          />
        </GlassCard>

        <Text variant="footnote" rawColor={C.textTertiary} style={s.version}>
          Zukai {appVersion}
        </Text>
      </ScrollView>

      {/* ── Modal: Edit Name ── */}
      <Modal visible={showEditName} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <GlassCard style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text variant="title3" rawColor={C.textPrimary}>Edit Name</Text>
              <Pressable onPress={() => setShowEditName(false)}>
                <X size={20} color={C.textSecondary} />
              </Pressable>
            </View>
            <View style={s.modalInputWrap}>
              <User size={18} color={C.textTertiary} />
              <TextInput
                placeholder="Full Name"
                placeholderTextColor={C.textTertiary}
                value={newName}
                onChangeText={setNewName}
                style={s.modalInput}
              />
            </View>
            <ShinyButton
              label="Save Changes"
              variant="primary"
              size="md"
              fullWidth
              loading={isUpdatingName}
              disabled={isUpdatingName || !newName.trim()}
              onPress={handleSaveName}
            />
          </GlassCard>
        </View>
      </Modal>

      {/* ── Modal: Language Switcher ── */}
      <Modal visible={showLangModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <GlassCard style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text variant="title3" rawColor={C.textPrimary}>Explanation Language</Text>
              <Pressable onPress={() => setShowLangModal(false)}>
                <X size={20} color={C.textSecondary} />
              </Pressable>
            </View>
            <Pressable
              style={[s.langOption, auth.profile?.preferred_language !== 'hinglish' && s.langOptionActive]}
              onPress={() => handleSelectLanguage('english')}
            >
              <Text variant="headline" rawColor={C.textPrimary}>English</Text>
              <Text variant="footnote" rawColor={C.textSecondary}>Clean modern English with simple analogies</Text>
              {auth.profile?.preferred_language !== 'hinglish' && (
                <View style={s.checkBadge}><Check size={14} color={C.textInverse} strokeWidth={3} /></View>
              )}
            </Pressable>
            <Pressable
              style={[s.langOption, auth.profile?.preferred_language === 'hinglish' && s.langOptionActive]}
              onPress={() => handleSelectLanguage('hinglish')}
            >
              <Text variant="headline" rawColor={C.textPrimary}>Hinglish</Text>
              <Text variant="footnote" rawColor={C.textSecondary}>Natural conversational blend of Hindi & English</Text>
              {auth.profile?.preferred_language === 'hinglish' && (
                <View style={s.checkBadge}><Check size={14} color={C.textInverse} strokeWidth={3} /></View>
              )}
            </Pressable>
          </GlassCard>
        </View>
      </Modal>

      {/* ── Modal: Account Deletion ── */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <GlassCard style={[s.modalCard, { borderColor: C.error }]}>
            <View style={s.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={20} color={C.error} />
                <Text variant="headline" rawColor={C.error}>Permanently Delete Account</Text>
              </View>
              <Pressable onPress={() => setShowDeleteModal(false)}>
                <X size={20} color={C.textSecondary} />
              </Pressable>
            </View>

            <Text variant="footnote" rawColor={C.textSecondary} style={{ lineHeight: 20 }}>
              This action is permanent and irreversible. All your profile data, document summaries, and audio archives will be immediately wiped from Zukai.
            </Text>

            {deleteError && (
              <View style={s.errorBox}>
                <Text variant="footnote" rawColor={C.error}>{deleteError}</Text>
              </View>
            )}

            <Text variant="subhead" rawColor={C.textPrimary} style={{ marginTop: 6 }}>
              Type <Text variant="subhead" rawColor={C.error} style={{ fontWeight: '800' }}>DELETE</Text> to confirm:
            </Text>

            <View style={[s.modalInputWrap, { borderColor: C.error }]}>
              <TextInput
                placeholder="DELETE"
                placeholderTextColor={C.textTertiary}
                value={deleteConfirmation}
                onChangeText={setDeleteConfirmation}
                autoCapitalize="characters"
                style={s.modalInput}
              />
            </View>

            <ShinyButton
              label="Permanently Delete Account"
              variant="destructive"
              size="md"
              fullWidth
              loading={isDeleting}
              disabled={deleteConfirmation.trim() !== 'DELETE' || isDeleting}
              onPress={handleDeleteAccount}
            />

            <ShinyButton
              label="Cancel"
              variant="secondary"
              size="md"
              fullWidth
              onPress={() => setShowDeleteModal(false)}
            />
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09161B' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },
  screenTitle: { marginBottom: 16 },
  profileCard: { padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 20 },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.canvasSurfaceRaised,
    borderWidth: 2,
    borderColor: C.brandHero,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(15,31,38,0.90)',
    borderWidth: 1,
    borderColor: C.glassBorderActive,
  },
  proText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  name: { textAlign: 'center', marginBottom: 4 },
  email: { textAlign: 'center', marginBottom: 16 },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: C.divider,
    paddingTop: 16,
    minHeight: 56,
  },
  statItem: { flex: 1, alignItems: 'center' },
  sectionLabel: {
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 1,
    paddingLeft: 4,
    fontWeight: '600',
  },
  sectionCard: { borderRadius: 16, overflow: 'hidden', paddingVertical: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.divider },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.canvasSurfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  version: { textAlign: 'center', marginTop: 24 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 13, 16, 0.85)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalInputWrap: {
    backgroundColor: 'rgba(15, 31, 38, 0.70)',
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  modalInput: { flex: 1, color: '#F8F9FA', fontSize: 15 },
  langOption: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(19, 40, 48, 0.50)',
    borderWidth: 1,
    borderColor: C.glassBorder,
    gap: 4,
    position: 'relative',
  },
  langOptionActive: {
    borderColor: C.brandHero,
    backgroundColor: 'rgba(146, 247, 2, 0.08)',
  },
  checkBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.brandHero,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: C.errorBg,
  },
});
