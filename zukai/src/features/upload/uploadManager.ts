/**
 * ZUKAI RESUMABLE UPLOAD MANAGER & SERVICE
 * Location: /zukai/src/features/upload/uploadManager.ts
 * Description: Zustand store + TUS client engine for 6MB chunked resumable uploads
 *              with network auto-pause/resume, persistence, and token auto-refresh.
 */

import { create } from 'zustand';
import * as tus from 'tus-js-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { createDocumentRow, completeDocumentUpload, DocumentRow } from '@/features/documents/api/documentsApi';
import { FileMetadata } from './validation';

const STORAGE_PERSIST_KEY = '@zukai_active_upload_v1';
const CHUNK_SIZE = 6 * 1024 * 1024; // Exactly 6MB required by Supabase Storage

export type UploadStateStatus =
  | 'idle'
  | 'preparing'
  | 'uploading'
  | 'paused'
  | 'completing'
  | 'completed'
  | 'failed'
  | 'canceled';

export interface UploadProgress {
  bytesSent: number;
  bytesTotal: number;
  percent: number;
  speedBytesPerSec: number;
  etaSeconds: number;
}

export interface UploadState {
  status: UploadStateStatus;
  progress: UploadProgress;
  activeDocument: DocumentRow | null;
  file: FileMetadata | null;
  errorMessage: string | null;
  uploadUrl: string | null;

  // Actions
  startUpload: (file: FileMetadata, orgId?: string | null) => Promise<DocumentRow>;
  pauseUpload: () => void;
  resumeUpload: () => void;
  cancelUpload: () => Promise<void>;
  clearUpload: () => void;
  checkPendingUpload: () => Promise<boolean>;
}

// Internal singleton holding active TUS instance & network subscription
let currentTusUpload: tus.Upload | null = null;
let lastBytesSent = 0;
let lastProgressTime = 0;
let netInfoUnsubscribe: (() => void) | null = null;

