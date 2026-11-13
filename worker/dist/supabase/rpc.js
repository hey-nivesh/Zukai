import { supabaseAdmin } from './client.js';
export async function claimNextJob(vtSeconds = 600) {
    const { data, error } = await supabaseAdmin.rpc('claim_next_job', {
        p_vt_seconds: vtSeconds,
    });
    if (error) {
        throw new Error(`claimNextJob RPC error: ${error.message} (${error.code})`);
    }
    return data ?? null;
}
export async function heartbeatJob(jobId, progress, currentStep) {
    const { data, error } = await supabaseAdmin.rpc('heartbeat_job', {
        p_job_id: jobId,
        p_progress: progress ?? null,
        p_current_step: currentStep ?? null,
    });
    if (error) {
        throw new Error(`heartbeatJob RPC error: ${error.message} (${error.code})`);
    }
    return Boolean(data);
}
export async function completeJob(params) {
    const { data, error } = await supabaseAdmin.rpc('complete_job', {
        p_job_id: params.jobId,
        p_storage_path: params.storagePath,
        p_duration_seconds: params.durationSeconds,
        p_format: params.format,
        p_bitrate_kbps: params.bitrateKbps,
        p_file_size_bytes: params.fileSizeBytes,
        p_chapters: params.chapters,
        p_transcripts: params.transcripts,
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
export async function failJob(jobId, errorCode, errorMessage) {
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
