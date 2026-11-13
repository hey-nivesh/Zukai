/**
 * ZUKAI AUDIO TRACKS & CHAPTERS API REPOSITORY
 * Location: /zukai/src/features/tracks/api/tracksApi.ts
 * Description: Data access layer for audio tracks, chapters, transcripts, and signed streaming URLs
 */

import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

export type AudioTrackRow = Database['public']['Tables']['audio_tracks']['Row'];
export type ChapterRow = Database['public']['Tables']['chapters']['Row'];
export type TranscriptRow = Database['public']['Tables']['transcripts']['Row'];

export async function fetchTrackByJobId(jobId: string): Promise<AudioTrackRow | null> {
  const { data, error } = await supabase
    .from('audio_tracks')
    .select('*')
    .eq('job_id', jobId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchTracksByDocumentId(documentId: string): Promise<AudioTrackRow[]> {
  const { data, error } = await supabase
    .from('audio_tracks')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchTrackById(trackId: string): Promise<AudioTrackRow | null> {
  const { data, error } = await supabase
    .from('audio_tracks')
    .select('*')
    .eq('id', trackId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchChapters(trackId: string): Promise<ChapterRow[]> {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('track_id', trackId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchTranscript(trackId: string): Promise<TranscriptRow | null> {
  const { data, error } = await supabase
    .from('transcripts')
    .select('*')
    .eq('track_id', trackId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Generates short-lived (60 minute) signed URL for secure streaming playback
 */
export async function getSignedAudioUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('audio')
    .createSignedUrl(storagePath, 3600);

  if (error) throw error;
  return data.signedUrl;
}

