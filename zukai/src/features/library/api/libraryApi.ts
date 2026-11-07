/**
 * ZUKAI LIBRARY API REPOSITORY
 * Location: /zukai/src/features/library/api/libraryApi.ts
 * Description: Aggregated library data access combining documents, tracks, and progress
 */

import { supabase } from '@/lib/supabase';
import { DocumentRow } from '@/features/documents/api/documentsApi';
import { AudioTrackRow } from '@/features/tracks/api/tracksApi';
import { PlaybackProgressRow } from '@/features/playback/api/playbackApi';

export interface LibraryItem {
  document: DocumentRow;
  track?: AudioTrackRow;
  progress?: PlaybackProgressRow;
}

export async function fetchLibraryItems(orgId?: string | null): Promise<LibraryItem[]> {
  // 1. Fetch active documents
  let docQuery = supabase
    .from('documents')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (orgId) {
    docQuery = docQuery.eq('org_id', orgId);
  } else {
    docQuery = docQuery.is('org_id', null);
  }

  const { data: docs, error: docError } = await docQuery;
  if (docError) throw docError;
  if (!docs || docs.length === 0) return [];

  const docIds = docs.map((d) => d.id);

  // 2. Fetch corresponding audio tracks
  const { data: tracks, error: trackError } = await supabase
    .from('audio_tracks')
    .select('*')
    .in('document_id', docIds);

  if (trackError) throw trackError;

  // 3. Fetch progress for these tracks
  const trackIds = (tracks ?? []).map((t) => t.id);
  let progressMap = new Map<string, PlaybackProgressRow>();

  if (trackIds.length > 0) {
    const { data: progresses } = await supabase
      .from('playback_progress')
      .select('*')
      .in('track_id', trackIds);

    if (progresses) {
      for (const p of progresses) {
        progressMap.set(p.track_id, p);
      }
    }
  }

  const trackByDocId = new Map<string, AudioTrackRow>();
  for (const t of tracks ?? []) {
    trackByDocId.set(t.document_id, t);
  }

  // 4. Combine into LibraryItem array
  return docs.map((doc) => {
    const track = trackByDocId.get(doc.id);
    const progress = track ? progressMap.get(track.id) : undefined;
    return {
      document: doc,
      track,
      progress,
    };
  });
}

