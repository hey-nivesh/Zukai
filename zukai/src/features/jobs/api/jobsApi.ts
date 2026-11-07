/**
 * ZUKAI AUDIO JOBS API REPOSITORY
 * Location: /zukai/src/features/jobs/api/jobsApi.ts
 * Description: Data access layer for audio jobs and Realtime subscriptions
 */

import { supabase } from '@/lib/supabase';
import { Database, AudioLanguage, DepthMode } from '@/types/database';

export type AudioJobRow = Database['public']['Tables']['audio_jobs']['Row'];

export interface CreateAudioJobParams {
  documentId: string;
  language?: AudioLanguage;
  depth?: DepthMode;
  voice?: string;
}

export async function createAudioJob(params: CreateAudioJobParams): Promise<AudioJobRow> {
  const { data, error } = await supabase.rpc('create_audio_job', {
    p_document_id: params.documentId,
    p_language: params.language ?? 'english',
    p_depth: params.depth ?? 'standard',
    p_voice: params.voice ?? 'alloy',
  });

  if (error) throw error;
  return data;
}

export async function fetchJobById(jobId: string): Promise<AudioJobRow | null> {
  const { data, error } = await supabase
    .from('audio_jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function cancelAudioJob(jobId: string): Promise<AudioJobRow> {
  const { data, error } = await supabase.rpc('cancel_audio_job', {
    p_job_id: jobId,
  });

  if (error) throw error;
  return data;
}

