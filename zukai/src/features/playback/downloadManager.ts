/**
 * ZUKAI OFFLINE DOWNLOAD MANAGER
 * Location: /zukai/src/features/playback/downloadManager.ts
 * Manages local caching of MP3 audio tracks and transcripts for offline listening.
 */

// expo-file-system v2 moved documentDirectory to Paths; use the legacy subpath.
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSignedAudioUrl, AudioTrackRow, ChapterRow, TranscriptRow } from '@/features/tracks/api/tracksApi';
import { logger } from '@/lib/logger';

const DOWNLOADS_INDEX_KEY = '@zukai_offline_downloads_index_v1';
const DOWNLOADS_DIR = `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory}audio_cache/`;

export interface DownloadedTrackMeta {
  trackId: string;
  documentTitle: string;
  format: string;
  localAudioUri: string;
  fileSizeBytes: number;
  durationSeconds: number;
  chapters: ChapterRow[];
  transcript: TranscriptRow | null;
  downloadedAt: string;
}

async function ensureDirExists(): Promise<void> {
  const info = await FileSystem.getInfoAsync(DOWNLOADS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true });
  }
}

export async function getDownloadsIndex(): Promise<Record<string, DownloadedTrackMeta>> {
  try {
    const raw = await AsyncStorage.getItem(DOWNLOADS_INDEX_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    logger.warn('[DownloadManager] Failed to read index:', err);
    return {};
  }
}

export async function isTrackDownloaded(trackId: string): Promise<boolean> {
  try {
    const index = await getDownloadsIndex();
    const item = index[trackId];
    if (!item) return false;
    const fileInfo = await FileSystem.getInfoAsync(item.localAudioUri);
    return fileInfo.exists;
  } catch {
    return false;
  }
}

export async function getLocalAudioUri(trackId: string): Promise<string | null> {
  const index = await getDownloadsIndex();
  const item = index[trackId];
  if (!item) return null;
  const fileInfo = await FileSystem.getInfoAsync(item.localAudioUri);
  return fileInfo.exists ? item.localAudioUri : null;
}

export async function downloadTrackForOffline(
  track: AudioTrackRow,
  title: string,
  chapters: ChapterRow[] = [],
  transcript: TranscriptRow | null = null,
  onProgress?: (progress: number) => void
): Promise<DownloadedTrackMeta> {
  await ensureDirExists();

  const signedUrl = await getSignedAudioUrl(track.storage_path);
  const ext = track.format || 'mp3';
  const targetUri = `${DOWNLOADS_DIR}${track.id}.${ext}`;

  const downloadResumable = FileSystem.createDownloadResumable(
    signedUrl,
    targetUri,
    {},
    (downloadProgress) => {
      const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
      onProgress?.(progress);
    }
  );

  const downloadResult = await downloadResumable.downloadAsync();
  if (!downloadResult || downloadResult.status !== 200) {
    throw new Error(`Download failed with status ${downloadResult?.status || 'unknown'}`);
  }

  const meta: DownloadedTrackMeta = {
    trackId: track.id,
    documentTitle: title,
    format: ext,
    localAudioUri: targetUri,
    fileSizeBytes: track.file_size_bytes,
    durationSeconds: track.duration_seconds,
    chapters,
    transcript,
    downloadedAt: new Date().toISOString(),
  };

  const index = await getDownloadsIndex();
  index[track.id] = meta;
  await AsyncStorage.setItem(DOWNLOADS_INDEX_KEY, JSON.stringify(index));

  return meta;
}

export async function deleteDownloadedTrack(trackId: string): Promise<void> {
  const index = await getDownloadsIndex();
  const item = index[trackId];
  if (item) {
    try {
      await FileSystem.deleteAsync(item.localAudioUri, { idempotent: true });
    } catch {}
    delete index[trackId];
    await AsyncStorage.setItem(DOWNLOADS_INDEX_KEY, JSON.stringify(index));
  }
}

export async function getStorageUsage(): Promise<{
  count: number;
  totalBytes: number;
  formatted: string;
}> {
  const index = await getDownloadsIndex();
  const items = Object.values(index);
  let totalBytes = 0;

  for (const item of items) {
    try {
      const info = await FileSystem.getInfoAsync(item.localAudioUri);
      if (info.exists && typeof info.size === 'number') {
        totalBytes += info.size;
      }
    } catch {}
  }

  const mb = (totalBytes / (1024 * 1024)).toFixed(1);
  return {
    count: items.length,
    totalBytes,
    formatted: `${mb} MB`,
  };
}

export async function clearAllDownloads(): Promise<void> {
  try {
    await FileSystem.deleteAsync(DOWNLOADS_DIR, { idempotent: true });
    await ensureDirExists();
    await AsyncStorage.removeItem(DOWNLOADS_INDEX_KEY);
  } catch (err) {
    logger.warn('[DownloadManager] Failed to clear downloads:', err);
  }
}

