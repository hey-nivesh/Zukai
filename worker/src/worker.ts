import { config } from './config.js';
import { supabaseAdmin } from './supabase/client.js';
import {
  claimNextJob,
  heartbeatJob,
  completeJob,
  failJob,
  ClaimedJob,
} from './supabase/rpc.js';
import { extractDocumentContent } from './extraction/extractor.js';
import { generateExplanationScript } from './intelligence/scriptWriter.js';
import { synthesizeSpeech } from './synthesis/ttsEngine.js';

let isRunning = false;

export async function processJob(job: ClaimedJob): Promise<void> {
  console.log(`[Worker] Claimed job ${job.job_id} for doc ${job.document_id} (${job.language}, ${job.depth})`);

  try {
    // 1. Download document from Supabase Storage (uploads bucket)
    await heartbeatJob(job.job_id, 15, 'Extracting text and structure from document');

    const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage
      .from('uploads')
      .download(job.document_storage_path);

    if (downloadError || !fileBlob) {
      throw new Error(`STORAGE_DOWNLOAD_FAILED: Could not download ${job.document_storage_path} (${downloadError?.message})`);
    }

    const arrayBuffer = await fileBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Extract Text Content
    const extracted = await extractDocumentContent(
      buffer,
      job.mime_type,
      job.document_storage_path
    );

    console.log(`[Worker] Extracted ${extracted.wordCount} words across ${extracted.pageCount} pages.`);

    // 3. Generate Spoken Script via Gemini AI
    await heartbeatJob(job.job_id, 45, 'Synthesizing plain spoken explanation with Gemini');

    const script = await generateExplanationScript(
      extracted.text,
      job.language,
      job.depth,
      job.document_storage_path.split('/').pop() || 'Document'
    );

    console.log(`[Worker] Generated script with ${script.chapters.length} chapters.`);

    // 4. Synthesize Audio & Align Karaoke Timestamps
    await heartbeatJob(job.job_id, 75, 'Synthesizing neural voice narration and timestamps');

    const audioResult = await synthesizeSpeech(script.chapters, job.voice);

    // 5. Upload Mastered Audio to Supabase Storage (audio bucket)
    await heartbeatJob(job.job_id, 90, 'Uploading audio and mastering chapter transcripts');

    const targetAudioPath = `${job.owner_id}/${job.job_id}/final.${audioResult.format}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('audio')
      .upload(targetAudioPath, audioResult.audioBuffer, {
        contentType: audioResult.format === 'wav' ? 'audio/wav' : 'audio/mp4',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`AUDIO_UPLOAD_FAILED: ${uploadError.message}`);
    }

    // 6. Complete Job via Atomic RPC
    await completeJob({
      jobId: job.job_id,
      storagePath: targetAudioPath,
      durationSeconds: audioResult.durationSeconds,
      format: audioResult.format,
      bitrateKbps: audioResult.bitrateKbps,
      fileSizeBytes: audioResult.fileSizeBytes,
      chapters: audioResult.chapters,
      transcripts: audioResult.transcripts,
      inputTokens: Math.floor(extracted.wordCount * 1.3),
      outputTokens: Math.floor(script.totalWords * 1.3),
      ttsCharacters: script.chapters.reduce((acc, c) => acc + c.text.length, 0),
      costMicros: 4500, // estimated $0.0045 compute
    });

    console.log(`[Worker] Job ${job.job_id} successfully COMPLETED (${audioResult.durationSeconds}s audio).`);
  } catch (err: any) {
    console.error(`[Worker] Job ${job.job_id} FAILED:`, err.message);
    const errorCode = err.message.split(':')[0] || 'PROCESSING_ERROR';
    await failJob(job.job_id, errorCode, err.message).catch((failErr) => {
      console.error(`[Worker] failJob RPC also failed:`, failErr);
    });
  }
}

export async function runWorkerPollCycle(): Promise<boolean> {
  try {
    const job = await claimNextJob(600);
    if (job) {
      await processJob(job);
      return true; // Had work
    }
    return false; // Queue empty
  } catch (err: any) {
    // If Supabase is unreachable or no job, log and continue
    if (!err.message?.includes('claimNextJob')) {
      console.warn('[Worker] Poll cycle error:', err.message);
    }
    return false;
  }
}

export function startWorkerLoop(): void {
  if (isRunning) return;
  isRunning = true;
  console.log(`[Worker] Starting background polling loop (interval: ${config.POLL_INTERVAL_MS}ms)`);

  const loop = async () => {
    while (isRunning) {
      const hadWork = await runWorkerPollCycle();
      const delay = hadWork ? 500 : config.POLL_INTERVAL_MS;
      await new Promise((res) => setTimeout(res, delay));
    }
  };

  loop().catch((err) => {
    console.error('[Worker] Fatal loop crash:', err);
    isRunning = false;
  });
}

export function stopWorkerLoop(): void {
  isRunning = false;
}

