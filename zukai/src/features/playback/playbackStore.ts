/**
 * ZUKAI AUDIO PLAYBACK STORE
 * Location: /zukai/src/features/playback/playbackStore.ts
 * Description: Global Zustand audio player engine backed by expo-av,
 *              supporting background audio, playback speed, chapter seeking,
 *              karaoke transcript tracking, and throttled Supabase progress sync.
 */

import { create } from 'zustand';
import type { AVPlaybackStatus } from 'expo-av';

let AudioModule: typeof import('expo-av').Audio | null = null;
try {
  let hasNativeAV = false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { requireOptionalNativeModule } = require('expo-modules-core');
    hasNativeAV = Boolean(requireOptionalNativeModule && requireOptionalNativeModule('ExponentAV'));
  } catch {
    hasNativeAV = false;
  }

  // If in Jest test environment or native ExponentAV is linked in binary, load Audio
  if (hasNativeAV || process.env.NODE_ENV === 'test' || typeof (global as any).jest !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    AudioModule = require('expo-av').Audio;
  }
} catch (e) {
  // Graceful fallback for Expo Go without native ExponentAV
}
import {
  AudioTrackRow,
  ChapterRow,
  TranscriptRow,
  fetchChapters,
  fetchTranscript,
  getSignedAudioUrl,
} from '@/features/tracks/api/tracksApi';
import {
  updatePlaybackProgress,
  fetchPlaybackProgress,
} from './api/playbackApi';
import { getLocalAudioUri } from './downloadManager';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface PlaybackState {
  // Track metadata
  activeTrack: AudioTrackRow | null;
  documentTitle: string;
  chapters: ChapterRow[];
  transcript: TranscriptRow | null;
  signedUrl: string | null;

  // Real-time playback status
  isPlaying: boolean;
  isBuffering: boolean;
  positionMs: number;
  durationMs: number;
  speed: number;
  hasEnded: boolean;
  isRepeat: boolean;

  // Sleep timer
  sleepTimerMinutes: number | null;
  sleepTimerRemainingSec: number | null;

  // Active chapter and sentence
  activeChapterIndex: number;
  activeSentenceIndex: number;

  // Actions
  playTrack: (track: AudioTrackRow, title?: string) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (positionMs: number) => Promise<void>;
  skipBy: (deltaSeconds: number) => Promise<void>;
  setSpeed: (speed: number) => Promise<void>;
  jumpToChapter: (chapterIndex: number) => Promise<void>;
  seekToSentence: (sentenceIndex: number) => Promise<void>;
  toggleRepeat: () => void;
  setSleepTimer: (minutes: number | null) => void;
  saveBookmark: (note?: string) => Promise<{ success: boolean; error?: string }>;
  stop: () => Promise<void>;
}

