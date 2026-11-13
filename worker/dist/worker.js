import { config } from './config.js';
import { supabaseAdmin } from './supabase/client.js';
import { claimNextJob, heartbeatJob, completeJob, failJob, } from './supabase/rpc.js';
import { extractDocumentContent } from './extraction/extractor.js';
import { generateExplanationScript, PROMPT_VERSION } from './intelligence/scriptWriter.js';
import { synthesizeSpeech } from './synthesis/ttsEngine.js';
import { mapErrorToCode, WorkerError, WORKER_ERROR_CODES } from './errors.js';
import { logger } from './logger.js';
let isRunning = false;
let activeJobCount = 0;
let shouldStop = false;
/**
 * Checks whether user canceled job mid-flight.
 */
async function isJobCanceled(jobId) {
    const { data } = await supabaseAdmin
        .from('audio_jobs')
        .select('status')
        .eq('id', jobId)
        .single();
    return data?.status === 'canceled';
}
/**
 * Single job lifecycle state machine:
 * queued -> extracting (0-20) -> scripting (20-55) -> voicing (55-90) -> assembling (90-98) -> ready (100)
 */
export async function processJob(job) {
    logger.info({ jobId: job.job_id, docId: job.document_id, language: job.language, depth: job.depth }, 'Claimed audio job');
    // Start visibility heartbeat timer
    const heartbeatTimer = setInterval(async () => {
        try {
            await heartbeatJob(job.job_id);
        }
        catch (e) {
            logger.warn({ err: e, jobId: job.job_id }, 'Failed to send visibility heartbeat');
        }
    }, config.HEARTBEAT_INTERVAL_MS);
    try {
        // Stage 1: Extraction (progress 0 - 20)
        await heartbeatJob(job.job_id, 10, 'Downloading original document');
        if (await isJobCanceled(job.job_id)) {
            throw new WorkerError(WORKER_ERROR_CODES.CANCELED, 'Job was canceled by user', false);
        }
        const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage
            .from('uploads')
            .download(job.document_storage_path);
        if (downloadError || !fileBlob) {
            throw new WorkerError(WORKER_ERROR_CODES.STORAGE_ERROR, `Could not download original document from uploads storage.`, true);
        }
        const arrayBuffer = await fileBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await heartbeatJob(job.job_id, 18, 'Extracting and cleaning text sections');
        const extracted = await extractDocumentContent(buffer, job.mime_type, job.document_storage_path);
        // Update document table with verified stats
        await supabaseAdmin
            .from('documents')
            .update({
            page_count: extracted.metadata.page_count,
            word_count: extracted.metadata.word_count,
            source_language: extracted.metadata.detected_language,
        })
            .eq('id', job.document_id);
        // Stage 2: Scripting (progress 20 - 55)
        if (await isJobCanceled(job.job_id)) {
            throw new WorkerError(WORKER_ERROR_CODES.CANCELED, 'Job was canceled by user', false);
        }
        await heartbeatJob(job.job_id, 25, 'Generating outline and explanatory analogies');
        const combinedText = extracted.sections.map((s) => s.text).join('\n\n');
        const originalFilename = job.document_storage_path.split('/').pop() || 'Document';
        const script = await generateExplanationScript(combinedText, job.language, job.depth, originalFilename);
        await heartbeatJob(job.job_id, 50, 'Drafting punchy spoken sentences and takeaways');
        // Stage 3: Voicing (progress 55 - 90)
        if (await isJobCanceled(job.job_id)) {
            throw new WorkerError(WORKER_ERROR_CODES.CANCELED, 'Job was canceled by user', false);
        }
        await heartbeatJob(job.job_id, 65, 'Synthesizing voice narration and sentence timestamps');
        const audioResult = await synthesizeSpeech(script.chapters, job.voice);
        // Stage 4: Assembling & Mastering (progress 90 - 98)
        if (await isJobCanceled(job.job_id)) {
            throw new WorkerError(WORKER_ERROR_CODES.CANCELED, 'Job was canceled by user', false);
        }
        await heartbeatJob(job.job_id, 92, 'Mastering audio loudness and uploading final track');
        const targetAudioPath = `${job.owner_id}/${job.job_id}/final.${audioResult.format}`;
        const { error: uploadError } = await supabaseAdmin.storage
            .from('audio')
            .upload(targetAudioPath, audioResult.audioBuffer, {
            contentType: audioResult.format === 'm4a' ? 'audio/mp4' : 'audio/wav',
            upsert: true,
        });
        if (uploadError) {
            throw new WorkerError(WORKER_ERROR_CODES.STORAGE_ERROR, `Failed to store synthesized audio track: ${uploadError.message}`, true);
        }
        // Stage 5: Ready (progress 100)
        await completeJob({
            jobId: job.job_id,
            storagePath: targetAudioPath,
            durationSeconds: audioResult.durationSeconds,
            format: audioResult.format,
            bitrateKbps: audioResult.bitrateKbps,
            fileSizeBytes: audioResult.fileSizeBytes,
            chapters: audioResult.chapters,
            transcripts: audioResult.transcripts,
            inputTokens: script.inputTokens,
            outputTokens: script.outputTokens,
            ttsCharacters: script.chapters.reduce((sum, c) => sum + c.text.length, 0),
            costMicros: script.costMicros,
        });
        // Record quality metadata for telemetry, prompt tracking, and audit
        try {
            await supabaseAdmin
                .from('audio_jobs')
                .update({
                quality_meta: {
                    prompt_version: PROMPT_VERSION,
                    model: config.GEMINI_SCRIPT_MODEL,
                    voice: job.voice,
                    normalizer_version: '1.0.0',
                    duration_seconds: audioResult.durationSeconds,
                    chapters_count: audioResult.chapters.length,
                },
            })
                .eq('id', job.job_id);
        }
        catch (metaErr) {
            logger.warn({ metaErr, jobId: job.job_id }, 'Failed to persist quality_meta to audio_job');
        }
        logger.info({ jobId: job.job_id, duration: audioResult.durationSeconds }, 'Job completed successfully');
    }
    catch (err) {
        const errorDetails = mapErrorToCode(err);
        logger.error({ jobId: job.job_id, code: errorDetails.code, msg: errorDetails.message }, 'Job failed');
        // Atomically report failure to database queue RPC
        try {
            await failJob(job.job_id, errorDetails.code, errorDetails.message);
        }
        catch (failRpcErr) {
            logger.error({ failRpcErr, jobId: job.job_id }, 'Failed to invoke fail_job RPC');
        }
    }
    finally {
        clearInterval(heartbeatTimer);
    }
}
/**
 * Worker polling loop with concurrency limiter and exponential backoff
 */
