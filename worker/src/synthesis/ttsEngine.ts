import { ScriptChapter } from '../intelligence/scriptWriter.js';
import { ChapterInput, TranscriptSentence } from '../supabase/rpc.js';

export interface SynthesizedAudioResult {
  audioBuffer: Buffer;
  durationSeconds: number;
  format: string;
  bitrateKbps: number;
  fileSizeBytes: number;
  chapters: ChapterInput[];
  transcripts: {
    raw_text: string;
    segments: TranscriptSentence[];
  };
}

/**
 * Creates a valid PCM/WAV audio buffer containing an audible tone
 * or speech envelope for local playback testing.
 */
function createSyntheticAudioBuffer(durationSeconds: number): Buffer {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = numSamples * 2; // 16-bit mono
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF identifier
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // SubChunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(1, 22);  // NumChannels (1 mono)
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
  buffer.writeUInt16LE(2, 32);  // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate subtle pleasant ambient tone (440Hz / 220Hz modulated)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Envelope: fade in 0.5s, fade out 0.5s
    const envelope = Math.min(1, t / 0.5) * Math.min(1, (durationSeconds - t) / 0.5);
    const sample = Math.sin(2 * Math.PI * 220 * t) * 0.15 * envelope;
    const intSample = Math.floor(sample * 32767);
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer;
}

export async function synthesizeSpeech(
  chapters: ScriptChapter[],
  voice: string = 'alloy'
): Promise<SynthesizedAudioResult> {
  const wordsPerMinute = 150;
  const msPerWord = (60 / wordsPerMinute) * 1000; // ~400ms

  let currentTimeMs = 0;
  const processedChapters: ChapterInput[] = [];
  const allSegments: TranscriptSentence[] = [];
  const rawTextParts: string[] = [];

  for (let cIdx = 0; cIdx < chapters.length; cIdx++) {
    const ch = chapters[cIdx];
    const chapterStartSec = Math.floor(currentTimeMs / 1000);

    // Split chapter text into discrete sentences
    const rawSentences = ch.text.match(/[^.!?]+[.!?]+/g) || [ch.text];

    for (const rawSen of rawSentences) {
      const sentenceText = rawSen.trim();
      if (!sentenceText) continue;

      const words = sentenceText.split(/\s+/).filter(Boolean);
      const sentenceDurationMs = Math.max(1200, Math.floor(words.length * msPerWord));

      const startMs = currentTimeMs;
      const endMs = startMs + sentenceDurationMs;

      allSegments.push({
        start_ms: startMs,
        end_ms: endMs,
        text: sentenceText,
      });

      rawTextParts.push(sentenceText);
      currentTimeMs = endMs + 350; // 350ms natural spoken pause
    }

    const chapterEndSec = Math.floor(currentTimeMs / 1000);

    processedChapters.push({
      title: ch.title,
      start_seconds: chapterStartSec,
      end_seconds: chapterEndSec,
      position: cIdx + 1,
      summary: ch.summary,
    });
  }

  const totalDurationSeconds = Math.max(10, Math.ceil(currentTimeMs / 1000));
  const audioBuffer = createSyntheticAudioBuffer(totalDurationSeconds);

  return {
    audioBuffer,
    durationSeconds: totalDurationSeconds,
    format: 'wav',
    bitrateKbps: 352,
    fileSizeBytes: audioBuffer.length,
    chapters: processedChapters,
    transcripts: {
      raw_text: rawTextParts.join(' '),
      segments: allSegments,
    },
  };
}

