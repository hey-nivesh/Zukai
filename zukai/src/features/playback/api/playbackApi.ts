/**
 * ZUKAI PLAYBACK API REPOSITORY
 * Location: /zukai/src/features/playback/api/playbackApi.ts
 * Description: Data access layer for cross-device playback progress tracking
 */

import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

export type PlaybackProgressRow = Database['public']['Tables']['playback_progress']['Row'];

export interface UpdatePlaybackParams {
  trackId: string;
  positionSeconds: number;
  speed?: number;
  completed?: boolean;
}

export async function updatePlaybackProgress(params: UpdatePlaybackParams): Promise<PlaybackProgressRow> {
  const { data, error } = await supabase.rpc('update_playback_progress', {
    p_track_id: params.trackId,
    p_position_seconds: params.positionSeconds,
    p_speed: params.speed ?? 1.0,
    p_completed: params.completed ?? false,
  });

  if (error) throw error;
  return data;
}

export async function fetchPlaybackProgress(trackId: string): Promise<PlaybackProgressRow | null> {
  const { data, error } = await supabase
    .from('playback_progress')
    .select('*')
    .eq('track_id', trackId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