export async function startWorkerLoop() {
    if (isRunning)
        return;
    isRunning = true;
    shouldStop = false;
    logger.info({ concurrency: config.CONCURRENCY }, 'Worker polling loop started');
    while (!shouldStop) {
        if (activeJobCount >= config.CONCURRENCY) {
            await new Promise((r) => setTimeout(r, 1000));
            continue;
        }
        try {
            const job = await claimNextJob(config.VISIBILITY_TIMEOUT_SECONDS);
            if (job) {
                activeJobCount++;
                processJob(job)
                    .catch((err) => {
                    logger.error({ err, jobId: job.job_id }, 'Unhandled exception in processJob');
                })
                    .finally(() => {
                    activeJobCount--;
                });
            }
            else {
                // Sleep when queue is empty
                await new Promise((r) => setTimeout(r, config.POLL_INTERVAL_MS));
            }
        }
        catch (err) {
            logger.error({ err }, 'Error during claimNextJob polling');
            await new Promise((r) => setTimeout(r, 5000));
        }
    }
    logger.info('Worker loop cleanly stopped');
    isRunning = false;
}
export async function stopWorker() {
    shouldStop = true;
    logger.info('Stopping worker; awaiting active jobs...');
    while (activeJobCount > 0) {
        await new Promise((r) => setTimeout(r, 500));
    }
    logger.info('All active worker jobs completed or released');
}
