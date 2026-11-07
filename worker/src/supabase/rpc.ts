import { supabaseAdmin } from './client.js';

export interface ClaimedJob {
  job_id: string;
  document_id: string;
  owner_id: string;
  org_id: string | null;
  language: 'english' | 'hinglish';
  depth: 'quick' | 'standard' | 'deep';
  voice: string;
  attempt_count: number;
  document_storage_path: string;
  mime_type: string;
  file_size_bytes: number;
}

export interface ChapterInput {
  title: string;
  start_seconds: number;
  end_seconds: number;
  position: number;
  summary?: string;
}

export interface TranscriptSentence {
  start_ms: number;
  end_ms: number;
  text: string;
}

export interface CompleteJobParams {
  jobId: string;
  storagePath: string;
  durationSeconds: number;
  format: string;
  bitrateKbps: number;
  fileSizeBytes: number;
  chapters: ChapterInput[];
  transcripts: {
    raw_text: string;
    segments: TranscriptSentence[];
  };
  inputTokens?: number;
  outputTokens?: number;
  ttsCharacters?: number;
  costMicros?: number;
}

export async function claimNextJob(vtSeconds = 600): Promise<ClaimedJob | null> {
  const { data, error } = await supabaseAdmin.rpc('claim_next_job', {
    p_vt_seconds: vtSeconds,
  });

  if (error) {
    throw new Error(`claimNextJob RPC error: ${error.message} (${error.code})`);
  }

  return (data as ClaimedJob) ?? null;
}

export async function heartbeatJob(
  jobId: string,
  progress: number,
  currentStep: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc('heartbeat_job', {
    p_job_id: jobId,
    p_progress: progress,
    p_current_step: currentStep,
  });

  if (error) {
    throw new Error(`heartbeatJob RPC error: ${error.message} (${error.code})`);
  }

  return Boolean(data);
}

export async function completeJob(params: CompleteJobParams): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc('complete_job', {
    p_job_id: params.jobId,
    p_storage_path: params.storagePath,
    p_duration_seconds: params.durationSeconds,
    p_format: params.format,
    p_bitrate_kbps: params.bitrateKbps,
    p_file_size_bytes: params.fileSizeBytes,
    p_chapters: params.chapters as any,
    p_transcripts: params.transcripts as any,
    p_input_tokens: params.inputTokens ?? 0,
    p_output_tokens: params.outputTokens ?? 0,
    p_tts_characters: params.ttsCharacters ?? 0,
    p_cost_micros: params.costMicros ?? 0,
  });

  if (error) {
    throw new Error(`completeJob RPC error: ${error.message} (${error.code})`);
  }

  return data;
}

export async function failJob(
  jobId: string,
  errorCode: string,
  errorMessage: string
): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc('fail_job', {
    p_job_id: jobId,
    p_error_code: errorCode,
    p_error_message: errorMessage,
  });

  if (error) {
    throw new Error(`failJob RPC error: ${error.message} (${error.code})`);
  }

  return data;
}

