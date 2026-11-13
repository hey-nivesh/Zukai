import { WorkerError, WORKER_ERROR_CODES } from '../errors.js';

export interface FileValidationResult {
  detectedMime: string;
  extension: 'pdf' | 'docx' | 'pptx' | 'txt';
}

/**
 * Validates real file type by magic byte inspection, not filename or client MIME header.
 */
export function validateMagicBytes(buffer: Buffer): FileValidationResult {
  if (buffer.length === 0) {
    throw new WorkerError(
      WORKER_ERROR_CODES.EMPTY_DOCUMENT,
      'The uploaded file is empty (0 bytes).',
      false
    );
  }

  // 1. PDF: %PDF- (0x25 0x50 0x44 0x46 0x2D)
  if (
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return { detectedMime: 'application/pdf', extension: 'pdf' };
  }

  // 2. PKZip (DOCX / PPTX): PK\x03\x04 (0x50 0x4B 0x03 0x04)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    const rawString = buffer.toString('utf-8', 0, Math.min(buffer.length, 4000));
    if (rawString.includes('ppt/') || rawString.includes('powerpoint')) {
      return {
        detectedMime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        extension: 'pptx',
      };
    }
    return {
      detectedMime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
    };
  }

  // 3. Plain text UTF-8 / ASCII inspection
  let isBinary = false;
  const sampleLength = Math.min(buffer.length, 1024);
  for (let i = 0; i < sampleLength; i++) {
    const byte = buffer[i];
    // Check for null bytes or control characters outside standard whitespace
    if (byte === 0 || (byte < 7 && byte !== 9 && byte !== 10 && byte !== 13)) {
      isBinary = true;
      break;
    }
  }

  if (!isBinary) {
    return { detectedMime: 'text/plain', extension: 'txt' };
  }

  throw new WorkerError(
    WORKER_ERROR_CODES.UNSUPPORTED_FILE,
    'Unsupported file format or invalid file signature.',
    false
  );
}

