import { test, describe } from 'node:test';
import assert from 'node:assert';
import { validateMagicBytes } from '../src/extraction/magicBytes.js';
import { cleanExtractedText } from '../src/extraction/extractor.js';
import { mapErrorToCode, WORKER_ERROR_CODES, WorkerError } from '../src/errors.js';
import { calculateGeminiCostMicros } from '../src/intelligence/scriptWriter.js';

describe('Magic Byte File Validation', () => {
  test('recognizes standard PDF magic bytes (%PDF-)', () => {
    const pdfHeader = Buffer.from('%PDF-1.7\n%some content');
    const result = validateMagicBytes(pdfHeader);
    assert.strictEqual(result.extension, 'pdf');
    assert.strictEqual(result.detectedMime, 'application/pdf');
  });

  test('recognizes plain text without binary control characters', () => {
    const textBuffer = Buffer.from('Simple plain text file contents\nSecond line.');
    const result = validateMagicBytes(textBuffer);
    assert.strictEqual(result.extension, 'txt');
    assert.strictEqual(result.detectedMime, 'text/plain');
  });

  test('throws EMPTY_DOCUMENT when buffer is 0 bytes', () => {
    assert.throws(
      () => validateMagicBytes(Buffer.alloc(0)),
      (err: any) => err.code === WORKER_ERROR_CODES.EMPTY_DOCUMENT
    );
  });

  test('throws UNSUPPORTED_FILE on executable binaries', () => {
    const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]); // MZ executable header
    assert.throws(
      () => validateMagicBytes(exeBuffer),
      (err: any) => err.code === WORKER_ERROR_CODES.UNSUPPORTED_FILE
    );
  });
});

describe('Text Normalization & Prompt Sanitization', () => {
  test('fixes hyphenated line breaks', () => {
    const input = 'This is a con-\nnected sentence with archi-\r\ntecture.';
    const cleaned = cleanExtractedText(input);
    assert.ok(cleaned.includes('connected'));
    assert.ok(cleaned.includes('architecture'));
  });

  test('strips binary control characters while keeping whitespace and newlines', () => {
    const input = 'Valid text\x00\x07with\x08control\x1Fcharacters\nLine 2';
    const cleaned = cleanExtractedText(input);
    assert.strictEqual(cleaned, 'Valid textwithcontrolcharacters\nLine 2');
  });
});

describe('Error Mapping & Accounting', () => {
  test('maps password errors to PASSWORD_PROTECTED', () => {
    const err = new Error('The PDF is encrypted with password');
    const mapped = mapErrorToCode(err);
    assert.strictEqual(mapped.code, WORKER_ERROR_CODES.PASSWORD_PROTECTED);
    assert.strictEqual(mapped.isRetryable, false);
  });

  test('maps rate limit 429 to retryable AI_UNAVAILABLE', () => {
    const err = new Error('GoogleGenerativeAI: 429 ResourceExhausted');
    const mapped = mapErrorToCode(err);
    assert.strictEqual(mapped.code, WORKER_ERROR_CODES.AI_UNAVAILABLE);
    assert.strictEqual(mapped.isRetryable, true);
  });

  test('calculates Gemini 1.5 Flash micro-dollar costs accurately', () => {
    // 100,000 input tokens ($0.0075) + 20,000 output tokens ($0.006) = $0.0135 = 13,500 micros
    const micros = calculateGeminiCostMicros(100_000, 20_000);
    assert.strictEqual(micros, 13500);
  });
});

