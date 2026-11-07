/**
 * ZUKAI — Live Processing Screen [jobId]
 * Location: /zukai/src/app/processing/[jobId].tsx
 * Description: Realtime-driven synthesis progress, multi-stage step indicator,
 *              cancel confirmation sheet, error recovery, and dev-mode state simulator.
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  AppState,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  XCircle,
  Sparkles,
  Loader,
  Clock,
  Zap,
} from 'lucide-react-native';
import { MeshBackground } from '../../components/MeshBackground';
import { GlassCard } from '../../components/GlassCard';
import { Text } from '../../components/Text';
import { ShinyButton } from '../../components/ShinyButton';
import { Mascot } from '../../components/Mascot';
import { useJob, useCancelJob, useCreateAudioJob } from '@/features/jobs/hooks/useJob';
import { JobStatus, Database } from '@/types/database';
import { mapRpcError } from '@/lib/rpcErrors';

type AudioJobRow = Database['public']['Tables']['audio_jobs']['Row'];

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

interface StepDefinition {
  id: string;
  label: string;
  description: string;
  activeStatus: JobStatus;
  minProgress: number;
}

const PIPELINE_STEPS: StepDefinition[] = [
  {
    id: 'extracting',
    label: 'Extracting Document Text',
    description: 'Parsing pages, structure, and text content',
    activeStatus: 'extracting',
    minProgress: 10,
  },
  {
    id: 'scripting',
    label: 'Synthesizing Explanation',
    description: 'Simplifying ideas and crafting narration script',
    activeStatus: 'scripting',
    minProgress: 35,
  },
  {
    id: 'voicing',
    label: 'Recording AI Voice Narration',
    description: 'Streaming neural speech in target voice',
    activeStatus: 'voicing',
    minProgress: 65,
  },
  {
    id: 'assembling',
    label: 'Mastering Audio & Chapters',
    description: 'Loudness normalization and transcript alignment',
    activeStatus: 'assembling',
    minProgress: 90,
  },
];

export default function ProcessingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();

  // Fetch real job data via hook with Realtime websocket updates
  const { data: realJob, isLoading, refetch } = useJob(jobId || '');
  const cancelJobMutation = useCancelJob();
  const createJobMutation = useCreateAudioJob();

  // Cancel confirmation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Dev-only simulated state overrides
  const [simulatedJob, setSimulatedJob] = useState<Partial<AudioJobRow> | null>(null);

  // Fallback Polling every 3s if not terminal
  useEffect(() => {
    if (!jobId || simulatedJob) return;

    const interval = setInterval(() => {
      if (
        realJob &&
        realJob.status !== 'ready' &&
        realJob.status !== 'failed' &&
        realJob.status !== 'canceled'
      ) {
        refetch();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId, realJob, refetch, simulatedJob]);

  // Reconcile on App Foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && jobId) {
        refetch();
      }
    });
    return () => subscription.remove();
  }, [jobId, refetch]);

  // Effective job prioritizing simulation if active in __DEV__
  const effectiveJob: Partial<AudioJobRow> = useMemo(() => {
    if (simulatedJob) return simulatedJob;
    return (
      realJob || {
        id: jobId || 'unknown',
        status: 'queued' as JobStatus,
        progress: 0,
        current_step: 'Waiting in line for processing worker',
      }
    );
  }, [realJob, simulatedJob, jobId]);

  const status = effectiveJob.status || 'queued';
  const progress = effectiveJob.progress ?? 0;

  // Mascot pose determination
  const mascotPose = useMemo(() => {
    if (status === 'ready') return 'success';
    if (status === 'failed') return 'error';
    if (status === 'voicing' || status === 'assembling') return 'listening';
    return 'thinking';
  }, [status]);

  // Cancel Handler
  const handleConfirmCancel = async () => {
    if (!jobId) return;
    try {
      await cancelJobMutation.mutateAsync(jobId);
      setShowCancelModal(false);
      refetch();
    } catch (err: any) {
      const mapped = mapRpcError(err);
      Alert.alert(mapped.title, mapped.message);
    }
  };

  // Retry Handler
  const handleRetryJob = async () => {
    if (!realJob?.document_id) return;
    try {
      const newJob = await createJobMutation.mutateAsync({
        documentId: realJob.document_id,
        language: realJob.language,
        depth: realJob.depth,
        voice: realJob.voice,
      });
      router.replace(`/processing/${newJob.id}` as any);
    } catch (err: any) {
      const mapped = mapRpcError(err);
      Alert.alert(mapped.title, mapped.message);
    }
  };

  // __DEV__ state advancement simulator
  const handleAdvanceSimulation = () => {
    const sequence: Array<{ status: JobStatus; progress: number; step: string }> = [
      { status: 'queued', progress: 0, step: 'Waiting in line' },
      { status: 'extracting', progress: 25, step: 'Extracting document text' },
      { status: 'scripting', progress: 50, step: 'Drafting spoken explanation' },
      { status: 'voicing', progress: 75, step: 'Streaming AI voice narration' },
      { status: 'assembling', progress: 92, step: 'Final audio mastering' },
      { status: 'ready', progress: 100, step: 'Completed successfully' },
      { status: 'failed', progress: 30, step: 'Content filter error' },
    ];

    const currentIndex = sequence.findIndex((s) => s.status === status);
    const nextItem = sequence[(currentIndex + 1) % sequence.length];
    setSimulatedJob({
      ...effectiveJob,
      status: nextItem.status,
      progress: nextItem.progress,
      current_step: nextItem.step,
    });
  };

  const isTerminal = status === 'ready' || status === 'failed' || status === 'canceled';

  return (
    <View style={styles.root}>
      <MeshBackground variant="processing" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.push('/(tabs)/home')}
          hitSlop={12}
        >
          <ChevronLeft size={24} color={C.textSecondary} strokeWidth={2} />
        </Pressable>
        <Text variant="headline" rawColor={C.textPrimary} style={styles.headerTitle}>
          {status === 'ready'
            ? 'Explanation Ready'
            : status === 'failed'
            ? 'Processing Failed'
            : 'Generating Audio'}
        </Text>
        {!isTerminal ? (
          <Pressable
            style={styles.cancelHeaderBtn}
            onPress={() => setShowCancelModal(true)}
            hitSlop={8}
          >
            <Text variant="caption" rawColor={C.textTertiary}>
              Cancel
            </Text>
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* __DEV__ Simulator Pill */}
        {__DEV__ && (
          <Pressable onPress={handleAdvanceSimulation} style={styles.devSimulatorPill}>
            <Zap size={14} color={C.brandHero} />
            <Text variant="caption" rawColor={C.brandHero} style={{ fontWeight: '700' }}>
              Dev: Advance State ({status.toUpperCase()} {progress}%)
            </Text>
          </Pressable>
        )}

        {/* Mascot */}
        <View style={styles.mascotArea}>
          <Mascot pose={mascotPose} size={170} animated />
        </View>

        {/* Dynamic Status Quote Bubble */}
        <GlassCard style={styles.quoteCard}>
          <Text variant="headline" rawColor={C.textPrimary} style={{ textAlign: 'center' }}>
            {status === 'queued'
              ? 'Your document is in queue...'
              : status === 'ready'
              ? 'All finished! Your audio breakdown is ready.'
              : status === 'failed'
              ? 'Oops! Something went wrong.'
              : status === 'canceled'
              ? 'Generation canceled.'
              : effectiveJob.current_step || 'Synthesizing your explanation...'}
          </Text>
          <Text variant="footnote" rawColor={C.textTertiary} style={styles.subtext}>
            {status === 'queued'
              ? 'We will automatically begin processing in a few moments.'
              : status === 'ready'
              ? 'Listen now with karaoke transcripts and chapters.'
              : status === 'failed'
              ? effectiveJob.error_message || 'The AI model was unable to process this document.'
              : 'You can leave this screen anytime — your audio will keep processing.'}
          </Text>
        </GlassCard>

        {/* Progress Bar & Counter (Hidden when terminal) */}
        {!isTerminal && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeaderRow}>
              <Text variant="caption" rawColor={C.textSecondary}>
                Overall Progress
              </Text>
              <Text variant="monoCounter" rawColor={C.brandHero}>
                {progress}%
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={[C.brandHero, C.brandVisor]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progress}%` }]}
              />
            </View>
          </View>
        )}

        {/* Pipeline Steps Card */}
        <GlassCard style={styles.stepsCard}>
          {PIPELINE_STEPS.map((step, index) => {
            const isCompleted =
              status === 'ready' ||
              (status !== 'failed' && status !== 'queued' && progress >= step.minProgress);
            const isActive =
              status === step.activeStatus ||
              (status !== 'ready' &&
                status !== 'failed' &&
                status !== 'queued' &&
                progress >= step.minProgress - 15 &&
                progress < step.minProgress + 15);

            return (
              <View key={step.id}>
                <View style={styles.stepRow}>
                  <View
                    style={[
                      styles.stepIconWrap,
                      isCompleted && styles.stepIconCompleted,
                      isActive && styles.stepIconActive,
                    ]}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={16} color={C.success} />
                    ) : isActive ? (
                      <ActivityIndicator size="small" color={C.brandHero} />
                    ) : (
                      <View style={styles.stepDotPending} />
                    )}
                  </View>

                  <View style={styles.stepTextGroup}>
                    <Text
                      variant="headline"
                      rawColor={
                        isCompleted ? C.textPrimary : isActive ? C.brandHero : C.textTertiary
                      }
                    >
                      {step.label}
                    </Text>
                    <Text variant="caption" rawColor={C.textTertiary}>
                      {step.description}
                    </Text>
                  </View>
                </View>

                {index < PIPELINE_STEPS.length - 1 && <View style={styles.stepConnector} />}
              </View>
            );
          })}
        </GlassCard>

        {/* Action Buttons */}
        <View style={styles.actionArea}>
          {status === 'ready' && (
            <ShinyButton
              label="Listen to Audio Now"
              variant="primary"
              size="lg"
              fullWidth
              icon={<Play size={20} color={C.textInverse} strokeWidth={2.5} />}
              onPress={() => router.push('/player' as any)}
            />
          )}

          {status === 'failed' && (
            <View style={{ width: '100%', gap: 12 }}>
              <ShinyButton
                label="Retry Explanation"
                variant="primary"
                size="lg"
                fullWidth
                icon={<RotateCcw size={18} color={C.textInverse} strokeWidth={2.5} />}
                onPress={handleRetryJob}
              />
              <ShinyButton
                label="Pick Another Document"
                variant="secondary"
                size="md"
                fullWidth
                onPress={() => router.push('/(tabs)/upload')}
              />
            </View>
          )}

          {!isTerminal && (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Text variant="caption" rawColor={C.textTertiary} style={{ textAlign: 'center' }}>
                Generation takes ~30–90 seconds depending on document length.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Cancel Confirmation Sheet Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <GlassCard style={styles.modalCard}>
            <Text variant="title3" rawColor={C.textPrimary} style={{ marginBottom: 8 }}>
              Cancel Audio Generation?
            </Text>
            <Text variant="subhead" rawColor={C.textSecondary} style={{ marginBottom: 20 }}>
              Are you sure you want to cancel? Any progress made so far will be lost.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowCancelModal(false)}
                style={styles.modalCancelBtn}
              >
                <Text variant="headline" rawColor={C.textSecondary}>
                  Keep Going
                </Text>
              </Pressable>
              <ShinyButton
                label="Yes, Cancel Job"
                variant="destructive"
                size="md"
                onPress={handleConfirmCancel}
              />
            </View>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09161B' },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: { flex: 1, textAlign: 'center' },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  cancelHeaderBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  content: { paddingHorizontal: 20, alignItems: 'center' },
  devSimulatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(146,247,2,0.15)',
    borderWidth: 1,
    borderColor: C.brandHero,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  mascotArea: { marginVertical: 12, alignItems: 'center' },
  quoteCard: { padding: 18, borderRadius: 18, width: '100%', marginBottom: 20, gap: 6 },
  subtext: { textAlign: 'center', marginTop: 4 },
  progressContainer: { width: '100%', marginBottom: 20, gap: 8 },
  progressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: { height: 8, borderRadius: 4, minWidth: 8 },
  stepsCard: { padding: 16, borderRadius: 18, width: '100%', marginBottom: 24 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 },
  stepIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.canvasSurfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconCompleted: { backgroundColor: 'rgba(0,230,118,0.15)' },
  stepIconActive: { backgroundColor: 'rgba(146,247,2,0.15)', borderWidth: 1, borderColor: C.brandHero },
  stepDotPending: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.textTertiary },
  stepTextGroup: { flex: 1, gap: 2 },
  stepConnector: { width: 2, height: 16, backgroundColor: 'rgba(255,255,255,0.08)', marginLeft: 15 },
  actionArea: { width: '100%', marginTop: 8 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: { padding: 24, borderRadius: 20, width: '100%' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16 },
  modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 14 },
});
