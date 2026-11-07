/**
 * ZUKAI — Upload & Audio Configuration Screen
 * Location: /zukai/src/app/(tabs)/upload.tsx
 * Description: File picker, pre-upload validation, concurrent TUS upload,
 *              explanation language/depth/voice options, quota warning, and job creation.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
  BookOpen,
  Volume2,
  X,
  ChevronRight,
} from 'lucide-react-native';
import { MeshBackground } from '../../components/MeshBackground';
import { GlassCard } from '../../components/GlassCard';
import { Text } from '../../components/Text';
import { ShinyButton } from '../../components/ShinyButton';
import { Mascot } from '../../components/Mascot';
import { LanguageToggle, Language } from '../../components/LanguageToggle';
import { useUploadStore } from '@/features/upload/uploadManager';
import {
  validatePickedFile,
  checkDuplicateDocument,
  FileMetadata,
  ValidationResult,
} from '@/features/upload/validation';
import { calculateDepthEstimates, estimateSourceWords } from '@/features/upload/estimation';
import { VOICES, VoiceOption, DEFAULT_VOICE_ID } from '@/features/jobs/voicesConfig';
import { useCreateAudioJob } from '@/features/jobs/hooks/useJob';
import { useUsageSummary } from '@/features/usage/hooks/useUsageSummary';
import { useDocuments } from '@/features/documents/hooks/useDocuments';
import { useAuthStore } from '@/lib/authStore';
import { mapRpcError } from '@/lib/rpcErrors';
import { DepthMode } from '@/types/database';

const LAST_OPTIONS_KEY = '@zukai_last_upload_options_v1';

const C = {
  brandHero: '#92F702',
  brandVisor: '#0BF807',
  canvasSurfaceRaised: '#132830',
  canvasSurfaceHighlight: '#18333D',
  textPrimary: '#F8F9FA',
  textSecondary: '#B5C4CC',
  textTertiary: '#6B828F',
  textInverse: '#09161B',
  success: '#00E676',
  warning: '#FFD600',
  error: '#FF5252',
  glassBorder: 'rgba(255,255,255,0.12)',
  glassBorderActive: 'rgba(146,247,2,0.45)',
};

export default function UploadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  const { data: usageSummary } = useUsageSummary();
  const { data: recentDocs = [] } = useDocuments();
  const createAudioJobMutation = useCreateAudioJob();

  const {
    status: uploadStatus,
    progress: uploadProgress,
    activeDocument,
    file: activeFile,
    errorMessage: uploadError,
    startUpload,
    clearUpload,
  } = useUploadStore();

  // Configuration options state
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    (profile?.preferred_language as Language) || 'english'
  );
  const [selectedDepth, setSelectedDepth] = useState<DepthMode>('standard');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(DEFAULT_VOICE_ID);
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);
  const [validationAlert, setValidationAlert] = useState<ValidationResult | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<FileMetadata | null>(null);

  // Load last used options
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LAST_OPTIONS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.language) setSelectedLanguage(parsed.language);
          if (parsed.depth) setSelectedDepth(parsed.depth);
          if (parsed.voiceId) setSelectedVoiceId(parsed.voiceId);
        }
      } catch {
        // Fall back to defaults
      }
    })();
  }, []);

  // Compute depth estimates based on file size
  const depthEstimates = useMemo(() => {
    const size = activeFile?.size || 2 * 1024 * 1024;
    const ext = activeFile?.name.split('.').pop() || 'pdf';
    const words = estimateSourceWords(size, ext);
    return calculateDepthEstimates(words);
  }, [activeFile]);

  // Handle document picking
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const pickedFile: FileMetadata = {
        name: asset.name,
        size: asset.size || 0,
        mimeType: asset.mimeType,
        uri: asset.uri,
      };

      // 1. Client-Side Validation
      const planMaxBytes = (usageSummary?.max_documents_limit ? 50 : 10) * 1024 * 1024;
      const validation = validatePickedFile(pickedFile, planMaxBytes);

      if (!validation.isValid) {
        setValidationAlert(validation);
        return;
      }

      // 2. Duplicate Detection
      const isDuplicate = checkDuplicateDocument(
        pickedFile,
        recentDocs.map((d) => ({
          original_filename: d.original_filename,
          file_size_bytes: d.file_size_bytes,
        }))
      );

      if (isDuplicate) {
        setDuplicateWarning(pickedFile);
        return;
      }

      // 3. Initiate upload immediately
      setValidationAlert(null);
      setDuplicateWarning(null);
      await startUpload(pickedFile);
    } catch (err: any) {
      Alert.alert('File Picker Error', err.message || 'Unable to open document picker');
    }
  };

  // Proceed with duplicate file upload anyway
  const handleProceedDuplicate = async () => {
    if (duplicateWarning) {
      const fileToUpload = duplicateWarning;
      setDuplicateWarning(null);
      await startUpload(fileToUpload);
    }
  };

  // Create Audio Job
  const handleCreateAudio = async () => {
    if (!activeDocument) return;
    if (isSubmittingJob || createAudioJobMutation.isPending) return;

    // Check estimated minutes against available quota
    const chosenEstimate = depthEstimates[selectedDepth];
    const minutesLeft =
      (usageSummary?.monthly_audio_minutes_limit ?? 45) -
      (usageSummary?.monthly_audio_minutes_used ?? 0);

    if (minutesLeft < chosenEstimate.estimatedMinutes) {
      Alert.alert(
        'Quota Warning',
        `This explanation needs ~${chosenEstimate.estimatedMinutes} minutes, but you only have ${Math.max(0, minutesLeft)} minutes remaining this month. Upgrade to Pro for unlimited audio?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/paywall' as any) },
        ]
      );
      return;
    }

    try {
      setIsSubmittingJob(true);

      // Persist options
      await AsyncStorage.setItem(
        LAST_OPTIONS_KEY,
        JSON.stringify({
          language: selectedLanguage,
          depth: selectedDepth,
          voiceId: selectedVoiceId,
        })
      );

      const job = await createAudioJobMutation.mutateAsync({
        documentId: activeDocument.id,
        language: selectedLanguage,
        depth: selectedDepth,
        voice: selectedVoiceId,
      });

      // Clear upload active state and navigate to live processing
      clearUpload();
      router.push(`/processing/${job.id}` as any);
    } catch (err: any) {
      const friendlyError = mapRpcError(err);
      Alert.alert(friendlyError.title, friendlyError.message);
    } finally {
      setIsSubmittingJob(false);
    }
  };

  // Render Idle Picker View
  if (!activeFile && uploadStatus === 'idle') {
    return (
      <View style={styles.root}>
        <MeshBackground variant="upload" />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 24, paddingBottom: 120 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text variant="title2" rawColor={C.textPrimary} style={styles.title}>
            Upload Document
          </Text>
          <Text variant="subhead" rawColor={C.textSecondary} style={styles.sub}>
            Transform any PDF, Word or Text document into an audio breakdown
          </Text>

          <View style={styles.mascotWrap}>
            <Mascot pose="welcome" size={150} animated />
          </View>

          <Text variant="subhead" rawColor={C.textSecondary} style={styles.quote}>
            "Pick a document and I'll explain it simply in English or Hinglish."
          </Text>

          {/* Validation Alert Banner */}
          {validationAlert && (
            <GlassCard style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <AlertTriangle size={18} color={C.error} />
                <Text variant="headline" rawColor={C.error}>
                  {validationAlert.title}
                </Text>
              </View>
              <Text variant="footnote" rawColor={C.textSecondary} style={{ marginTop: 4 }}>
                {validationAlert.message}
              </Text>
              <Pressable
                onPress={() => setValidationAlert(null)}
                style={styles.dismissAlertBtn}
              >
                <Text variant="caption" rawColor={C.brandHero}>
                  Dismiss
                </Text>
              </Pressable>
            </GlassCard>
          )}

          {/* Duplicate Document Warning */}
          {duplicateWarning && (
            <GlassCard style={styles.warningCard}>
              <View style={styles.alertHeader}>
                <AlertTriangle size={18} color={C.warning} />
                <Text variant="headline" rawColor={C.warning}>
                  Duplicate Document
                </Text>
              </View>
              <Text variant="footnote" rawColor={C.textSecondary} style={{ marginTop: 4 }}>
                You recently uploaded a document with the same name and size ("{duplicateWarning.name}").
              </Text>
              <View style={styles.dupBtnRow}>
                <Pressable
                  onPress={() => setDuplicateWarning(null)}
                  style={styles.dupCancelBtn}
                >
                  <Text variant="footnote" rawColor={C.textSecondary}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable onPress={handleProceedDuplicate} style={styles.dupProceedBtn}>
                  <Text variant="footnote" rawColor={C.textInverse} style={{ fontWeight: '700' }}>
                    Upload Anyway
                  </Text>
                </Pressable>
              </View>
            </GlassCard>
          )}

          {/* Dropzone Card */}
          <Pressable onPress={handlePickDocument} style={styles.dropZone}>
            <View style={styles.dropZoneIconCircle}>
              <UploadCloud size={32} color={C.brandHero} strokeWidth={2} />
            </View>
            <Text variant="headline" rawColor={C.textPrimary} style={{ marginTop: 8 }}>
              Tap to pick document
            </Text>
            <Text variant="footnote" rawColor={C.textTertiary}>
              PDF, DOCX, PPTX, TXT • Up to 50MB
            </Text>
          </Pressable>

          {/* Supported Format Pills */}
          <View style={styles.formatsRow}>
            {['PDF', 'DOCX', 'PPTX', 'TXT'].map((f) => (
              <View key={f} style={styles.formatPill}>
                <Text variant="caption" rawColor={C.textSecondary} style={{ fontWeight: '600' }}>
                  {f}
                </Text>
              </View>
            ))}
          </View>

          {/* Pick Button */}
          <ShinyButton
            label="Select Document from Device"
            variant="primary"
            size="lg"
            fullWidth
            icon={<UploadCloud size={20} color={C.textInverse} strokeWidth={2.5} />}
            onPress={handlePickDocument}
            style={styles.cta}
          />

          {/* Quota Row */}
          <View style={styles.quotaRow}>
            <Text variant="footnote" rawColor={C.textTertiary}>
              Monthly Audio:{' '}
              {Math.max(
                0,
                (usageSummary?.monthly_audio_minutes_limit ?? 45) -
                  (usageSummary?.monthly_audio_minutes_used ?? 0)
              )}{' '}
              mins left •{' '}
            </Text>
            <Pressable onPress={() => router.push('/paywall' as any)}>
              <Text variant="footnote" rawColor={C.brandHero} style={{ fontWeight: '700' }}>
                Upgrade Plan
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Active File Uploading / Options View
  const isUploading =
    uploadStatus === 'uploading' ||
    uploadStatus === 'preparing' ||
    uploadStatus === 'completing';
  const isCompleted = uploadStatus === 'completed';
  const isFailed = uploadStatus === 'failed';

  const fileSizeMb = activeFile ? (activeFile.size / (1024 * 1024)).toFixed(1) : '0';
  const speedKbps = Math.round(uploadProgress.speedBytesPerSec / 1024);

  return (
    <View style={styles.root}>
      <MeshBackground variant="upload" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="title2" rawColor={C.textPrimary} style={styles.title}>
          Configure Audio
        </Text>
        <Text variant="subhead" rawColor={C.textSecondary} style={styles.sub}>
          Customize your explanation while your file securely uploads
        </Text>

        {/* 1. File Summary Card with Live Upload Bar */}
        <GlassCard style={styles.fileCard}>
          <View style={styles.fileRow}>
            <View style={styles.fileIconWrap}>
              <FileText size={24} color={C.brandHero} />
            </View>
            <View style={styles.fileDetails}>
              <Text variant="headline" rawColor={C.textPrimary} numberOfLines={1}>
                {activeFile?.name || 'Document'}
              </Text>
              <Text variant="footnote" rawColor={C.textTertiary}>
                {fileSizeMb} MB • {activeFile?.name.split('.').pop()?.toUpperCase()}
              </Text>
            </View>
            <Pressable onPress={clearUpload} hitSlop={8} style={styles.fileRemoveBtn}>
              <X size={16} color={C.textTertiary} />
            </Pressable>
          </View>

          {/* Live Progress Bar inside Card */}
          <View style={styles.uploadProgressSection}>
            <View style={styles.uploadProgressTrack}>
              <LinearGradient
                colors={isFailed ? [C.error, C.error] : [C.brandHero, C.brandVisor]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.uploadProgressFill,
                  { width: isCompleted ? '100%' : `${uploadProgress.percent}%` },
                ]}
              />
            </View>
            <View style={styles.uploadProgressTextRow}>
              <Text
                variant="caption"
                rawColor={isFailed ? C.error : isCompleted ? C.success : C.textTertiary}
              >
                {isCompleted
                  ? 'Upload complete and verified ✓'
                  : isFailed
                  ? `Upload failed: ${uploadError || 'Network error'}`
                  : `Uploading: ${uploadProgress.percent}% (${speedKbps} KB/s)`}
              </Text>
              {isFailed && (
                <Pressable
                  onPress={() => activeFile && startUpload(activeFile)}
                  style={styles.retryUploadBtn}
                >
                  <RotateCcw size={12} color={C.brandHero} />
                  <Text variant="caption" rawColor={C.brandHero}>
                    Retry
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </GlassCard>

        {/* 2. Language Selector */}
        <View style={styles.section}>
          <Text variant="headline" rawColor={C.textPrimary} style={styles.sectionTitle}>
            Explanation Language
          </Text>
          <LanguageToggle value={selectedLanguage} onChange={setSelectedLanguage} />
        </View>

        {/* 3. Depth Mode Selector */}
        <View style={styles.section}>
          <Text variant="headline" rawColor={C.textPrimary} style={styles.sectionTitle}>
            Detail Level
          </Text>
          <View style={styles.depthList}>
            {(['quick', 'standard', 'deep'] as DepthMode[]).map((mode) => {
              const estimate = depthEstimates[mode];
              const isSelected = selectedDepth === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setSelectedDepth(mode)}
                  style={[
                    styles.depthCardWrap,
                    isSelected && styles.depthCardSelected,
                  ]}
                >
                  <GlassCard style={styles.depthCard}>
                    <View style={styles.depthTopRow}>
                      <View style={styles.depthTitleGroup}>
                        <Text
                          variant="headline"
                          rawColor={isSelected ? C.brandHero : C.textPrimary}
                        >
                          {estimate.label}
                        </Text>
                        <View style={styles.durationPill}>
                          <Sparkles size={12} color={C.brandHero} />
                          <Text variant="caption" rawColor={C.brandHero} style={{ fontWeight: '700' }}>
                            {estimate.durationLabel}
                          </Text>
                        </View>
                      </View>
                      {isSelected && <CheckCircle2 size={18} color={C.brandHero} />}
                    </View>
                    <Text variant="footnote" rawColor={C.textSecondary} style={{ marginTop: 6 }}>
                      {estimate.description}
                    </Text>
                  </GlassCard>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 4. Voice Persona Selector */}
        <View style={styles.section}>
          <Text variant="headline" rawColor={C.textPrimary} style={styles.sectionTitle}>
            AI Narrator Voice
          </Text>
          <View style={styles.voiceGrid}>
            {VOICES.map((v) => {
              const isSelected = selectedVoiceId === v.id;
              return (
                <Pressable
                  key={v.id}
                  onPress={() => setSelectedVoiceId(v.id)}
                  style={[
                    styles.voiceCardWrap,
                    isSelected && styles.voiceCardSelected,
                  ]}
                >
                  <GlassCard style={styles.voiceCard}>
                    <View style={styles.voiceHeader}>
                      <Volume2 size={16} color={isSelected ? C.brandHero : C.textSecondary} />
                      <Text
                        variant="headline"
                        rawColor={isSelected ? C.brandHero : C.textPrimary}
                      >
                        {v.name}
                      </Text>
                    </View>
                    <Text variant="caption" rawColor={C.brandHero} style={{ fontWeight: '600' }}>
                      {v.role}
                    </Text>
                    <Text variant="caption" rawColor={C.textTertiary} numberOfLines={2}>
                      {v.tone}
                    </Text>
                  </GlassCard>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 5. Primary Action CTA */}
        <View style={styles.actionContainer}>
          <ShinyButton
            label={
              isSubmittingJob
                ? 'Creating Job...'
                : isUploading
                ? `Uploading (${uploadProgress.percent}%)...`
                : isFailed
                ? 'Retry File Upload'
                : 'Create Audio Explanation'
            }
            variant={isFailed ? 'destructive' : 'primary'}
            size="lg"
            fullWidth
            disabled={isUploading || isSubmittingJob}
            loading={isSubmittingJob || isUploading}
            icon={
              !isSubmittingJob && !isUploading ? (
                <Zap size={20} color={C.textInverse} strokeWidth={2.5} />
              ) : undefined
            }
            onPress={isFailed ? () => activeFile && startUpload(activeFile) : handleCreateAudio}
            style={styles.cta}
          />

          <Text variant="caption" rawColor={C.textTertiary} style={{ textAlign: 'center' }}>
            Consumes ~{depthEstimates[selectedDepth].estimatedMinutes} minutes of your monthly audio allowance.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09161B' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },
  title: { textAlign: 'center', marginBottom: 6 },
  sub: { textAlign: 'center', marginBottom: 20 },
  mascotWrap: { alignItems: 'center', marginBottom: 12 },
  quote: { textAlign: 'center', fontStyle: 'italic', marginBottom: 24, paddingHorizontal: 16 },
  dropZone: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(146,247,2,0.4)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(146,247,2,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dropZoneIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.canvasSurfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatsRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 24 },
  formatPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.canvasSurfaceRaised,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  cta: { marginBottom: 12 },
  quotaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  alertCard: { padding: 16, borderRadius: 16, width: '100%', marginBottom: 16, borderColor: 'rgba(255,82,82,0.3)' },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dismissAlertBtn: { alignSelf: 'flex-end', marginTop: 8 },
  warningCard: { padding: 16, borderRadius: 16, width: '100%', marginBottom: 16, borderColor: 'rgba(255,214,0,0.3)' },
  dupBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
  dupCancelBtn: { paddingVertical: 6, paddingHorizontal: 12 },
  dupProceedBtn: { backgroundColor: C.brandHero, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 12 },
  fileCard: { padding: 16, borderRadius: 18, marginBottom: 20 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.canvasSurfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileDetails: { flex: 1, gap: 2 },
  fileRemoveBtn: { padding: 6 },
  uploadProgressSection: { marginTop: 14, gap: 6 },
  uploadProgressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  uploadProgressFill: { height: 4, borderRadius: 2 },
  uploadProgressTextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  retryUploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  section: { marginBottom: 24, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  depthList: { gap: 10 },
  depthCardWrap: { borderRadius: 16, overflow: 'hidden' },
  depthCardSelected: { borderWidth: 1.5, borderColor: C.brandHero, borderRadius: 16 },
  depthCard: { padding: 14, borderRadius: 16 },
  depthTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  depthTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(146,247,2,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  voiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  voiceCardWrap: { width: '48%', borderRadius: 16, overflow: 'hidden' },
  voiceCardSelected: { borderWidth: 1.5, borderColor: C.brandHero, borderRadius: 16 },
  voiceCard: { padding: 12, borderRadius: 16, gap: 4 },
  voiceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionContainer: { marginTop: 8, marginBottom: 32 },
});