export const useUploadStore = create<UploadState>((set, get) => ({
  status: 'idle',
  progress: {
    bytesSent: 0,
    bytesTotal: 0,
    percent: 0,
    speedBytesPerSec: 0,
    etaSeconds: 0,
  },
  activeDocument: null,
  file: null,
  errorMessage: null,
  uploadUrl: null,

  startUpload: async (file: FileMetadata, orgId?: string | null) => {
    // 1. Reset state
    set({
      status: 'preparing',
      file,
      errorMessage: null,
      progress: {
        bytesSent: 0,
        bytesTotal: file.size,
        percent: 0,
        speedBytesPerSec: 0,
        etaSeconds: 0,
      },
    });

    try {
      // 2. Refresh / retrieve session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('UNAUTHORIZED: Please sign in before uploading.');

      const userId = session.user.id;
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';

      // 3. Create placeholder document row in database with status 'uploading'
      const doc = await createDocumentRow({
        title: file.name.replace(/\.[^/.]+$/, ''),
        originalFilename: file.name,
        mimeType: file.mimeType || 'application/pdf',
        fileSizeBytes: file.size,
        storagePath: `${userId}/temp_${Date.now()}/original.${fileExt}`,
        orgId,
      });

      // Update actual storage path with generated document ID:
      // uploads/{owner_id}/{document_id}/original.{ext}
      const actualStoragePath = `${userId}/${doc.id}/original.${fileExt}`;
      await supabase
        .from('documents')
        .update({ storage_path: actualStoragePath })
        .eq('id', doc.id);

      doc.storage_path = actualStoragePath;
      set({ activeDocument: doc, status: 'uploading' });

      // 4. Convert local file URI to Blob
      const fileResponse = await fetch(file.uri);
      const fileBlob = await fileResponse.blob();

      // 5. Construct TUS endpoint
      const supabaseProjectUrl = env.EXPO_PUBLIC_SUPABASE_URL.replace(/\/$/, '');
      const tusEndpoint = `${supabaseProjectUrl}/storage/v1/upload/resumable`;

      // 6. Persist initial upload manifest for cold-start recovery
      await AsyncStorage.setItem(
        STORAGE_PERSIST_KEY,
        JSON.stringify({
          documentId: doc.id,
          storagePath: actualStoragePath,
          fileUri: file.uri,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.mimeType,
          startedAt: Date.now(),
        })
      );

      // 7. Setup NetInfo network observer for auto pause/resume
      if (netInfoUnsubscribe) netInfoUnsubscribe();
      netInfoUnsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
        if (!state.isConnected) {
          logger.warn('[UploadManager] Network disconnected — pausing upload');
          get().pauseUpload();
        } else if (get().status === 'paused') {
          logger.log('[UploadManager] Network restored — resuming upload');
          get().resumeUpload();
        }
      });

      // 8. Initialize TUS Upload
      lastBytesSent = 0;
      lastProgressTime = Date.now();

      return new Promise<DocumentRow>((resolve, reject) => {
        currentTusUpload = new tus.Upload(fileBlob, {
          endpoint: tusEndpoint,
          retryDelays: [0, 1000, 3000, 5000, 10000],
          chunkSize: CHUNK_SIZE,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
          },
          uploadDataDuringCreation: false,
          removeFingerprintOnSuccess: true,
          metadata: {
            bucketName: 'uploads',
            objectName: actualStoragePath,
            contentType: file.mimeType || 'application/pdf',
            cacheControl: '3600',
          },
          onError: (error) => {
            logger.error('[UploadManager] TUS upload error:', error);
            set({
              status: 'failed',
              errorMessage: error.message || 'Network upload failed',
            });
            reject(error);
          },
          onProgress: (bytesSent, bytesTotal) => {
            const now = Date.now();
            const timeDelta = (now - lastProgressTime) / 1000;
            const bytesDelta = bytesSent - lastBytesSent;

            let speed = 0;
            let eta = 0;
            if (timeDelta > 0.5) {
              speed = Math.max(0, bytesDelta / timeDelta);
              const remainingBytes = bytesTotal - bytesSent;
              eta = speed > 0 ? Math.round(remainingBytes / speed) : 0;
              lastBytesSent = bytesSent;
              lastProgressTime = now;
            }

            const percent = bytesTotal > 0 ? Math.min(100, Math.round((bytesSent / bytesTotal) * 100)) : 0;

            set({
              progress: {
                bytesSent,
                bytesTotal,
                percent,
                speedBytesPerSec: speed,
                etaSeconds: eta,
              },
            });
          },
          onSuccess: async () => {
            logger.log('[UploadManager] Storage chunk transfer completed');
            set({ status: 'completing' });

            try {
              // 9. Call secure RPC to mark document as 'uploaded'
              const completedDoc = await completeDocumentUpload(doc.id);
              await AsyncStorage.removeItem(STORAGE_PERSIST_KEY);

              set({
                status: 'completed',
                activeDocument: completedDoc,
                progress: {
                  bytesSent: file.size,
                  bytesTotal: file.size,
                  percent: 100,
                  speedBytesPerSec: 0,
                  etaSeconds: 0,
                },
              });

              if (netInfoUnsubscribe) {
                netInfoUnsubscribe();
                netInfoUnsubscribe = null;
              }
              currentTusUpload = null;
              resolve(completedDoc);
            } catch (rpcErr: any) {
              logger.error('[UploadManager] completeDocumentUpload failed:', rpcErr);
              set({
                status: 'failed',
                errorMessage: rpcErr.message || 'Failed to verify uploaded file',
              });
              reject(rpcErr);
            }
          },
        });

        currentTusUpload.start();
      });
    } catch (err: any) {
      logger.error('[UploadManager] Failed to start upload:', err);
      set({
        status: 'failed',
        errorMessage: err.message || 'Failed to initialize document upload',
      });
      throw err;
    }
  },

  pauseUpload: () => {
    if (currentTusUpload && get().status === 'uploading') {
      currentTusUpload.abort();
      set({ status: 'paused' });
      logger.log('[UploadManager] Upload paused');
    }
  },

  resumeUpload: () => {
    if (currentTusUpload && get().status === 'paused') {
      currentTusUpload.start();
      set({ status: 'uploading' });
      logger.log('[UploadManager] Upload resumed');
    }
  },

  cancelUpload: async () => {
    if (currentTusUpload) {
      currentTusUpload.abort();
      currentTusUpload = null;
    }
    if (netInfoUnsubscribe) {
      netInfoUnsubscribe();
      netInfoUnsubscribe = null;
    }

    const doc = get().activeDocument;
    if (doc) {
      try {
        await supabase
          .from('documents')
          .update({ status: 'failed', error_code: 'CANCELED_BY_USER' })
          .eq('id', doc.id);
      } catch (err) {
        logger.warn('[UploadManager] Failed to mark canceled document:', err);
      }
    }

    await AsyncStorage.removeItem(STORAGE_PERSIST_KEY);
    set({
      status: 'canceled',
      activeDocument: null,
      file: null,
      errorMessage: 'Upload canceled by user',
    });
  },

  clearUpload: () => {
    set({
      status: 'idle',
      activeDocument: null,
      file: null,
      errorMessage: null,
      progress: {
        bytesSent: 0,
        bytesTotal: 0,
        percent: 0,
        speedBytesPerSec: 0,
        etaSeconds: 0,
      },
    });
  },

  checkPendingUpload: async () => {
    try {
      const persisted = await AsyncStorage.getItem(STORAGE_PERSIST_KEY);
      if (!persisted) return false;

      const manifest = JSON.parse(persisted);
      if (manifest.documentId) {
        // Document has pending uncompleted upload
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
}));

