import { test, describe } from 'node:test';
import assert from 'node:assert';
import { extractPlainText } from '../src/extraction/textExtractor.js';
import { synthesizeSpeech } from '../src/synthesis/ttsEngine.js';

describe('Worker Text Extraction', () => {
  test('extracts word and page count from text buffer', () => {
    const sampleText = 'Zukai is an enterprise AI audio learning application designed for busy professionals.';
    const buffer = Buffer.from(sampleText, 'utf-8');
    const result = extractPlainText(buffer);

    assert.strictEqual(result.metadata.word_count, 12);
    assert.strictEqual(result.metadata.page_count, 1);
    assert.strictEqual(result.sections[0].text, sampleText);
  });

  test('throws EMPTY_DOCUMENT for 0-byte buffer', () => {
    const buffer = Buffer.from('', 'utf-8');
    assert.throws(() => extractPlainText(buffer), (err: any) => err.code === 'EMPTY_DOCUMENT');
  });
});

describe('Speech Synthesis & Karaoke Alignment', () => {
  test('generates sentence-level timestamps and valid audio buffer', async () => {
    const sampleChapters = [
      {
        title: 'Chapter 1: Foundations',
        summary: 'Overview of core thesis',
        text: 'This is the first sentence. Here is the second sentence with an analogy.',
      },
    ];

    const result = await synthesizeSpeech(sampleChapters, 'alloy');

    assert.ok(result.audioBuffer.length > 44, 'Audio buffer has valid audio data');
    assert.ok(result.format === 'm4a' || result.format === 'wav', 'Format is m4a or wav');
    assert.ok(result.durationSeconds > 0, 'Duration is positive');
    assert.strictEqual(result.chapters.length, 1);
    assert.strictEqual(result.transcripts.segments.length, 2, 'Two discrete sentences extracted');
    assert.ok(result.transcripts.segments[1].start_ms > result.transcripts.segments[0].start_ms);
  });
});