// Global reference to the single Audio.Sound instance
let currentSound: any = null;
let lastSyncTimestamp = 0;
let sleepTimerInterval: any = null;

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  activeTrack: null,
  documentTitle: 'Audio Lesson',
  chapters: [],
  transcript: null,
  signedUrl: null,

  isPlaying: false,
  isBuffering: false,
  positionMs: 0,
  durationMs: 0,
  speed: 1.0,
  hasEnded: false,
  isRepeat: false,
  sleepTimerMinutes: null,
  sleepTimerRemainingSec: null,

  activeChapterIndex: 0,
  activeSentenceIndex: 0,

  playTrack: async (track: AudioTrackRow, title?: string) => {
    try {
      // 1. Configure audio mode for background playback
      if (AudioModule) {
        await AudioModule.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      }

      // 2. Unload existing sound if any
      if (currentSound) {
        try {
          await currentSound.unloadAsync();
        } catch {}
        currentSound = null;
      }

      set({
        activeTrack: track,
        documentTitle: title || 'Audio Lesson',
        isBuffering: true,
        isPlaying: false,
        positionMs: 0,
        hasEnded: false,
      });

      // 3. Concurrently fetch audio URI (offline first!), chapters, and transcript
      const localUri = await getLocalAudioUri(track.id).catch(() => null);
      const [signedAudioUrl, chapters, transcript, savedProgress] = await Promise.all([
        localUri ? Promise.resolve(localUri) : getSignedAudioUrl(track.storage_path),
        fetchChapters(track.id).catch(() => [] as ChapterRow[]),
        fetchTranscript(track.id).catch(() => null),
        fetchPlaybackProgress(track.id).catch(() => null),
      ]);
      const effectiveAudioUri = localUri || signedAudioUrl;

      const initialPositionMs =
        savedProgress && savedProgress.position_seconds > 0 && !savedProgress.completed
          ? Math.floor(savedProgress.position_seconds * 1000)
          : 0;

      const currentSpeed = savedProgress?.speed || get().speed || 1.0;

      // 4. Instantiate Sound
      if (AudioModule) {
        const { sound, status } = await AudioModule.Sound.createAsync(
        { uri: effectiveAudioUri },
        {
          shouldPlay: true,
          positionMillis: initialPositionMs,
          rate: currentSpeed,
          shouldCorrectPitch: true,
          progressUpdateIntervalMillis: 250,
        },
        (statusUpdate: AVPlaybackStatus) => {
          if (!statusUpdate.isLoaded) {
            if (statusUpdate.error) {
              logger.error('[AudioPlayer] Error:', statusUpdate.error);
            }
            return;
          }

          const pos = statusUpdate.positionMillis;
          const dur = statusUpdate.durationMillis || track.duration_seconds * 1000;
          const playing = statusUpdate.isPlaying;
          const buffering = statusUpdate.isBuffering;
          const finished = statusUpdate.didJustFinish;

          // Handle repeat
          if (finished && get().isRepeat && currentSound) {
            currentSound.replayAsync().catch(() => {});
            return;
          }

          // Compute active chapter index
          const allChapters = get().chapters;
          let chapterIdx = 0;
          if (allChapters.length > 0) {
            for (let i = allChapters.length - 1; i >= 0; i--) {
              if (pos / 1000 >= allChapters[i].start_seconds) {
                chapterIdx = i;
                break;
              }
            }
          }

          // Compute active sentence index from transcript segments
          let sentenceIdx = 0;
          const transcriptData = get().transcript;
          if (transcriptData && Array.isArray(transcriptData.segments)) {
            const segs = transcriptData.segments as Array<{ start_ms: number; end_ms: number }>;
            for (let i = 0; i < segs.length; i++) {
              if (pos >= segs[i].start_ms && pos <= segs[i].end_ms) {
                sentenceIdx = i;
                break;
              } else if (pos < segs[i].start_ms) {
                sentenceIdx = Math.max(0, i - 1);
                break;
              }
            }
          }

          set({
            positionMs: pos,
            durationMs: dur,
            isPlaying: playing,
            isBuffering: buffering,
            hasEnded: finished,
            activeChapterIndex: chapterIdx,
            activeSentenceIndex: sentenceIdx,
          });

          // Throttled persistence (save every 5 seconds or upon finishing)
          const now = Date.now();
          if (finished || now - lastSyncTimestamp > 5000) {
            lastSyncTimestamp = now;
            updatePlaybackProgress({
              trackId: track.id,
              positionSeconds: Math.floor(pos / 1000),
              speed: currentSpeed,
              completed: finished,
            }).catch((err) => {
              logger.warn('[AudioPlayer] Failed to sync progress:', err);
            });
          }
        }
      );

      currentSound = sound;

      set({
        signedUrl: effectiveAudioUri,
        chapters,
        transcript,
        speed: currentSpeed,
        isBuffering: false,
        isPlaying: status.isLoaded && status.isPlaying,
        durationMs: (status.isLoaded && status.durationMillis) || track.duration_seconds * 1000,
      });
      } else {
        // Fallback for environments without native audio
        set({
          signedUrl: effectiveAudioUri,
          chapters,
          transcript,
          speed: currentSpeed,
          isBuffering: false,
          isPlaying: true,
          durationMs: track.duration_seconds * 1000,
        });
      }
    } catch (err) {
      logger.error('[AudioPlayer] Failed to play track:', err);
      set({ isBuffering: false, isPlaying: false });
    }
  },

  togglePlayPause: async () => {
    if (!currentSound) return;
    try {
      const { isPlaying } = get();
      if (isPlaying) {
        await currentSound.pauseAsync();
        set({ isPlaying: false });
      } else {
        await currentSound.playAsync();
        set({ isPlaying: true });
      }
    } catch (err) {
      logger.error('[AudioPlayer] togglePlayPause failed:', err);
    }
  },

  seekTo: async (positionMs: number) => {
    const clamped = Math.max(0, Math.min(positionMs, get().durationMs));
    set({ positionMs: clamped });
    if (currentSound) {
      try {
        await currentSound.setPositionAsync(clamped);
      } catch (err) {
        logger.error('[AudioPlayer] seekTo failed:', err);
      }
    }
  },

  skipBy: async (deltaSeconds: number) => {
    const { positionMs, durationMs } = get();
    const newPos = positionMs + deltaSeconds * 1000;
    const clamped = Math.max(0, Math.min(newPos, durationMs));
    await get().seekTo(clamped);
  },

  setSpeed: async (speed: number) => {
    set({ speed });
    if (currentSound) {
      try {
        await currentSound.setRateAsync(speed, true);
      } catch (err) {
        logger.error('[AudioPlayer] setSpeed failed:', err);
      }
    }
  },

  jumpToChapter: async (chapterIndex: number) => {
    const { chapters } = get();
    if (chapterIndex >= 0 && chapterIndex < chapters.length) {
      const targetSec = chapters[chapterIndex].start_seconds;
      await get().seekTo(targetSec * 1000);
      set({ activeChapterIndex: chapterIndex });
    }
  },

  seekToSentence: async (sentenceIndex: number) => {
    const { transcript } = get();
    if (transcript && Array.isArray(transcript.segments)) {
      const segs = transcript.segments as Array<{ start_ms: number }>;
      if (segs[sentenceIndex]) {
        await get().seekTo(segs[sentenceIndex].start_ms);
        set({ activeSentenceIndex: sentenceIndex });
      }
    }
  },

  toggleRepeat: () => {
    set((state) => ({ isRepeat: !state.isRepeat }));
  },

  setSleepTimer: (minutes: number | null) => {
    if (sleepTimerInterval) {
      clearInterval(sleepTimerInterval);
      sleepTimerInterval = null;
    }

    if (minutes === null || minutes <= 0) {
      set({ sleepTimerMinutes: null, sleepTimerRemainingSec: null });
      return;
    }

    const totalSeconds = Math.round(minutes * 60);
    set({ sleepTimerMinutes: minutes, sleepTimerRemainingSec: totalSeconds });

    sleepTimerInterval = setInterval(() => {
      const remaining = get().sleepTimerRemainingSec;
      if (remaining === null || remaining <= 1) {
        clearInterval(sleepTimerInterval);
        sleepTimerInterval = null;
        set({ sleepTimerMinutes: null, sleepTimerRemainingSec: null });
        get().togglePlayPause(); // Auto-pause audio on sleep timer expiration
      } else {
        set({ sleepTimerRemainingSec: remaining - 1 });
      }
    }, 1000);
  },

  saveBookmark: async (note?: string) => {
    const { activeTrack, positionMs } = get();
    if (!activeTrack) return { success: false, error: 'No active track' };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return { success: false, error: 'Not authenticated' };

      const { error } = await supabase.from('bookmarks').insert({
        user_id: userId,
        track_id: activeTrack.id,
        position_seconds: Math.round(positionMs / 1000),
        note: note?.trim() || null,
      });

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      logger.warn('[AudioPlayer] Failed to save bookmark:', err?.message);
      return { success: false, error: err?.message };
    }
  },

  stop: async () => {
    if (currentSound) {
      try {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
      } catch {}
      currentSound = null;
    }
    set({
      isPlaying: false,
      positionMs: 0,
      activeTrack: null,
      signedUrl: null,
    });
  },
}));
